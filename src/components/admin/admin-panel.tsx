"use client";

import {
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
  Save,
  StepForward,
  Trophy,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState, type ReactNode } from "react";

import { formatDateTime } from "@/lib/time";
import type { Bull, Distribution, Race, Season, SystemLog } from "@/types/domain";

import { BullAvatar } from "../dashboard/bull-avatar";

interface AdminState {
  bulls: Bull[];
  races: Race[];
  distributions: Distribution[];
  season: Season;
  logs: SystemLog[];
}

type Status = { tone: "idle" | "ok" | "error"; message: string };

function dateTimeInputValue(iso: string): string {
  return iso.slice(0, 16);
}

function fromDateTimeInput(value: string): string {
  return new Date(value).toISOString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Admin request failed");
  }

  return payload;
}

export function AdminPanel() {
  const [adminKey, setAdminKey] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("bullrun-admin-key") ?? "",
  );
  const [state, setState] = useState<AdminState | null>(null);
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "Enter admin key" });

  const headers = useMemo(
    () => ({
      "content-type": "application/json",
      "x-admin-key": adminKey,
    }),
    [adminKey],
  );

  async function loadState(nextKey = adminKey) {
    if (!nextKey) {
      setStatus({ tone: "error", message: "Admin key required" });
      return;
    }

    setStatus({ tone: "idle", message: "Loading" });
    const response = await fetch("/api/admin/state", {
      headers: { "x-admin-key": nextKey },
      cache: "no-store",
    });
    const payload = await parseResponse<AdminState>(response);
    window.localStorage.setItem("bullrun-admin-key", nextKey);
    setState(payload);
    setStatus({ tone: "ok", message: "Admin state loaded" });
  }

  async function adminAction(payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/actions", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    await parseResponse(response);
    await loadState();
  }

  async function saveBull(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      ticker: String(form.get("ticker") ?? ""),
      tokenMint: String(form.get("tokenMint") ?? ""),
      feeWallet: String(form.get("feeWallet") ?? ""),
      image: String(form.get("image") ?? ""),
    };

    const response = await fetch(`/api/admin/bulls/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    await parseResponse(response);
    await loadState();
  }

  async function saveRace(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const bullIds = [0, 1, 2, 3].map((index) => String(form.get(`bull${index}`) ?? "")) as [
      string,
      string,
      string,
      string,
    ];
    const payload = {
      bullIds,
      startTime: fromDateTimeInput(String(form.get("startTime"))),
      endTime: fromDateTimeInput(String(form.get("endTime"))),
      status: String(form.get("status")),
    };

    const response = await fetch(`/api/admin/races/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    await parseResponse(response);
    await loadState();
  }

  async function execute(label: string, action: () => Promise<void>) {
    try {
      setStatus({ tone: "idle", message: label });
      await action();
      setStatus({ tone: "ok", message: "Saved" });
    } catch (error) {
      setStatus({ tone: "error", message: error instanceof Error ? error.message : "Admin action failed" });
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#f5efe1]">
      <header className="border-b border-[#252525] bg-[#090909]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <Link href="/" className="text-sm text-[#d7a940] hover:text-[#f5efe1]">
              BULLRUN
            </Link>
            <h1 className="mt-2 text-3xl font-black">Admin Panel</h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="Admin key"
              className="h-10 min-w-64 border border-[#302818] bg-black px-3 text-sm text-[#f5efe1]"
              type="password"
            />
            <button
              type="button"
              title="Refresh admin state"
              onClick={() => execute("Loading", () => loadState())}
              className="inline-flex h-10 items-center justify-center gap-2 border border-[#3a3221] bg-[#151515] px-3 text-sm hover:border-[#d7a940]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div
          className={
            status.tone === "error"
              ? "border border-[#7b2027] bg-[#18090b] px-4 py-3 text-sm text-[#f3b0b5]"
              : "border border-[#302818] bg-[#101010] px-4 py-3 text-sm text-[#d7a940]"
          }
        >
          {status.message}
        </div>
      </div>

      {state ? (
        <>
          <AdminControls state={state} execute={execute} adminAction={adminAction} />
          <BullEditor bulls={state.bulls} execute={execute} saveBull={saveBull} />
          <ScheduleEditor races={state.races} bulls={state.bulls} execute={execute} saveRace={saveRace} adminAction={adminAction} />
          <DistributionQueue distributions={state.distributions} execute={execute} adminAction={adminAction} />
          <LogViewer logs={state.logs} />
        </>
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="border border-[#292929] bg-[#101010] p-8">
            <p className="text-lg font-semibold">Admin state is locked.</p>
          </div>
        </section>
      )}
    </main>
  );
}

function AdminControls({
  state,
  execute,
  adminAction,
}: {
  state: AdminState;
  execute: (label: string, action: () => Promise<void>) => Promise<void>;
  adminAction: (payload: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <section className="border-y border-[#242424] bg-[#080808]">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="border border-[#292929] bg-[#111111] p-4">
          <p className="text-sm text-[#a8a29a]">Current Race</p>
          <p className="mt-2 text-3xl font-black">{state.season.currentRace}</p>
        </div>
        <div className="border border-[#292929] bg-[#111111] p-4">
          <p className="text-sm text-[#a8a29a]">Current Week</p>
          <p className="mt-2 text-3xl font-black">{state.season.currentWeek}</p>
        </div>
        <div className="border border-[#292929] bg-[#111111] p-4">
          <p className="text-sm text-[#a8a29a]">Paused</p>
          <p className="mt-2 text-3xl font-black">{state.season.paused ? "Yes" : "No"}</p>
        </div>
        <div className="flex flex-wrap gap-2 border border-[#292929] bg-[#111111] p-4">
          <IconButton label="Pause season" onClick={() => execute("Pausing", () => adminAction({ action: "pauseSeason" }))}>
            <Pause className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <IconButton label="Resume season" onClick={() => execute("Resuming", () => adminAction({ action: "resumeSeason" }))}>
            <Play className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <IconButton label="Advance race" onClick={() => execute("Advancing", () => adminAction({ action: "advanceRace" }))}>
            <StepForward className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </section>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center border border-[#3a3221] bg-black text-[#d7a940] hover:border-[#d7a940]"
    >
      {children}
    </button>
  );
}

function BullEditor({
  bulls,
  execute,
  saveBull,
}: {
  bulls: Bull[];
  execute: (label: string, action: () => Promise<void>) => Promise<void>;
  saveBull: (id: string, event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <section className="bg-[#050505]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <Upload className="h-5 w-5 text-[#d7a940]" aria-hidden="true" />
          <h2 className="text-2xl font-black">Bulls</h2>
        </div>
        <div className="grid gap-3">
          {bulls.map((bull) => (
            <form
              key={bull.id}
              onSubmit={(event) => execute("Saving bull", () => saveBull(bull.id, event))}
              className="grid gap-3 border border-[#292929] bg-[#111111] p-4 lg:grid-cols-[220px_1fr_1fr_1fr_1fr_auto]"
            >
              <div className="flex items-center gap-3">
                <BullAvatar bull={bull} size="sm" />
                <div>
                  <p className="font-bold">{bull.name}</p>
                  <p className="text-xs text-[#d7a940]">{bull.id}</p>
                </div>
              </div>
              <AdminInput name="name" label="Name" defaultValue={bull.name} />
              <AdminInput name="ticker" label="Ticker" defaultValue={bull.ticker} />
              <AdminInput name="tokenMint" label="Token Mint" defaultValue={bull.tokenMint} />
              <AdminInput name="feeWallet" label="Fee Wallet" defaultValue={bull.feeWallet} />
              <div className="grid gap-2 lg:col-span-6 lg:grid-cols-[1fr_auto]">
                <AdminInput name="image" label="Image URL" defaultValue={bull.image} />
                <button
                  type="submit"
                  title="Save bull"
                  className="inline-flex h-11 items-center justify-center gap-2 border border-[#3a3221] bg-black px-4 text-sm text-[#d7a940] hover:border-[#d7a940]"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScheduleEditor({
  races,
  bulls,
  execute,
  saveRace,
  adminAction,
}: {
  races: Race[];
  bulls: Bull[];
  execute: (label: string, action: () => Promise<void>) => Promise<void>;
  saveRace: (id: string, event: FormEvent<HTMLFormElement>) => Promise<void>;
  adminAction: (payload: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <section className="border-y border-[#242424] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <Trophy className="h-5 w-5 text-[#d7a940]" aria-hidden="true" />
          <h2 className="text-2xl font-black">Schedule</h2>
        </div>
        <div className="grid gap-3">
          {races.map((race) => (
            <form
              key={race.id}
              onSubmit={(event) => execute("Saving race", () => saveRace(race.id, event))}
              className="grid gap-3 border border-[#292929] bg-[#111111] p-4 xl:grid-cols-[90px_170px_170px_140px_1fr_auto_auto]"
            >
              <div>
                <p className="text-xs text-[#a8a29a]">Race</p>
                <p className="text-lg font-bold text-[#d7a940]">{race.raceNumber}</p>
              </div>
              <AdminInput name="startTime" label="Start" type="datetime-local" defaultValue={dateTimeInputValue(race.startTime)} />
              <AdminInput name="endTime" label="End" type="datetime-local" defaultValue={dateTimeInputValue(race.endTime)} />
              <label className="grid gap-1 text-xs text-[#a8a29a]">
                Status
                <select name="status" defaultValue={race.status} className="h-11 border border-[#302818] bg-black px-2 text-sm text-[#f5efe1]">
                  <option value="scheduled">scheduled</option>
                  <option value="live">live</option>
                  <option value="completed">completed</option>
                  <option value="paused">paused</option>
                </select>
              </label>
              <div className="grid gap-2 sm:grid-cols-4">
                {race.bullIds.map((bullId, index) => (
                  <label key={`${race.id}-${index}`} className="grid gap-1 text-xs text-[#a8a29a]">
                    Bull {index + 1}
                    <select
                      name={`bull${index}`}
                      defaultValue={bullId}
                      className="h-11 border border-[#302818] bg-black px-2 text-sm text-[#f5efe1]"
                    >
                      {bulls.map((bull) => (
                        <option key={bull.id} value={bull.id}>
                          {bull.ticker}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <button
                type="submit"
                title="Save race"
                className="inline-flex h-11 items-center justify-center gap-2 self-end border border-[#3a3221] bg-black px-4 text-sm text-[#d7a940] hover:border-[#d7a940]"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Save
              </button>
              <button
                type="button"
                title="Override winner"
                onClick={() =>
                  execute("Overriding winner", () =>
                    adminAction({ action: "overrideWinner", raceId: race.id, winner: race.bullIds[0] }),
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 self-end border border-[#3a3221] bg-black px-4 text-sm text-[#d7a940] hover:border-[#d7a940]"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                Winner
              </button>
            </form>
          ))}
        </div>
      </div>
    </section>
  );
}

function DistributionQueue({
  distributions,
  execute,
  adminAction,
}: {
  distributions: Distribution[];
  execute: (label: string, action: () => Promise<void>) => Promise<void>;
  adminAction: (payload: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <section className="bg-[#050505]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#d7a940]" aria-hidden="true" />
          <h2 className="text-2xl font-black">Distributions</h2>
        </div>
        <div className="overflow-x-auto border border-[#292929]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#161616] text-[#a8a29a]">
              <tr>
                <th className="px-4 py-3">Race</th>
                <th className="px-4 py-3">Winner</th>
                <th className="px-4 py-3">Winning Holders</th>
                <th className="px-4 py-3">BULLRUN Holders</th>
                <th className="px-4 py-3">Vault</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Recipients</th>
                <th className="px-4 py-3">Txs</th>
                <th className="px-4 py-3">Ready</th>
                <th className="px-4 py-3">Error</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {distributions.map((distribution) => (
                <tr key={distribution.id} className="border-t border-[#252525] bg-[#0c0c0c]">
                  <td className="px-4 py-3">{distribution.raceId.replace("season-1-race-", "")}</td>
                  <td className="px-4 py-3">{distribution.winningBull}</td>
                  <td className="px-4 py-3">{distribution.winnerAmount.toFixed(4)} SOL</td>
                  <td className="px-4 py-3">{distribution.holderAmount.toFixed(4)} SOL</td>
                  <td className="px-4 py-3">{distribution.championshipAmount.toFixed(4)} SOL</td>
                  <td className="px-4 py-3">{distribution.txStatus}</td>
                  <td className="px-4 py-3">
                    {distribution.payoutPlan
                      ? `${distribution.payoutPlan.winningBullRecipients.length} / ${distribution.payoutPlan.bullrunRecipients.length}`
                      : "pending"}
                  </td>
                  <td className="px-4 py-3">{distribution.txSignatures.length}</td>
                  <td className="px-4 py-3">{formatDateTime(distribution.readyAt)}</td>
                  <td className="max-w-72 truncate px-4 py-3 text-[#f3b0b5]" title={distribution.failedReason ?? undefined}>
                    {distribution.failedReason ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      title="Mark complete"
                      disabled={distribution.txStatus === "complete"}
                      onClick={() =>
                        execute("Marking complete", () =>
                          adminAction({ action: "markDistributionComplete", distributionId: distribution.id }),
                        )
                      }
                      className="inline-flex h-9 items-center justify-center gap-2 border border-[#3a3221] bg-black px-3 text-sm text-[#d7a940] enabled:hover:border-[#d7a940] disabled:opacity-40"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Complete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function LogViewer({ logs }: { logs: SystemLog[] }) {
  return (
    <section className="border-t border-[#242424] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-2xl font-black">Logs</h2>
        <div className="grid max-h-[520px] gap-2 overflow-y-auto border border-[#292929] bg-black p-3">
          {logs.map((log) => (
            <div key={log.id} className="grid gap-1 border border-[#242424] bg-[#101010] p-3 text-sm sm:grid-cols-[160px_80px_1fr]">
              <span className="text-[#a8a29a]">{formatDateTime(log.createdAt)}</span>
              <span className={log.level === "error" ? "text-[#e16161]" : log.level === "warn" ? "text-[#d7a940]" : "text-[#7dd181]"}>
                {log.level}
              </span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminInput({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-xs text-[#a8a29a]">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="h-11 min-w-0 border border-[#302818] bg-black px-3 text-sm text-[#f5efe1]"
      />
    </label>
  );
}
