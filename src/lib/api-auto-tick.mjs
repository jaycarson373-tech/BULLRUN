export function apiAutoTickEnabled(env) {
  // Production race/payout transitions belong to the single Railway worker.
  // A public page/API request must never become a second scheduler.
  if (env.NODE_ENV === "production") return false;
  return (env.API_ENABLE_AUTO_TICK ?? "true") !== "false";
}
