# BULLRUN v1

Sports-style crypto league MVP built with Next.js 16, TypeScript, Tailwind, Supabase, and a Railway worker.

## Local

```bash
npm install
npm run dev
```

Without Supabase env vars the app runs against seeded in-memory data. The local admin key is `dev-admin`.

## Supabase

1. Run `supabase/schema.sql` in your Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Seed the season:

```bash
npm run seed -- --reset
```

Set `SEASON_START_ISO` before seeding to lock the 82-race schedule to a production start time.

If the database already exists, run `supabase/payouts.sql` once before enabling automated payouts.

## Worker

Railway can run the worker as either a daemon or one-shot cron.

```bash
npm run worker
npm run worker:tick
```

Use `WORKER_MODE=daemon` for 30-second market-cap refreshes, or `WORKER_MODE=cron` for a single tick per Railway cron execution.

## Environment

Copy `.env.example` to `.env.local` for the Vercel app and to Railway variables for the worker. The market-cap service uses deterministic mock caps unless Helius or `MARKET_CAP_API_URL` is configured.

For the fixed-supply BULLRUN setup, set `TOKEN_FIXED_SUPPLY=1000000000`. Displayed market cap is `live price * 1B`, and race winners are selected by the highest market cap among the 4 bulls at the race end snapshot. `HELIUS_API_KEY` enables CA-based price lookup through Helius `getAsset` when Helius returns `token_info.price_info`; `MARKET_CAP_API_URL` can still override this with direct market caps or prices.

Set `NEXT_PUBLIC_BULLRUN_CA` and `NEXT_PUBLIC_BULLRUN_X_URL` to show the header CA copy button and X link. Footer buttons appear when `NEXT_PUBLIC_PUMP_FUN_URL`, `NEXT_PUBLIC_DEXSCREENER_URL`, `NEXT_PUBLIC_BUY_BULLRUN_URL`, or `NEXT_PUBLIC_COINGECKO_URL` are set.

Automated payouts are Railway-only and are disabled unless `PAYOUT_EXECUTION_ENABLED=true`. The worker snapshots holders at race completion, requires winning-bull holders to also hold at least `BULLRUN_MIN_HOLDING`, weights both payout groups by token holdings, filters payouts below `MIN_PAYOUT_SOL`, and sends SOL from the configured reward vault private keys. Fund the reward wallets before enabling this, or set `PAYOUT_SPLIT_FROM_CLAIM_WALLET=true` to first split the race amount from `CLAIM_WALLET_PRIVATE_KEY`/`PAYOUT_SIGNER_PRIVATE_KEY` into the two reward wallets plus the Championship Vault.

After changing launch bulls or resetting production data, run:

```bash
npm run seed -- --reset
```

With Supabase env vars set, this clears prior season rows and seeds the 16 launch bulls, a clean 82-race schedule, zero standings, zero vault totals, and no previous winners.
