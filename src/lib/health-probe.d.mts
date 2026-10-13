export declare function probeDependency(
  probe: () => Promise<{ error: unknown | null }>,
): Promise<boolean>;
