import { config } from "@/lib/config";
import { round, sum } from "@/lib/math";
import type { Bull, Distribution, PayoutPlan, PayoutRecipient, Race } from "@/types/domain";

import { getTokenHolderBalances, type TokenHolderBalance } from "../holders/helius-holder-service";
import type { BullrunRepository } from "../repositories/types";
import { recalculateSeasonTreasury } from "../distributions/distribution-service";
import { transferSolToRecipients } from "./solana-transfer-service";

function excludedWallets(): Set<string> {
  const wallets = [
    config.winningBullRewardVault,
    config.bullrunHolderRewardVault,
    config.championshipVaultWallet,
    ...(config.excludedHolderWallets?.split(",") ?? []),
  ];

  return new Set(wallets.map((wallet) => wallet?.trim()).filter((wallet): wallet is string => Boolean(wallet)));
}

function buildWeightedRecipients(
  holders: TokenHolderBalance[],
  totalSol: number,
  excluded: Set<string>,
): PayoutRecipient[] {
  const eligible = holders.filter((holder) => holder.amount > 0 && !excluded.has(holder.owner));
  const firstPassTotal = sum(eligible.map((holder) => holder.amount));

  if (firstPassTotal <= 0 || totalSol <= 0) {
    return [];
  }

  const aboveMinimum = eligible.filter((holder) => (holder.amount / firstPassTotal) * totalSol >= config.minPayoutSol);
  const finalWeight = sum(aboveMinimum.map((holder) => holder.amount));

  if (finalWeight <= 0) {
    return [];
  }

  return aboveMinimum.map((holder) => ({
    wallet: holder.owner,
    tokenAmount: round(holder.amount, 6),
    amountSol: round((holder.amount / finalWeight) * totalSol, 9),
  }));
}

function requireMint(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required for payout snapshots.`);
  }

  return value;
}

function requireVault(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required for payout execution.`);
  }

  return value;
}

export async function buildPayoutPlan(options: {
  distribution: Distribution;
  winningBull: Bull;
  generatedAt?: Date;
}): Promise<PayoutPlan> {
  const bullrunMint = requireMint(config.bullrunMint, "BULLRUN_MINT");
  const excluded = excludedWallets();
  const [winningBullHolders, bullrunHolders] = await Promise.all([
    getTokenHolderBalances(options.winningBull.tokenMint),
    getTokenHolderBalances(bullrunMint),
  ]);
  const bullrunEligible = new Map(
    bullrunHolders
      .filter((holder) => holder.amount >= config.bullrunMinHolding && !excluded.has(holder.owner))
      .map((holder) => [holder.owner, holder] as const),
  );
  const winningEligible = winningBullHolders.filter((holder) => bullrunEligible.has(holder.owner));
  const bullrunEligibleHolders = [...bullrunEligible.values()];

  return {
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    winningBullMint: options.winningBull.tokenMint,
    bullrunMint,
    minBullrunHolding: config.bullrunMinHolding,
    winningBullRecipients: buildWeightedRecipients(winningEligible, options.distribution.winnerAmount, excluded),
    bullrunRecipients: buildWeightedRecipients(bullrunEligibleHolders, options.distribution.holderAmount, excluded),
    championshipTransfer: config.championshipVaultWallet
      ? {
          wallet: config.championshipVaultWallet,
          tokenAmount: 0,
          amountSol: round(options.distribution.championshipAmount, 9),
        }
      : null,
    excludedWallets: [...excluded],
  };
}

function assertPlanExecutable(plan: PayoutPlan): void {
  if (plan.winningBullRecipients.length === 0) {
    throw new Error("No eligible winning bull recipients after BULLRUN minimum and min payout filters.");
  }

  if (plan.bullrunRecipients.length === 0) {
    throw new Error("No eligible BULLRUN recipients after minimum and min payout filters.");
  }

  if (!plan.championshipTransfer) {
    throw new Error("CHAMPIONSHIP_VAULT_WALLET is required.");
  }
}

async function markDistributionFailed(
  repo: BullrunRepository,
  distribution: Distribution,
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : "Payout execution failed";
  await repo.upsertDistribution({ ...distribution, txStatus: "failed", failedReason: message });
  await repo.appendLog("error", "Distribution payout failed", {
    distributionId: distribution.id,
    raceId: distribution.raceId,
    error: message,
  });
}

export async function executeDistributionPayout(repo: BullrunRepository, distribution: Distribution): Promise<void> {
  const race = await repo.getRace(distribution.raceId);
  if (!race) {
    throw new Error("Distribution race not found.");
  }

  const winningBull = await repo.getBull(distribution.winningBull);
  if (!winningBull) {
    throw new Error("Winning bull not found.");
  }

  const plan = distribution.payoutPlan ?? (await buildPayoutPlan({ distribution, winningBull }));
  assertPlanExecutable(plan);
  const championshipTransfer = plan.championshipTransfer;
  if (!championshipTransfer) {
    throw new Error("CHAMPIONSHIP_VAULT_WALLET is required.");
  }

  const signatures: string[] = [];
  const winningResult = await transferSolToRecipients({
    privateKey: requireVault(config.winningBullRewardPrivateKey, "WINNING_BULL_REWARD_PRIVATE_KEY"),
    expectedPublicKey: requireVault(config.winningBullRewardVault, "WINNING_BULL_REWARD_VAULT"),
    recipients: plan.winningBullRecipients,
  });
  signatures.push(...winningResult.signatures);

  const bullrunResult = await transferSolToRecipients({
    privateKey: requireVault(config.bullrunHolderRewardPrivateKey, "BULLRUN_HOLDER_REWARD_PRIVATE_KEY"),
    expectedPublicKey: requireVault(config.bullrunHolderRewardVault, "BULLRUN_HOLDER_REWARD_VAULT"),
    recipients: plan.bullrunRecipients,
  });
  signatures.push(...bullrunResult.signatures);

  const championshipResult = await transferSolToRecipients({
    privateKey: requireVault(config.championshipVaultPrivateKey, "CHAMPIONSHIP_VAULT_PRIVATE_KEY"),
    expectedPublicKey: requireVault(config.championshipVaultWallet, "CHAMPIONSHIP_VAULT_WALLET"),
    recipients: [championshipTransfer],
  });
  signatures.push(...championshipResult.signatures);

  const completedAt = new Date().toISOString();
  await repo.upsertDistribution({
    ...distribution,
    payoutPlan: plan,
    txStatus: "complete",
    completedAt,
    txSignatures: [...distribution.txSignatures, ...signatures],
    failedReason: null,
  });

  await repo.upsertRace({ ...race, distributionComplete: true });
  await repo.updateSeason(recalculateSeasonTreasury(await repo.getSeason(), await repo.getDistributions()));
  await repo.appendLog("info", "Distribution payout executed", {
    distributionId: distribution.id,
    raceId: distribution.raceId,
    winningRecipients: plan.winningBullRecipients.length,
    bullrunRecipients: plan.bullrunRecipients.length,
    signatures,
  });
}

export async function executeReadyDistributions(repo: BullrunRepository): Promise<void> {
  if (!config.payoutExecutionEnabled) {
    return;
  }

  const distributions = await repo.getDistributions();
  const ready = distributions.filter((distribution) => distribution.txStatus === "ready");

  for (const distribution of ready) {
    try {
      await executeDistributionPayout(repo, distribution);
    } catch (error) {
      await markDistributionFailed(repo, distribution, error);
    }
  }
}

export async function attachPayoutPlanToDistribution(
  repo: BullrunRepository,
  race: Race,
  distribution: Distribution,
): Promise<Distribution> {
  const winningBull = race.winner ? await repo.getBull(race.winner) : null;
  if (!winningBull) {
    return distribution;
  }

  try {
    return {
      ...distribution,
      payoutPlan: await buildPayoutPlan({
        distribution,
        winningBull,
        generatedAt: race.snapshotEnd?.[winningBull.id]?.recordedAt
          ? new Date(race.snapshotEnd[winningBull.id].recordedAt)
          : new Date(),
      }),
    };
  } catch (error) {
    await repo.appendLog("warn", "Payout snapshot plan could not be generated", {
      distributionId: distribution.id,
      raceId: race.id,
      error: error instanceof Error ? error.message : "Unknown payout plan error",
    });
    return distribution;
  }
}
