import type { Keypair } from "@solana/web3.js";

export function keypairFromPrivateKey(privateKey: string): Promise<Keypair>;
