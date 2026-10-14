export function productionRequiresPersistentStorage(env) {
  return env.NODE_ENV === "production";
}
