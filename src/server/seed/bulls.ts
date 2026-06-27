import type { Bull } from "@/types/domain";

const names = [
  ["cented", "Daumen Bull", "DaumenBull", "/images/bulls/daumen-bull.jpg"],
  ["gake", "Ethan ProsBull", "ProsBull", "/images/bulls/ethan-prosbull.jpg"],
  ["traderpow", "Alon Bull", "AlonBull", "/images/bulls/alon-bull.jpg"],
  ["jack-duval", "Beanz Bull", "BeanzBull", "/images/bulls/beanz-bull.jpg"],
  ["scharo", "Yenni Bull", "YenniBull", "/images/bulls/yenni-bull.jpg"],
  ["yenni", "Orangie Bull", "OrangBull", "/images/bulls/orangie-bull.jpg"],
  ["alxcooks", "Bullsey", "Bullsey", "/images/bulls/bullsey.jpg"],
  ["alon", "Cented Bull", "CentedBull", "/images/bulls/cented-bull.jpg"],
  ["beanz", "BullPow", "BullPow", "/images/bulls/bullpow.jpg"],
  ["daumen", "Gake Bull", "GakeBull", "/images/bulls/gake-bull.jpg"],
  ["cupsey", "Alx Bull", "AlxBull", "/images/bulls/alx-bull.jpg"],
  ["orangie", "Duve Bull", "DuveBull", "/images/bulls/duve-bull.jpg"],
  ["the-black-bull", "Shaams Bull", "ShaamsBull", "/images/bulls/shaams-bull.jpg"],
  ["murad", "Muram Bull", "MuramBull", "/images/bulls/muram-bull.jpg"],
  ["shaams", "Scharo Bull", "ScharoBull", "/images/bulls/scharo-bull.jpg"],
  ["ethan-prosper", "The Black Bull", "BlackBull", "/images/bulls/the-black-bull.jpg"],
] as const;

export const seedBulls: Bull[] = names.map(([id, name, ticker, image], index) => ({
  id,
  name,
  ticker,
  tokenMint: `BR${String(index + 1).padStart(2, "0")}111111111111111111111111111111111111`,
  image,
  feeWallet: `FeeWallet${String(index + 1).padStart(2, "0")}111111111111111111111111111111`,
  wins: 0,
  losses: 0,
  races: 0,
  totalPercentGain: 0,
  averageFinish: 0,
  seasonRank: index + 1,
}));
