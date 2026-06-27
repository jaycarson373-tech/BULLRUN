import { isSupabaseConfigured } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { seedBulls } from "@/server/seed/bulls";
import { createInitialSeason, generateSeasonSchedule, getSeasonStart } from "@/server/seed/schedule";
import { getRepository } from "@/server/repositories/repository";

async function clearSupabaseSeasonData() {
  if (!isSupabaseConfigured()) {
    return;
  }

  const client = getSupabaseAdmin();
  const deletes = [
    client.from("distributions").delete().neq("id", "__seed_keep__"),
    client.from("races").delete().neq("id", "__seed_keep__"),
    client.from("seasons").delete().neq("id", "__seed_keep__"),
    client.from("bulls").delete().neq("id", "__seed_keep__"),
    client.from("system_logs").delete().neq("level", "__seed_keep__"),
  ];

  for (const deletion of deletes) {
    const { error } = await deletion;
    if (error) {
      throw new Error(error.message);
    }
  }
}

async function main() {
  const repo = getRepository();
  const reset = process.argv.includes("--reset");

  if (reset) {
    await clearSupabaseSeasonData();
  }

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
