import { verifyProductionOrigin } from "../src/lib/production-origin-check.mjs";

const origin = process.env.NEXT_PUBLIC_SITE_URL;
if (!origin) {
  console.error("Set NEXT_PUBLIC_SITE_URL to the canonical HTTPS production origin.");
  process.exit(2);
}

let parsedOrigin;
try {
  parsedOrigin = new URL(origin);
} catch {
  console.error("NEXT_PUBLIC_SITE_URL must be a valid URL.");
  process.exit(2);
}

if (parsedOrigin.protocol !== "https:" && parsedOrigin.hostname !== "localhost") {
  console.error("Production preflight requires HTTPS (localhost is allowed for local checks).");
  process.exit(2);
}

const result = await verifyProductionOrigin(parsedOrigin.origin);
for (const route of result.results) {
  const state = route.ok ? "PASS" : "FAIL";
  const status = route.status ? ` HTTP ${route.status}` : "";
  console.log(`${state} ${route.path}${status}${route.reason ? `: ${route.reason}` : ""}`);
}

if (!result.ok) {
  console.error("Production origin is not serving a healthy BULLRUN API. Check the Vercel project/domain binding and database configuration.");
  process.exit(1);
}

console.log("BULLRUN API origin and persistent database checks pass.");
