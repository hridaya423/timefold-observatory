export type TimeFoldState = Readonly<{
  cell: 'home' | 'main' | 'spare';
  fuse: 'home' | 'protected' | 'bypass';
  gear: 'home' | 'drive';
  lens: 'home' | 'optic';
  alignment: 'left' | 'target' | 'right';
  crystal: 'home' | 'receiver';
  frequency: 'low' | 'target' | 'high';
}>;

export const initialState: TimeFoldState = {
  cell: 'home',
  fuse: 'home',
  gear: 'home',
  lens: 'home',
  alignment: 'left',
  crystal: 'home',
  frequency: 'low',
};

export function deriveWorld(state: TimeFoldState) {
  const powered = state.cell === 'main' && state.fuse === 'protected';
  const aimed = powered && state.gear === 'drive' && state.lens === 'optic' && state.alignment === 'target';
  const signalRecovered = aimed && state.crystal === 'receiver' && state.frequency === 'target';
  return { powered, aimed, signalRecovered };
}

export type Chapter = 1 | 2 | 3;
export type Game = Readonly<{
  state: TimeFoldState;
  unlocked: Chapter;
  revision: number;
  history: readonly TimeFoldState[];
}>;
export type GameAction = {
  [Field in keyof TimeFoldState]: { kind: 'change'; field: Field; value: TimeFoldState[Field] }
}[keyof TimeFoldState] | { kind: 'undo' } | { kind: 'resetChapter'; chapter: Chapter };

export function newGame(): Game {
  return { state: { ...initialState }, unlocked: 1, revision: 0, history: [] };
}

export const fieldChapters: Readonly<Record<keyof TimeFoldState, Chapter>> = {
  cell: 1, fuse: 1, gear: 2, lens: 2, alignment: 2, crystal: 3, frequency: 3,
};
const fields: (keyof TimeFoldState)[] = ['cell', 'fuse', 'gear', 'lens', 'alignment', 'crystal', 'frequency'];

export function reduceGame(game: Game, action: GameAction): Game {
  const revision = game.revision + 1;
  if (!Number.isSafeInteger(revision)) return game;
  if (action.kind === 'undo') {
    const state = game.history.at(-1);
    return state ? { ...game, state, history: game.history.slice(0, -1), revision } : game;
  }
  if (action.kind === 'change' && fieldChapters[action.field] > game.unlocked) return game;
  if (action.kind === 'resetChapter' && action.chapter > game.unlocked) return game;
  const state: TimeFoldState = action.kind === 'change'
    ? { ...game.state, [action.field]: action.value }
    : action.chapter === 1
      ? { ...game.state, cell: initialState.cell, fuse: initialState.fuse }
      : action.chapter === 2
        ? { ...game.state, gear: initialState.gear, lens: initialState.lens, alignment: initialState.alignment }
        : { ...game.state, crystal: initialState.crystal, frequency: initialState.frequency };
  if (fields.every(field => state[field] === game.state[field])) return game;
  const world = deriveWorld(state);
  const unlocked: Chapter = game.unlocked === 3 || world.aimed ? 3 : game.unlocked === 2 || world.powered ? 2 : 1;
  return { state, unlocked, revision, history: [...game.history, game.state].slice(-64) };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function choice<Value extends string>(value: unknown, choices: readonly Value[]): value is Value {
  return choices.some(item => item === value);
}

export function parseTimeFoldState(value: unknown): TimeFoldState | null {
  if (!isRecord(value)) return null;
  const { cell, fuse, gear, lens, alignment, crystal, frequency } = value;
  if (!choice(cell, ['home', 'main', 'spare']) || !choice(fuse, ['home', 'protected', 'bypass'])
    || !choice(gear, ['home', 'drive']) || !choice(lens, ['home', 'optic'])
    || !choice(alignment, ['left', 'target', 'right']) || !choice(crystal, ['home', 'receiver'])
    || !choice(frequency, ['low', 'target', 'high'])) return null;
  return { cell, fuse, gear, lens, alignment, crystal, frequency };
}
