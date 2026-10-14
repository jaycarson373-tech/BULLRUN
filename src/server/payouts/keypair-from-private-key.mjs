import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export async function keypairFromPrivateKey(privateKey) {
  const trimmed = privateKey.trim();

  if (trimmed.startsWith("[")) {
    const bytes = JSON.parse(trimmed);
    return await Keypair.fromSecretKey(Uint8Array.from(bytes));
  }

  return await Keypair.fromSecretKey(bs58.decode(trimmed));
}
