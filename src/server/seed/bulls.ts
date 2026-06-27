import type { Bull } from "@/types/domain";

const names = [
  ["cented", "Daumen Bull", "DaumenBull", "/images/bulls/daumen-bull.jpg", "DvXrGq4gFaaq2CjYxvesrC2ybGVDpfrkVshvKnRZpump"],
  ["gake", "Ethan ProsBull", "ProsBull", "/images/bulls/ethan-prosbull.jpg", "9sErMXkXJdNyffGAh6QraTwC5VsbgGJbCnErXBxepump"],
  ["traderpow", "Alon Bull", "AlonBull", "/images/bulls/alon-bull.jpg", "GhtHMugsmxbMh7kH8Jgo6bdUWhXjrGk8oVWVKRstpump"],
  ["jack-duval", "Beanz Bull", "BeanzBull", "/images/bulls/beanz-bull.jpg", "A28PG8tKxMfmgsTzPq2ncWQwNcrLWUVtDKeSmk5kpump"],
  ["scharo", "Yenni Bull", "YenniBull", "/images/bulls/yenni-bull.jpg", "368Rs66tV8gKHZvP8wsbpgey25y1iGAyiKB2PWJTpump"],
  ["yenni", "Orangie Bull", "OrangBull", "/images/bulls/orangie-bull.jpg", "941GhZTNcB2wYKhYoLYfvx9TdWY1iyRbR3YR24Mypump"],
  ["alxcooks", "Bullsey", "Bullsey", "/images/bulls/bullsey.jpg", "FB6e9Sk4pA5w7E7tBygKu933oDn26bJ44ck9577zpump"],
  ["alon", "Cented Bull", "CentedBull", "/images/bulls/cented-bull.jpg", "FEgv4fW4DdCywHf7WpL8cEY6VQnCtwFvikP6DGgzpump"],
  ["beanz", "BullPow", "BullPow", "/images/bulls/bullpow.jpg", "6U1t42phUpvoMHz4qjR8T1mMr1DatWRMY3gSpp1Tpump"],
  ["daumen", "Gake Bull", "GakeBull", "/images/bulls/gake-bull.jpg", "FLdBASHFHY8ZH6cd3Gh3WYyQcTPRhhtWjvhKy41vpump"],
  ["cupsey", "Alx Bull", "AlxBull", "/images/bulls/alx-bull.jpg", "FLdBASHFHY8ZH6cd3Gh3WYyQcTPRhhtWjvhKy41vpump"],
  ["orangie", "Duve Bull", "DuveBull", "/images/bulls/duve-bull.jpg", "FUVJiqgg6iQGowe6bDqKW4Gs8KBi6sxDkZdDFD9Jpump"],
  ["the-black-bull", "Shaams Bull", "ShaamsBull", "/images/bulls/shaams-bull.jpg", "GU2HSvF4AUNxctTKbH716U3CFXMyKFoGeRymLmA2pump"],
  ["murad", "Muram Bull", "MuramBull", "/images/bulls/muram-bull.jpg", "GJp1eD4dBRKYRNBcdbvCRXaQws3EVqJMdSqa6Vs7pump"],
  ["shaams", "Scharo Bull", "ScharoBull", "/images/bulls/scharo-bull.jpg", "55V4cXcczcLNtXJb1A67dYWDzZtAogwSVuKtvkfspump"],
  ["ethan-prosper", "The Black Bull", "BlackBull", "/images/bulls/the-black-bull.jpg", "Ff6J4ZBMjq4YbZ6cvKgGb4jYRN5DqAB9U7YDHoCJpump"],
] as const;

export const seedBulls: Bull[] = names.map(([id, name, ticker, image, tokenMint], index) => ({
  id,
  name,
  ticker,
  tokenMint,
  image,
  feeWallet: `FeeWallet${String(index + 1).padStart(2, "0")}111111111111111111111111111111`,
  wins: 0,
  losses: 0,
  races: 0,
  totalPercentGain: 0,
  averageFinish: 0,
  seasonRank: index + 1,
}));
