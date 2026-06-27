import type { Bull } from "@/types/domain";

const names = [
  ["cented", "Cented", "CENT"],
  ["gake", "Gake", "GAKE"],
  ["traderpow", "Traderpow", "TPOW"],
  ["jack-duval", "Jack Duval", "JACK"],
  ["scharo", "Scharo", "SCHAR"],
  ["yenni", "Yenni", "YENNI"],
  ["alxcooks", "Alxcooks", "ALX"],
  ["alon", "Alon", "ALON"],
  ["beanz", "Beanz", "BEANZ"],
  ["daumen", "Daumen", "DAUM"],
  ["cupsey", "Cupsey", "CUP"],
  ["orangie", "Orangie", "ORNG"],
  ["the-black-bull", "The Black Bull", "BLACK"],
  ["murad", "Murad", "MURAD"],
  ["shaams", "Shaams", "SHAMS"],
  ["ethan-prosper", "Ethan Prosper", "ETHAN"],
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
