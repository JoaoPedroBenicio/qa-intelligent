type Migration<State> = (persistedState: unknown, version: number) => State;

export function createMigrations<State>(
  migrations: Record<number, Migration<State>>,
): (persistedState: unknown, version: number) => State {
  for (const key of Object.keys(migrations)) {
    const n = Number(key);
    if (!Number.isFinite(n)) {
      console.warn(
        `[persist] migrations key "${key}" is not numeric and will be ignored`,
      );
    }
  }
  return (persistedState, version) => {
    let state = (persistedState ?? {}) as State;
    const targetVersion = Math.max(
      0,
      ...Object.keys(migrations).map(Number).filter((v) => Number.isFinite(v)),
    );
    for (let v = version; v < targetVersion; v++) {
      const migrator = migrations[v + 1];
      if (!migrator) continue;
      try {
        state = migrator(state, v);
      } catch (err) {
        console.warn(
          `[persist] migration v${v}→v${v + 1} failed, resetting`,
          err,
        );
        return {} as State;
      }
    }
    return state;
  };
}
