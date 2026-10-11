import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newGame, reduceGame } from '../shared/timefold.ts';
import { createSaveQueue, decodeProgress, encodeProgress } from '../shared/progress.ts';

test('saved progress roundtrips committed state, history, unlocks and revision', () => {
  const cell = reduceGame(newGame(), { kind: 'change', field: 'cell', value: 'main' });
  const game = reduceGame(cell, { kind: 'change', field: 'fuse', value: 'protected' });
  assert.deepEqual(decodeProgress(encodeProgress(game)), game);
});

test('missing, corrupt, future-version and oversized saves are rejected', () => {
  assert.equal(decodeProgress(null), null);
  assert.equal(decodeProgress('{broken'), null);
  assert.equal(decodeProgress(JSON.stringify({ schemaVersion: 2, ...newGame() })), null);
  assert.equal(decodeProgress(' '.repeat(32769)), null);
});

test('invalid enum values, unsafe revisions and oversized histories are rejected', () => {
  const payload = { schemaVersion: 1, ...newGame() };
  assert.equal(decodeProgress(JSON.stringify({ ...payload, state: { ...payload.state, cell: 'orbit' } })), null);
  assert.equal(decodeProgress(JSON.stringify({ ...payload, revision: -1 })), null);
  assert.equal(decodeProgress(JSON.stringify({ ...payload, revision: Number.MAX_SAFE_INTEGER + 1 })), null);
  assert.equal(decodeProgress(JSON.stringify({ ...payload, history: Array(65).fill(payload.state) })), null);
});

test('a save cannot claim a locked chapter while containing its required completed prerequisite', () => {
  const cell = reduceGame(newGame(), { kind: 'change', field: 'cell', value: 'main' });
  const powered = reduceGame(cell, { kind: 'change', field: 'fuse', value: 'protected' });
  assert.equal(decodeProgress(JSON.stringify({ schemaVersion: 1, ...powered, unlocked: 1 })), null);
});

test('room transforms and unknown fields are not restored as game data', () => {
  const game = newGame();
  const restored = decodeProgress(JSON.stringify({ schemaVersion: 1, ...game, roomTransform: [1, 2, 3], state: { ...game.state, roomTransform: [4, 5, 6] } }));
  assert.deepEqual(restored, game);
});

test('concurrent saves execute in order instead of letting an older write overwrite a newer one', async () => {
  const written: string[] = [];
  let releaseFirst = () => {};
  let notifyStarted = () => {};
  const firstStarted = new Promise<void>(resolve => { notifyStarted = resolve; });
  const barrier = new Promise<void>(resolve => { releaseFirst = resolve; });
  const { save, whenIdle } = createSaveQueue(async value => {
    written.push(value);
    if (written.length === 1) { notifyStarted(); await barrier; }
  });
  const initial = newGame();
  const changed = reduceGame(initial, { kind: 'change', field: 'cell', value: 'main' });
  const older = save(initial);
  const newer = save(changed);
  let idle = false;
  const idleBarrier = whenIdle().then(() => { idle = true; });
  await firstStarted;
  assert.equal(written.length, 1);
  assert.equal(idle, false);
  releaseFirst();
  await Promise.all([older, newer, idleBarrier]);
  assert.equal(idle, true);
  assert.deepEqual(written, [encodeProgress(initial), encodeProgress(changed)]);
});

test('a failed save reaches its caller but does not prevent a later save', async () => {
  let calls = 0;
  const saved: string[] = [];
  const { save } = createSaveQueue(async value => {
    if (++calls === 1) throw new Error('scratch storage unavailable');
    saved.push(value);
  });
  await assert.rejects(save(newGame()), /scratch storage unavailable/);
  await save(newGame());
  assert.equal(saved.length, 1);
});
