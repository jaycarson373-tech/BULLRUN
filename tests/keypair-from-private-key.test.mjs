import assert from "node:assert/strict";
import test from "node:test";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { keypairFromPrivateKey } from "../src/server/payouts/keypair-from-private-key.mjs";

test("loads a payout keypair from base58 and JSON byte-array formats", async () => {
  const source = await Keypair.generate();
  const base58Keypair = await keypairFromPrivateKey(bs58.encode(source.secretKey));
  const jsonKeypair = await keypairFromPrivateKey(JSON.stringify(Array.from(source.secretKey)));

  assert.equal(base58Keypair.publicKey.toBase58(), source.publicKey.toBase58());
  assert.equal(jsonKeypair.publicKey.toBase58(), source.publicKey.toBase58());
});

test("rejects malformed payout key material", async () => {
  await assert.rejects(() => keypairFromPrivateKey("not-a-private-key"));
});
