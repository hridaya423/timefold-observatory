import { deriveWorld, fieldChapters, newGame, reduceGame, type Chapter, type Game, type GameAction, type TimeFoldState } from './timefold.ts';

export type PuzzleField = keyof TimeFoldState;
export type ChangeAction = Extract<GameAction, { kind: 'change' }>;
export type PlacementChoice = Readonly<{ label: string; action: ChangeAction }>;
export type CausalTrace = Readonly<{ past: string; present: string; future: string; highlights: readonly PuzzleField[] }>;
export type PuzzleSession = Readonly<{ game: Game; chapter: Chapter; selected: PuzzleField | null; pendingReset: Chapter | null; trace: CausalTrace | null }>;
export type PuzzleAction = { kind: 'select'; field: PuzzleField } | { kind: 'placeChoice'; index: number }
  | { kind: 'chapter'; chapter: Chapter } | { kind: 'undo' } | { kind: 'requestReset' }
  | { kind: 'cancelReset' } | { kind: 'confirmReset'; chapter: Chapter };

export const objectNames: Readonly<Record<PuzzleField, string>> = { cell: 'Power cell', fuse: 'Protection fuse', gear: 'Drive gear', lens: 'Lens', alignment: 'Alignment', crystal: 'Receiver crystal', frequency: 'Frequency' };
export const chapterFields: Readonly<Record<Chapter, readonly PuzzleField[]>> = { 1: ['cell', 'fuse'], 2: ['gear', 'lens', 'alignment'], 3: ['crystal', 'frequency'] };
export const chapterContent: Readonly<Record<Chapter, { title: string; objective: string; story: string }>> = {
  1: { title: 'Restore power', objective: 'Repair the past circuit so the present motor and future beacon receive power.', story: 'The first keeper left a dark observatory and an unfinished promise. Begin at the workbench.' },
  2: { title: 'Restore the sky', objective: 'Complete the drive, optical path and alignment to reveal the signal star.', story: 'Light has returned, but the instrument cannot yet read the sky. Repair what connects motion to sight.' },
  3: { title: 'Recover the signal', objective: 'Restore the receiver and tune it to the marked frequency.', story: 'The signal crossed generations. Give the future keeper a way to hear it.' },
};
export const recoveredMessage = 'To the keeper who finds this room: the sky was never silent. We were waiting for someone to listen.';
const choices: Readonly<Record<PuzzleField, readonly PlacementChoice[]>> = {
  cell: [{ label: 'Bench', action: { kind: 'change', field: 'cell', value: 'home' } }, { label: 'Main socket', action: { kind: 'change', field: 'cell', value: 'main' } }, { label: 'Spare socket', action: { kind: 'change', field: 'cell', value: 'spare' } }],
  fuse: [{ label: 'Bench', action: { kind: 'change', field: 'fuse', value: 'home' } }, { label: 'Protection socket', action: { kind: 'change', field: 'fuse', value: 'protected' } }, { label: 'Bypass socket', action: { kind: 'change', field: 'fuse', value: 'bypass' } }],
  gear: [{ label: 'Bench', action: { kind: 'change', field: 'gear', value: 'home' } }, { label: 'Drive socket', action: { kind: 'change', field: 'gear', value: 'drive' } }],
  lens: [{ label: 'Bench', action: { kind: 'change', field: 'lens', value: 'home' } }, { label: 'Optical mount', action: { kind: 'change', field: 'lens', value: 'optic' } }],
  alignment: [{ label: 'Left', action: { kind: 'change', field: 'alignment', value: 'left' } }, { label: 'Target mark', action: { kind: 'change', field: 'alignment', value: 'target' } }, { label: 'Right', action: { kind: 'change', field: 'alignment', value: 'right' } }],
  crystal: [{ label: 'Bench', action: { kind: 'change', field: 'crystal', value: 'home' } }, { label: 'Receiver mount', action: { kind: 'change', field: 'crystal', value: 'receiver' } }],
  frequency: [{ label: 'Low', action: { kind: 'change', field: 'frequency', value: 'low' } }, { label: 'Target mark', action: { kind: 'change', field: 'frequency', value: 'target' } }, { label: 'High', action: { kind: 'change', field: 'frequency', value: 'high' } }],
};
export const placementChoices = (field: PuzzleField): readonly PlacementChoice[] => choices[field];
export function newPuzzleSession(game: Game = newGame()): PuzzleSession {
  return { game, chapter: 1, selected: null, pendingReset: null, trace: null };
}
export function chapterComplete(game: Game, chapter: Chapter): boolean {
  const world = deriveWorld(game.state);
  return chapter === 1 ? world.powered : chapter === 2 ? world.aimed : world.signalRecovered;
}
function traceChange(before: Game, after: Game): CausalTrace {
  const fields: readonly PuzzleField[] = [...chapterFields[1], ...chapterFields[2], ...chapterFields[3]];
  const highlights = fields.filter(field => before.state[field] !== after.state[field]);
  const past = highlights.map(field => `${objectNames[field]}: ${placementChoices(field).find(choice => choice.action.value === after.state[field])?.label ?? after.state[field]}`).join('; ');
  const world = deriveWorld(after.state);
  return {
    past,
    present: world.aimed ? 'The telescope is aligned with the signal star.' : world.powered ? 'The motor is energized; the optical chain is incomplete.' : 'The motor is silent; its power chain is incomplete.',
    future: world.signalRecovered ? 'The lost message is recovered.' : world.powered ? 'The beacon is illuminated; the lost message is not recovered.' : 'The beacon is dark; the lost message is not recovered.',
    highlights,
  };
}
export function reducePuzzle(session: PuzzleSession, action: PuzzleAction): PuzzleSession {
  if (action.kind === 'cancelReset') return session.pendingReset ? { ...session, pendingReset: null } : session;
  if (action.kind === 'requestReset') return { ...session, pendingReset: session.chapter };
  if (action.kind === 'chapter') {
    return action.chapter <= session.game.unlocked ? { ...session, chapter: action.chapter, selected: null, pendingReset: null } : session;
  }
  if (session.pendingReset && action.kind !== 'confirmReset') return session;
  if (action.kind === 'select') {
    return fieldChapters[action.field] === session.chapter && fieldChapters[action.field] <= session.game.unlocked
      ? { ...session, selected: action.field } : session;
  }
  const choice = action.kind === 'placeChoice' && session.selected ? placementChoices(session.selected)[action.index] : null;
  if (action.kind === 'placeChoice' && !choice) return session;
  if (action.kind === 'confirmReset' && session.pendingReset !== action.chapter) return session;
  const gameAction: GameAction | null = choice ? choice.action
    : action.kind === 'undo' ? { kind: 'undo' }
      : action.kind === 'confirmReset' ? { kind: 'resetChapter', chapter: action.chapter } : null;
  if (!gameAction) return session;
  const game = reduceGame(session.game, gameAction);
  if (game === session.game) return action.kind === 'confirmReset' ? { ...session, pendingReset: null } : session;
  return { ...session, game, pendingReset: null, trace: traceChange(session.game, game) };
}
