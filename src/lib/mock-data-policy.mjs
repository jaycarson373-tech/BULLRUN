export function mockMarketDataEnabled(env) {
  return env.NODE_ENV !== "production" && env.TEST_MODE === "true";
}
