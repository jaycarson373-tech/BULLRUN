import { isSupabaseConfigured } from "@/lib/config";
import { persistentStorageUnavailableError, productionRequiresPersistentStorage } from "./storage-policy.mjs";

import { MemoryRepository } from "./memory-repository";
import { SupabaseRepository } from "./supabase-repository";
import type { BullrunRepository } from "./types";

let repository: BullrunRepository | null = null;

export function getRepository(): BullrunRepository {
  if (!repository) {
    if (isSupabaseConfigured()) {
      repository = new SupabaseRepository();
    } else if (productionRequiresPersistentStorage(process.env)) {
      throw persistentStorageUnavailableError();
    } else {
      repository = new MemoryRepository();
    }
  }

  return repository;
}
