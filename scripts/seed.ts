import { seedBulls } from "@/server/seed/bulls";
import { createInitialSeason, generateSeasonSchedule, getSeasonStart } from "@/server/seed/schedule";
import { getRepository } from "@/server/repositories/repository";

async function main() {
  const repo = getRepository();
  const reset = process.argv.includes("--reset");
  const existingBulls = new Set((await repo.getBulls().catch(() => [])).map((bull) => bull.id));
  const existingRaces = new Set((await repo.getRaces().catch(() => [])).map((race) => race.id));
  const seasonStart = getSeasonStart();

  for (const bull of seedBulls) {
    if (reset || !existingBulls.has(bull.id)) {
      await repo.upsertBull(bull);
    }
  }

  const bulls = await repo.getBulls();
  const races = generateSeasonSchedule(bulls, seasonStart);

  for (const race of races) {
    if (reset || !existingRaces.has(race.id)) {
      await repo.upsertRace(race);
    }
  }

  const seasonExists = await repo.getSeason().then(
    () => true,
    () => false,
  );

  if (reset || !seasonExists) {
    await repo.updateSeason(createInitialSeason());
  }

  await repo.appendLog("info", "Seed completed", {
    reset,
    seasonStart: seasonStart.toISOString(),
    bulls: seedBulls.length,
    races: races.length,
  });

  console.log(`Seed complete. Bulls: ${seedBulls.length}. Races: ${races.length}. Reset: ${reset}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
