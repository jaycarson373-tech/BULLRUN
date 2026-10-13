import { isSupabaseConfigured } from "@/lib/config";

import { MemoryRepository } from "./memory-repository";
import { SupabaseRepository } from "./supabase-repository";
import type { BullrunRepository } from "./types";

let repository: BullrunRepository | null = null;

export function getRepository(): BullrunRepository {
  if (!repository) {
    if (isSupabaseConfigured()) {
      repository = new SupabaseRepository();
    } else if (process.env.NODE_ENV === "production" && process.env.TEST_MODE !== "true") {
      throw new Error(
        "Persistent storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before serving production race data.",
      );
    } else {
      repository = new MemoryRepository();
    }
  }

  return repository;
}
