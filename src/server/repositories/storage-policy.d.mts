export function productionRequiresPersistentStorage(env: NodeJS.ProcessEnv): boolean;
export function persistentStorageUnavailableError(): Error & { status: number };
