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

## Worker

Railway can run the worker as either a daemon or one-shot cron.

```bash
npm run worker
npm run worker:tick
```

Use `WORKER_MODE=daemon` for 30-second market-cap refreshes, or `WORKER_MODE=cron` for a single tick per Railway cron execution.

## Environment

Copy `.env.example` to `.env.local` for the Vercel app and to Railway variables for the worker. The market-cap service uses deterministic mock caps unless Helius or `MARKET_CAP_API_URL` is configured.

For the fixed-supply BULLRUN setup, set `TOKEN_FIXED_SUPPLY=1000000000`. With every bull token fixed at 1B supply, displayed market cap is `live price * 1B`, and race ranking is equivalent to highest percentage price gain. `HELIUS_API_KEY` enables CA-based price lookup through Helius `getAsset` when Helius returns `token_info.price_info`; `MARKET_CAP_API_URL` can still override this with direct market caps or prices.

Set `NEXT_PUBLIC_BULLRUN_CA` and `NEXT_PUBLIC_BULLRUN_X_URL` to show the header CA copy button and X link. Footer buttons appear when `NEXT_PUBLIC_PUMP_FUN_URL`, `NEXT_PUBLIC_DEXSCREENER_URL`, `NEXT_PUBLIC_BUY_BULLRUN_URL`, or `NEXT_PUBLIC_COINGECKO_URL` are set.
