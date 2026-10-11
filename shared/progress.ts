import { deriveWorld, initialState, isRecord, parseTimeFoldState, type Game, type TimeFoldState } from './timefold.ts';

export const progressKey = 'timefold.progress.v1';

export function encodeProgress(game: Game): string {
  return JSON.stringify({ schemaVersion: 1, ...game });
}

export function decodeProgress(raw: string | null): Game | null {
  if (!raw || raw.length > 32768) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!isRecord(value) || value.schemaVersion !== 1 || (value.unlocked !== 1 && value.unlocked !== 2 && value.unlocked !== 3)
    || typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0
    || !Array.isArray(value.history) || value.history.length > 64 || value.history.length > value.revision) return null;
  const state = parseTimeFoldState(value.state);
  if (!state) return null;
  const history: TimeFoldState[] = [];
  const items: unknown[] = value.history;
  for (const item of items) {
    const snapshot = parseTimeFoldState(item);
    if (!snapshot) return null;
    history.push(snapshot);
  }
  for (const snapshot of [state, ...history]) {
    const world = deriveWorld(snapshot);
    if (value.unlocked < 2 && (world.powered || snapshot.gear !== initialState.gear || snapshot.lens !== initialState.lens || snapshot.alignment !== initialState.alignment)) return null;
    if (value.unlocked < 3 && (world.aimed || snapshot.crystal !== initialState.crystal || snapshot.frequency !== initialState.frequency)) return null;
  }
  return { state, unlocked: value.unlocked, revision: value.revision, history };
}

export function createSaveQueue(write: (value: string) => Promise<void>) {
  let tail = Promise.resolve();
  return {
    save(game: Game) {
      const snapshot = encodeProgress(game);
      const pending = tail.then(() => write(snapshot));
      tail = pending.catch(() => {});
      return pending;
    },
    whenIdle: () => tail,
  };
}
