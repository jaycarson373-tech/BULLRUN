/** Run a read-only dependency probe without leaking provider errors to clients. */
export async function probeDependency(probe) {
  try {
    const result = await probe();
    return result.error === null;
  } catch {
    return false;
  }
}
