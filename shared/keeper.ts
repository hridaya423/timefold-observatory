import { z } from 'zod';
import { deriveWorld, parseTimeFoldState, type TimeFoldState } from './timefold.ts';

type Fact = Readonly<{ text: string; highlights: readonly (keyof TimeFoldState)[] }>;
const facts = {
  'cell-observe': { text: 'The main power socket has no working cell.', highlights: ['cell'] },
  'cell-direct': { text: 'The cell belongs in the main socket, not the spare socket.', highlights: ['cell'] },
  'cell-place': { text: 'Place the cell into the main socket in the past.', highlights: ['cell'] },
  'fuse-observe': { text: 'The circuit is missing its protection path.', highlights: ['fuse'] },
  'fuse-direct': { text: 'Inspect the protection socket beside the main cell.', highlights: ['fuse'] },
  'fuse-place': { text: 'Place the fuse into the protection socket in the past.', highlights: ['fuse'] },
  'gear-observe': { text: 'The powered motor cannot turn the telescope yet.', highlights: ['gear'] },
  'gear-direct': { text: 'Look for the drive socket in the past.', highlights: ['gear'] },
  'gear-place': { text: 'Place the drive gear into the motor drive socket.', highlights: ['gear'] },
  'lens-observe': { text: 'The telescope optical path is incomplete.', highlights: ['lens'] },
  'lens-direct': { text: 'A clear lens must sit in the optical mount.', highlights: ['lens'] },
  'lens-place': { text: 'Place the lens into the optical mount in the past.', highlights: ['lens'] },
  'alignment-observe': { text: 'The signal star is outside the instrument alignment.', highlights: ['alignment'] },
  'alignment-direct': { text: 'Use the alignment controls to aim at the marked star.', highlights: ['alignment'] },
  'alignment-place': { text: 'Set the alignment control to its marked target position.', highlights: ['alignment'] },
  'crystal-observe': { text: 'The receiver has no crystal to hold the signal.', highlights: ['crystal'] },
  'crystal-direct': { text: 'Inspect the crystal mount at the receiver.', highlights: ['crystal'] },
  'crystal-place': { text: 'Place the receiver crystal into its mount in the past.', highlights: ['crystal'] },
  'frequency-observe': { text: 'The receiver is listening on the wrong frequency.', highlights: ['frequency'] },
  'frequency-direct': { text: 'Compare the tuning control with its marked target.', highlights: ['frequency'] },
  'frequency-place': { text: 'Set the receiver frequency to the marked target.', highlights: ['frequency'] },
  'explain-dark': { text: 'The cell and protection fuse must both be installed before the motor can receive power.', highlights: ['cell', 'fuse'] },
  'explain-power': { text: 'The power chain is restored. The motor is energized, but the optics and alignment are not yet complete.', highlights: ['cell', 'fuse', 'gear'] },
  'explain-sky': { text: 'Power, drive gear, lens and alignment now work together. The receiver still needs its crystal and target frequency.', highlights: ['lens', 'crystal', 'frequency'] },
  'explain-signal': { text: 'The complete chain now carries the signal from the repaired past into the future.', highlights: ['crystal', 'frequency'] },
  'lore-past': { text: 'The first keepers built the observatory to listen beyond their own lifetimes. Each repair is a promise to someone who will arrive later.', highlights: [] },
  'lore-present': { text: 'The mechanism has gone quiet, but the room still carries the shape of its history. Its silence is not the end of the story.', highlights: [] },
  'lore-future': { text: 'A keeper who has not yet arrived will inherit what survives here. This future is part of the fictional observatory, not a prediction of the real world.', highlights: [] },
  complete: { text: 'The lost signal has returned. Trace the complete chain, or undo a repair to see which consequences depend on it.', highlights: ['crystal', 'frequency'] },
} satisfies Record<string, Fact>;

export type FactId = keyof typeof facts;
export const getFact = (id: FactId): Fact => facts[id];
export const isFactId = (value: unknown): value is FactId => typeof value === 'string' && Object.hasOwn(facts, value);
const factIdSchema = z.custom<FactId>(isFactId);
const revisionSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const stateSchema = z.unknown().transform((value, context) => {
  const state = parseTimeFoldState(value);
  if (state) return state;
  context.addIssue({ code: 'custom', message: 'Invalid TimeFold arrangement.' });
  return z.NEVER;
});

export const keeperRequestSchema = z.object({
  schemaVersion: z.literal(1),
  requestId: z.uuid(),
  state: stateSchema,
  revision: revisionSchema,
  question: z.enum(['hint', 'explain', 'lore']),
  hintLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  era: z.enum(['past', 'present', 'future']),
}).strict();
export type KeeperRequest = z.infer<typeof keeperRequestSchema>;

export const fallbackReasonSchema = z.enum([
  'offline', 'not_configured', 'disabled', 'timeout', 'quota', 'busy',
  'provider_error', 'invalid_reply', 'auth_unavailable',
]);
export const liveKeeperReplySchema = z.object({ mode: z.literal('live'), factId: factIdSchema, revision: revisionSchema, narration: z.string().trim().min(1).max(600) }).strict();
export const keeperReplySchema = z.discriminatedUnion('mode', [
  liveKeeperReplySchema,
  z.object({ mode: z.literal('authored'), factId: factIdSchema, revision: revisionSchema, reason: fallbackReasonSchema }).strict(),
]);
export type KeeperReply = z.infer<typeof keeperReplySchema>;
export type FallbackReason = Extract<KeeperReply, { mode: 'authored' }>['reason'];

export const keeperErrorSchema = z.object({ error: z.enum([
  'unauthorized', 'auth_unavailable', 'invalid_request', 'too_large',
  'method_not_allowed', 'origin_not_allowed', 'quota_store_unavailable',
  'request_conflict', 'configuration_unavailable',
]) }).strict();
export type KeeperError = z.infer<typeof keeperErrorSchema>;

export function parseKeeperRequest(value: unknown): KeeperRequest | null {
  const parsed = keeperRequestSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

const repairHints: Record<keyof TimeFoldState, readonly [FactId, FactId, FactId]> = {
  cell: ['cell-observe', 'cell-direct', 'cell-place'],
  fuse: ['fuse-observe', 'fuse-direct', 'fuse-place'],
  gear: ['gear-observe', 'gear-direct', 'gear-place'],
  lens: ['lens-observe', 'lens-direct', 'lens-place'],
  alignment: ['alignment-observe', 'alignment-direct', 'alignment-place'],
  crystal: ['crystal-observe', 'crystal-direct', 'crystal-place'],
  frequency: ['frequency-observe', 'frequency-direct', 'frequency-place'],
};
const lore: Record<KeeperRequest['era'], FactId> = { past: 'lore-past', present: 'lore-present', future: 'lore-future' };

export function primaryFact(request: KeeperRequest): FactId {
  if (request.question === 'lore') return lore[request.era];
  const world = deriveWorld(request.state);
  if (request.question === 'explain') {
    return world.signalRecovered ? 'explain-signal' : world.aimed ? 'explain-sky' : world.powered ? 'explain-power' : 'explain-dark';
  }
  const state = request.state;
  const missing = state.cell !== 'main' ? 'cell' : state.fuse !== 'protected' ? 'fuse'
    : state.gear !== 'drive' ? 'gear' : state.lens !== 'optic' ? 'lens'
      : state.alignment !== 'target' ? 'alignment' : state.crystal !== 'receiver' ? 'crystal'
        : state.frequency !== 'target' ? 'frequency' : null;
  return missing ? repairHints[missing][request.hintLevel - 1] : 'complete';
}

export function authoredReply(request: KeeperRequest, reason: FallbackReason): KeeperReply {
  return { mode: 'authored', factId: primaryFact(request), revision: request.revision, reason };
}

export function parseKeeperReply(value: unknown, request: KeeperRequest): KeeperReply | null {
  const parsed = keeperReplySchema.safeParse(value);
  if (!parsed.success || parsed.data.revision !== request.revision || parsed.data.factId !== primaryFact(request)) return null;
  return parsed.data;
}
