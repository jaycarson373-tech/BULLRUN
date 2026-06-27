import { config } from "@/lib/config";
import { runRaceEngineTick } from "@/server/race/race-engine";
import { getRepository } from "@/server/repositories/repository";

async function runOnce(source = "worker") {
  const repo = getRepository();
  await runRaceEngineTick({ repo, source });
  console.log(`[bullrun] race engine tick complete at ${new Date().toISOString()}`);
}

async function main() {
  if (config.workerMode === "daemon") {
    console.log(`[bullrun] worker daemon started with ${config.workerPollMs}ms polling`);
    await runOnce();

    const timer = setInterval(() => {
      runOnce().catch((error) => {
        console.error("[bullrun] worker tick failed", error);
      });
    }, config.workerPollMs);

    process.on("SIGTERM", () => {
      clearInterval(timer);
      process.exit(0);
    });
    process.on("SIGINT", () => {
      clearInterval(timer);
      process.exit(0);
    });

    return;
  }

  await runOnce();
}

main().catch((error) => {
  console.error("[bullrun] worker failed", error);
  process.exit(1);
});
