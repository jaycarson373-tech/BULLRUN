"use client";

/* eslint-disable @next/next/no-img-element */

import {
  Activity,
  ArrowDown,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Crown,
  ExternalLink,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { formatClockDuration, formatDateTime } from "@/lib/time";
import type {
  CurrentRaceView,
  DashboardData,
  DistributionSummary,
  RaceHistoryView,
  Standing,
  UpcomingRaceView,
} from "@/types/domain";

import { BullAvatar } from "./bull-avatar";

const currency = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const bullrunXUrl = process.env.NEXT_PUBLIC_BULLRUN_X_URL ?? "https://x.com/TheBullRunSol_";
const bullrunCa = process.env.NEXT_PUBLIC_BULLRUN_CA;
const buyUrl = process.env.NEXT_PUBLIC_BUY_BULLRUN_URL;
const bullrunLinks = [
  { label: "Pump.fun", href: process.env.NEXT_PUBLIC_PUMP_FUN_URL },
  { label: "Dexscreener", href: process.env.NEXT_PUBLIC_DEXSCREENER_URL },
  { label: "X", href: bullrunXUrl },
  { label: "Buy $BULLRUN", href: buyUrl },
  { label: "CoinGecko", href: process.env.NEXT_PUBLIC_COINGECKO_URL },
].filter((link): link is { label: string; href: string } => Boolean(link.href));

function formatMarketCap(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  return `$${currency.format(value)}`;
}

function shortAddress(value: string): string {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function signedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${url}`);
  }

  return response.json() as Promise<T>;
}

function useLiveData(initialData: DashboardData) {
  const [data, setData] = useState(initialData);
  const [now, setNow] = useState(() => new Date(initialData.currentRace.serverTime).getTime());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const [currentRace, standings, upcomingRaces, raceHistory, distributionSummary] = await Promise.all([
        fetchJson<CurrentRaceView>("/api/current-race"),
        fetchJson<Standing[]>("/api/standings"),
        fetchJson<UpcomingRaceView[]>("/api/schedule/upcoming"),
        fetchJson<RaceHistoryView[]>("/api/races/history?limit=8"),
        fetchJson<DistributionSummary>("/api/distributions/summary"),
      ]);

      if (!cancelled) {
        setData({ currentRace, standings, upcomingRaces, raceHistory, distributionSummary });
      }
    }

    const timer = window.setInterval(refresh, 30_000);
    refresh().catch(() => undefined);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return { data, now };
}

function countdownForRace(currentRace: CurrentRaceView, now: number): number {
  if (!currentRace.race) {
    return 0;
  }

  const target = currentRace.status === "live" ? currentRace.race.endTime : currentRace.race.startTime;
  return Math.max(0, new Date(target).getTime() - now);
}

function HeaderLogo() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      <img
        src="/images/bullrun-logo.jpg"
        alt="BULLRUN"
        className="h-10 w-10 shrink-0 rounded-full border border-[#5b171d] object-cover shadow-[0_0_28px_rgba(223,16,28,0.28)]"
      />
      <span className="text-sm font-black tracking-[0.14em] text-[#f7f7f2]">BULLRUN</span>
    </Link>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#241013] bg-black/88 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <HeaderLogo />
        <TopLinks />
      </div>
    </header>
  );
}

function Hero({ currentRace, now }: { currentRace: CurrentRaceView; now: number }) {
  const countdown = countdownForRace(currentRace, now);
  const raceNumber = currentRace.race?.raceNumber ?? 0;
  const label = currentRace.status === "live" ? "Live Countdown" : "Next Countdown";

  return (
    <section className="relative min-h-[650px] overflow-hidden border-b border-[#321014] bg-black">
      <img
        src="/images/bullrun-arena.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.62]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#030303_0%,rgba(3,3,3,0.84)_34%,rgba(18,5,7,0.42)_68%,#030303_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(0deg,#050505,transparent)]" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pt-20">
        <div>
          <img
            src="/images/bullrun-logo.jpg"
            alt="BULLRUN"
            className="mb-6 h-28 w-28 rounded-full border border-[#5b171d] object-cover shadow-[0_0_46px_rgba(223,16,28,0.32)]"
          />
          <div className="mb-4 inline-flex items-center gap-2 border-l-2 border-[#df101c] bg-black/50 px-3 py-2 text-sm font-semibold text-[#f7f7f2]">
            <span className="h-2 w-2 rounded-full bg-[#df101c] live-pulse" />
            Season One
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.92] text-[#f7f7f2] sm:text-7xl lg:text-8xl">
            THE BULL RUN
          </h1>
          <p className="mt-5 max-w-xl text-lg font-semibold text-[#d8dde0] sm:text-xl">16 Bulls. 1 Winner.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#live-race"
              className="inline-flex items-center gap-2 border border-[#df101c] bg-[#df101c] px-4 py-3 text-sm font-black text-white shadow-[0_0_32px_rgba(223,16,28,0.26)] transition hover:bg-[#b80d17]"
            >
              View Live Race
              <Activity className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-[#4a171b] bg-black/70 px-4 py-3 text-sm font-black text-[#f7f7f2] transition hover:border-[#df101c]"
            >
              How It Works
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Race" value={`${raceNumber || "-"} / 82`} />
            <Metric label={label} value={formatClockDuration(countdown)} />
            <Metric label="Top 8" value="Playoffs" />
            <Metric label="Status" value={currentRace.status.toUpperCase()} />
          </div>
        </div>
        <div className="self-end border border-[#341014] bg-black/62 p-4 shadow-[0_0_44px_rgba(223,16,28,0.12)] backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-[#a8a29a]">Current Race</p>
              <p className="text-2xl font-black text-[#f7f7f2]">Race {raceNumber || "-"}</p>
            </div>
            <Activity className="h-8 w-8 text-[#df101c]" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {currentRace.competitors.map((competitor) => (
              <div key={competitor.bull.id} className="border border-[#2d1518] bg-[#090909]/90 p-3">
                <div className="flex items-center gap-3">
                  <BullAvatar bull={competitor.bull} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{competitor.bull.name}</p>
                    <p className="text-xs text-[#df101c]">${competitor.bull.ticker}</p>
                  </div>
                </div>
                <p className="mt-3 text-lg font-black">{formatMarketCap(competitor.currentMarketCap)}</p>
                <p className="text-xs text-[#a8a29a]">{signedPercent(competitor.percentChange)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TopLinks() {
  const copyCa = () => {
    if (bullrunCa) {
      navigator.clipboard.writeText(bullrunCa).catch(() => undefined);
    }
  };

  return (
    <div className="ml-auto flex min-w-0 items-center gap-2">
      <nav className="hidden items-center gap-1 md:flex">
        <a
          href="#how-it-works"
          className="px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#c8c8c4] transition hover:text-[#f7f7f2]"
        >
          How It Works
        </a>
        <a
          href="#links"
          className="px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[#c8c8c4] transition hover:text-[#f7f7f2]"
        >
          Links
        </a>
      </nav>
      {bullrunCa ? (
        <button
          type="button"
          onClick={copyCa}
          className="inline-flex max-w-[160px] items-center gap-2 border border-[#4a171b] bg-black/65 px-3 py-2 text-xs font-semibold text-[#f7f7f2] backdrop-blur-sm transition hover:border-[#df101c] sm:max-w-none"
          title="Copy contract address"
        >
          <span className="truncate">CA: {shortAddress(bullrunCa)}</span>
          <Copy className="h-3.5 w-3.5 shrink-0 text-[#df101c]" aria-hidden="true" />
        </button>
      ) : (
        <span className="inline-flex max-w-[160px] items-center gap-2 border border-[#4a171b] bg-black/65 px-3 py-2 text-xs font-semibold text-[#f7f7f2] backdrop-blur-sm sm:max-w-none">
          CA: soon
        </span>
      )}
      <a
        href={bullrunXUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center border border-[#4a171b] bg-black/65 text-sm font-black text-[#f7f7f2] backdrop-blur-sm transition hover:border-[#df101c]"
        title="Open BULLRUN on X"
      >
        X
      </a>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#321014] bg-black/62 px-4 py-3">
      <p className="text-xs text-[#9f9b96]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#f7f7f2]" suppressHydrationWarning>
        {value}
      </p>
    </div>
  );
}

function CurrentRace({ currentRace }: { currentRace: CurrentRaceView }) {
  const sorted = [...currentRace.competitors].sort((a, b) => b.currentMarketCap - a.currentMarketCap);
  const leader = sorted[0];

  return (
    <section id="live-race" className="relative overflow-hidden border-b border-[#241013] bg-[#070707]">
      <img src="/images/bullrun-arena-live.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.34]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#050505_0%,rgba(5,5,5,0.72)_42%,#050505_100%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[#df101c]">Live Race Preview</p>
            <h2 className="text-3xl font-black text-[#f7f7f2]">Four-Bull Market Cap Sprint</h2>
          </div>
          <div className="text-sm text-[#c8c8c4]">Winner = highest market cap at race end</div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {sorted.map((competitor, index) => (
              <article key={competitor.bull.id} className="border border-[#301316] bg-[#101010]/92 p-4 shadow-[0_0_28px_rgba(0,0,0,0.35)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <BullAvatar bull={competitor.bull} />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold">{competitor.bull.name}</p>
                      <p className="text-sm text-[#df101c]">${competitor.bull.ticker}</p>
                    </div>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center border border-[#5b171d] bg-black text-sm font-black text-[#f7f7f2]">
                    {index + 1}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[#8f8a80]">Market Cap</dt>
                    <dd className="font-semibold">{formatMarketCap(competitor.currentMarketCap)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#8f8a80]">% Change</dt>
                    <dd className={competitor.percentChange >= 0 ? "font-semibold text-[#f7f7f2]" : "font-semibold text-[#ff525d]"}>
                      {signedPercent(competitor.percentChange)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="min-h-[420px] border border-[#301316] bg-[#0a0a0a]/92 p-4">
            <div className="mb-4 flex items-center justify-between text-sm text-[#a8a29a]">
              <span>Start</span>
              <span>{leader ? `Leader: ${leader.bull.name}` : "Leader: -"}</span>
              <span>Finish</span>
            </div>
            <div className="race-scanline grid gap-5 overflow-hidden bg-[#050505] p-4">
              {currentRace.competitors.map((competitor) => (
                <div key={competitor.bull.id} className="relative h-20 border-y border-[#241013] bg-[#0c0c0c]">
                  <div className="absolute inset-y-0 right-6 w-px bg-[#df101c]/75" />
                  <div
                    className="absolute top-1/2 flex -translate-y-1/2 items-center gap-3 transition-[left] duration-700 ease-out"
                    style={{ left: `calc(${competitor.position}% - 34px)` }}
                  >
                    <BullAvatar bull={competitor.bull} size="sm" />
                    <div className="hidden border border-[#421519] bg-black px-2 py-1 text-xs font-semibold text-[#f7f7f2] sm:block">
                      {competitor.bull.ticker} {formatMarketCap(competitor.currentMarketCap)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Hold 100K+ BULLRUN", "Minimum holder eligibility for season distributions."],
    ["4 bulls enter the arena", "Every 90 minutes, one scheduled race goes live."],
    ["Highest ending market cap wins", "The bull with the largest market cap when the 90-minute race ends wins."],
    ["Fees split after races", "50% winning bull holders, 25% BULLRUN holders, 25% Championship Vault."],
  ] as const;

  return (
    <section id="how-it-works" className="relative overflow-hidden border-b border-[#241013] bg-[#050505]">
      <img src="/images/bullrun-arena-gate.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.36]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505,rgba(5,5,5,0.68),#050505)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-semibold text-[#df101c]">How It Works</p>
          <h2 className="text-3xl font-black text-[#f7f7f2]">Season One rules, clean and brutal.</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map(([title, body], index) => (
            <article key={title} className="border border-[#301316] bg-black/70 p-5 backdrop-blur-sm">
              <p className="mb-4 text-sm font-black text-[#df101c]">STEP {index + 1}</p>
              <h3 className="text-lg font-black text-[#f7f7f2]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#b9b9b4]">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BullsGrid({ standings }: { standings: Standing[] }) {
  return (
    <section className="border-b border-[#241013] bg-[#070707]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Users className="h-6 w-6 text-[#df101c]" aria-hidden="true" />
          <h2 className="text-2xl font-black">16 Bulls</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {standings.map((standing) => (
            <article key={standing.id} className="border border-[#301316] bg-[#101010] p-4">
              <div className="flex items-center gap-3">
                <BullAvatar bull={standing} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-black">{standing.name}</p>
                  <p className="text-sm text-[#df101c]">${standing.ticker}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-[#8f8a80]">Record</dt>
                  <dd className="font-bold">{standing.wins}-{standing.losses}</dd>
                </div>
                <div>
                  <dt className="text-[#8f8a80]">Races</dt>
                  <dd className="font-bold">{standing.races}</dd>
                </div>
                <div>
                  <dt className="text-[#8f8a80]">Avg</dt>
                  <dd className="font-bold">{signedPercent(standing.averageGain)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Standings({ standings }: { standings: Standing[] }) {
  return (
    <section className="bg-[#050505]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <Trophy className="h-6 w-6 text-[#df101c]" aria-hidden="true" />
          <h2 className="text-2xl font-black">Standings</h2>
        </div>
        <div className="overflow-x-auto border border-[#301316]">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[#141111] text-[#a8a29a]">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Bull</th>
                <th className="px-4 py-3">Wins</th>
                <th className="px-4 py-3">Losses</th>
                <th className="px-4 py-3">Average Gain</th>
                <th className="px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing) => (
                <tr key={standing.id} className="border-t border-[#251316] bg-[#0c0c0c]">
                  <td className="px-4 py-3 font-black text-[#df101c]">{standing.seasonRank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <BullAvatar bull={standing} size="sm" />
                      <div>
                        <p className="font-semibold">{standing.name}</p>
                        <p className="text-xs text-[#df101c]">${standing.ticker}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{standing.wins}</td>
                  <td className="px-4 py-3">{standing.losses}</td>
                  <td className="px-4 py-3">{signedPercent(standing.averageGain)}</td>
                  <td className="px-4 py-3 font-bold">{standing.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Upcoming({ upcoming, now }: { upcoming: UpcomingRaceView[]; now: number }) {
  return (
    <section className="border-y border-[#241013] bg-[#090909]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <CalendarClock className="h-6 w-6 text-[#df101c]" aria-hidden="true" />
          <h2 className="text-2xl font-black">Upcoming Races</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {upcoming.map((item) => (
            <article key={item.race.id} className="border border-[#301316] bg-[#111111] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#df101c]">Race {item.race.raceNumber}</p>
                  <p className="text-sm text-[#a8a29a]">{formatDateTime(item.race.startTime)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#8f8a80]">Starts In</p>
                  <p className="font-bold" suppressHydrationWarning>
                    {formatClockDuration(new Date(item.race.startTime).getTime() - now)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.bulls.map((bull) => (
                  <span key={bull.id} className="inline-flex items-center gap-2 border border-[#421519] bg-black px-2 py-1 text-sm">
                    <BullAvatar bull={bull} size="sm" />
                    {bull.ticker}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Treasury({ summary }: { summary: DistributionSummary }) {
  return (
    <section className="relative overflow-hidden bg-[#050505]">
      <img src="/images/bullrun-arena-floor.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.38]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#050505,rgba(5,5,5,0.66),#050505)]" />
      <div className="relative mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto mb-7 max-w-7xl">
          <p className="text-sm font-semibold text-[#df101c]">Championship Vault</p>
          <h2 className="text-3xl font-black text-[#f7f7f2]">The pot grows every race. Top 8 advance.</h2>
        </div>
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <TreasuryTile
            icon={<Crown className="h-6 w-6" aria-hidden="true" />}
            label="Championship Vault"
            value={`${summary.championshipVaultSol.toFixed(4)} SOL`}
          />
          <TreasuryTile
            icon={<CircleDollarSign className="h-6 w-6" aria-hidden="true" />}
            label="Total Distributed"
            value={`${summary.totalDistributedSol.toFixed(4)} SOL`}
          />
          <TreasuryTile
            icon={<ChevronRight className="h-6 w-6" aria-hidden="true" />}
            label="Last Distribution"
            value={summary.lastDistribution ? `${summary.lastDistribution.txStatus.toUpperCase()}` : "None"}
          />
        </div>
      </div>
    </section>
  );
}

function TreasuryTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="border border-[#301316] bg-[#0b0b0b]/86 p-5 backdrop-blur-sm">
      <div className="mb-4 text-[#df101c]">{icon}</div>
      <p className="text-sm text-[#a8a29a]">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function PreviousWinners({ history }: { history: RaceHistoryView[] }) {
  return (
    <section className="border-t border-[#241013] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <Crown className="h-6 w-6 text-[#df101c]" aria-hidden="true" />
          <h2 className="text-2xl font-black">Previous Winners</h2>
        </div>
        {history.length === 0 ? (
          <div className="border border-[#301316] bg-[#101010] p-6 text-sm text-[#b9b9b4]">
            No races completed yet. Season One begins soon.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {history.map((item) => (
              <article key={item.race.id} className="border border-[#301316] bg-[#111111] p-4">
                <p className="text-sm font-semibold text-[#df101c]">Race {item.race.raceNumber}</p>
                {item.winner ? (
                  <div className="mt-3 flex items-center gap-3">
                    <BullAvatar bull={item.winner} size="sm" />
                    <div>
                      <p className="font-bold">{item.winner.name}</p>
                      <p className="text-sm text-[#a8a29a]">{item.winnerPercentGain ? signedPercent(item.winnerPercentGain) : "-"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#a8a29a]">Pending</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FooterCta() {
  return (
    <section className="relative overflow-hidden border-t border-[#241013] bg-black">
      <img src="/images/bullrun-arena-smoke.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.4]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505,rgba(5,5,5,0.66),#050505)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-5 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-sm font-semibold text-[#df101c]">The arena opens soon.</p>
          <h2 className="mt-2 text-3xl font-black text-[#f7f7f2]">Season One is loading.</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {buyUrl ? (
            <a
              href={buyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-[#df101c] bg-[#df101c] px-4 py-3 text-sm font-black text-white transition hover:bg-[#b80d17]"
            >
              Buy BULLRUN
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
          <a
            href="#live-race"
            className="inline-flex items-center gap-2 border border-[#4a171b] bg-black/70 px-4 py-3 text-sm font-black text-[#f7f7f2] transition hover:border-[#df101c]"
          >
            View Live Race
            <Activity className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

function FooterLinks() {
  if (bullrunLinks.length === 0) {
    return null;
  }

  return (
    <footer id="links" className="border-t border-[#241013] bg-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <img src="/images/bullrun-logo.jpg" alt="" className="h-10 w-10 rounded-full border border-[#5b171d] object-cover" />
          <div>
            <p className="text-sm font-semibold text-[#f7f7f2]">BULLRUN</p>
            <p className="mt-1 text-sm text-[#a8a29a]">Season One market cap league</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {bullrunLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-[#2a1518] bg-[#0d0d0d] px-3 py-2 text-sm font-semibold text-[#f7f7f2] transition hover:border-[#df101c] hover:text-[#ffccd0]"
            >
              {link.label}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function RaceRules() {
  return (
    <section className="border-y border-[#241013] bg-[#090909]">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
        <Metric label="Race Length" value="90 minutes" />
        <Metric label="Winner" value="Ending market cap" />
        <Metric label="Eligibility" value="100K+ BULLRUN" />
      </div>
    </section>
  );
}

export function LiveDashboard({ initialData }: { initialData: DashboardData }) {
  const { data, now } = useLiveData(initialData);
  const currentRace = useMemo(() => data.currentRace, [data.currentRace]);

  return (
    <main className="min-h-screen bg-[#050505] text-[#f7f7f2]">
      <SiteHeader />
      <Hero currentRace={currentRace} now={now} />
      <CurrentRace currentRace={currentRace} />
      <HowItWorks />
      <BullsGrid standings={data.standings} />
      <Standings standings={data.standings} />
      <Treasury summary={data.distributionSummary} />
      <Upcoming upcoming={data.upcomingRaces} now={now} />
      <PreviousWinners history={data.raceHistory} />
      <FooterCta />
      <FooterLinks />
    </main>
  );
}

export function LiveRacePage({ initialData }: { initialData: DashboardData }) {
  const { data, now } = useLiveData(initialData);
  const currentRace = useMemo(() => data.currentRace, [data.currentRace]);

  return (
    <main className="min-h-screen bg-[#050505] text-[#f7f7f2]">
      <SiteHeader />
      <Hero currentRace={currentRace} now={now} />
      <CurrentRace currentRace={currentRace} />
      <RaceRules />
      <Upcoming upcoming={data.upcomingRaces.slice(0, 2)} now={now} />
      <FooterLinks />
    </main>
  );
}
