export function productionRequiresPersistentStorage(env) {
  return env.NODE_ENV === "production";
}

export function persistentStorageUnavailableError() {
  const error = new Error(
    "Persistent storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before serving production race data.",
  );
  error.status = 503;
  return error;
}
