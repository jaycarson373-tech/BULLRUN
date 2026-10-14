import Image from "next/image";
import Link from "next/link";

export function ProductionDataPending() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-5 py-16 text-[#f7f7f2]">
      <Image
        src="/images/bullrun-arena.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,3,3,0.96),rgba(3,3,3,0.72)),radial-gradient(circle_at_78%_42%,rgba(223,16,28,0.2),transparent_42%)]" />
      <section className="relative z-10 w-full max-w-3xl border border-[#45191d] bg-black/75 p-7 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur sm:p-12">
        <div className="mb-10 flex items-center gap-3">
          <Image src="/images/bullrun-logo.jpg" alt="" width={48} height={48} className="h-12 w-12 rounded-full border border-[#5b171d] object-cover" />
          <span className="text-sm font-black tracking-[0.16em]">BULLRUN</span>
          <span className="ml-auto border border-[#59302b] px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-[#ffc271]">RACE DATA PENDING</span>
        </div>
        <p className="mb-4 text-xs font-bold tracking-[0.2em] text-[#ff5159]">THE LIVE BOARD IS TEMPORARILY OFFLINE</p>
        <h1 className="max-w-2xl text-4xl font-black leading-[0.98] sm:text-6xl">The next race starts when the data is ready.</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#c7c4c0] sm:text-lg">
          Production race storage is not connected yet. Live standings, market caps, schedules, and prize totals will appear after the database is configured and verified.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="border border-[#df101c] bg-[#df101c] px-5 py-3 text-sm font-black text-white transition hover:bg-[#b80d17]">
            REFRESH STATUS
          </Link>
          <a href="https://x.com/TheBullRunSol_" target="_blank" rel="noreferrer" className="border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:border-white/50">
            BULLRUN ON X
          </a>
        </div>
      </section>
    </main>
  );
}
