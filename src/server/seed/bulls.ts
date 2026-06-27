import type { Bull } from "@/types/domain";

const names = [
  ["ansem", "Ansem", "ANSM"],
  ["murad", "Murad", "MURAD"],
  ["hsaka", "Hsaka", "HSAKA"],
  ["rookie", "Rookie", "ROOKIE"],
  ["cobie", "Cobie", "COBIE"],
  ["pentoshi", "Pentoshi", "PENT"],
  ["gcr", "GCR", "GCR"],
  ["loomdart", "Loomdart", "LOOM"],
  ["cl", "CL", "CL"],
  ["bluntz", "Bluntz", "BLNTZ"],
  ["sherpa", "Sherpa", "SHRP"],
  ["rager", "Rager", "RAGER"],
  ["mayne", "Mayne", "MAYNE"],
  ["salsa", "Salsa", "SALSA"],
  ["ledger", "Ledger", "LEDGR"],
  ["vector", "Vector", "VCTR"],
] as const;

export const seedBulls: Bull[] = names.map(([id, name, ticker], index) => ({
  id,
  name,
  ticker,
  tokenMint: `BR${String(index + 1).padStart(2, "0")}111111111111111111111111111111111111`,
  image: "",
  feeWallet: `FeeWallet${String(index + 1).padStart(2, "0")}111111111111111111111111111111`,
  wins: 0,
  losses: 0,
  races: 0,
  totalPercentGain: 0,
  averageFinish: 0,
  seasonRank: index + 1,
}));
