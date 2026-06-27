import { runRaceEngineTick } from "@/server/race/race-engine";

runRaceEngineTick({ source: "worker" })
  .then(() => {
    console.log(`[bullrun] one-shot tick complete at ${new Date().toISOString()}`);
  })
  .catch((error) => {
    console.error("[bullrun] one-shot tick failed", error);
    process.exit(1);
  });
