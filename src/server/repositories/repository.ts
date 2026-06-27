import { isSupabaseConfigured } from "@/lib/config";

import { MemoryRepository } from "./memory-repository";
import { SupabaseRepository } from "./supabase-repository";
import type { BullrunRepository } from "./types";

let repository: BullrunRepository | null = null;

export function getRepository(): BullrunRepository {
  if (!repository) {
    repository = isSupabaseConfigured() ? new SupabaseRepository() : new MemoryRepository();
  }

  return repository;
}
