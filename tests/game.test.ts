import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveWorld, newGame, reduceGame, type Game, type GameAction } from '../shared/timefold.ts';

function restoredGame(): Game {
  const actions: GameAction[] = [
    { kind: 'change', field: 'cell', value: 'main' },
    { kind: 'change', field: 'fuse', value: 'protected' },
    { kind: 'change', field: 'gear', value: 'drive' },
    { kind: 'change', field: 'lens', value: 'optic' },
    { kind: 'change', field: 'alignment', value: 'target' },
    { kind: 'change', field: 'crystal', value: 'receiver' },
    { kind: 'change', field: 'frequency', value: 'target' },
  ];
  return actions.reduce(reduceGame, newGame());
}

test('later chapter objects are unavailable until their upstream chapter was completed', () => {
  const initial = newGame();
  assert.equal(reduceGame(initial, { kind: 'change', field: 'gear', value: 'drive' }), initial);
  const cell = reduceGame(initial, { kind: 'change', field: 'cell', value: 'main' });
  assert.equal(cell.unlocked, 1);
  const powered = reduceGame(cell, { kind: 'change', field: 'fuse', value: 'protected' });
  assert.equal(powered.unlocked, 2);
  assert.equal(reduceGame(powered, { kind: 'change', field: 'crystal', value: 'receiver' }), powered);
});

test('a valid seven-action playthrough restores the signal without mutating earlier snapshots', () => {
  const initial = newGame();
  const restored = restoredGame();
  assert.equal(restored.unlocked, 3);
  assert.equal(restored.revision, 7);
  assert.equal(restored.history.length, 7);
  assert.equal(deriveWorld(restored.state).signalRecovered, true);
  assert.equal(initial.state.cell, 'home');
  assert.equal(initial.history.length, 0);
});

test('undo reverses the committed arrangement but never reuses an earlier revision', () => {
  const restored = restoredGame();
  const undone = reduceGame(restored, { kind: 'undo' });
  assert.equal(undone.state.frequency, 'low');
  assert.equal(deriveWorld(undone.state).signalRecovered, false);
  assert.equal(undone.unlocked, 3);
  assert.equal(undone.revision, 8);
  assert.equal(undone.history.length, 6);
});

test('repeated placement is idempotent and does not add undo history', () => {
  const cell = reduceGame(newGame(), { kind: 'change', field: 'cell', value: 'main' });
  assert.equal(cell.state.cell, 'main');
  assert.equal(reduceGame(cell, { kind: 'change', field: 'cell', value: 'main' }), cell);
});

test('resetting chapter three preserves the power and optics chapters and remains undoable', () => {
  const restored = restoredGame();
  const reset = reduceGame(restored, { kind: 'resetChapter', chapter: 3 });
  assert.equal(reset.state.crystal, 'home');
  assert.equal(reset.state.frequency, 'low');
  assert.equal(deriveWorld(reset.state).aimed, true);
  assert.equal(deriveWorld(reset.state).signalRecovered, false);
  assert.deepEqual(reduceGame(reset, { kind: 'undo' }).state, restored.state);
});

test('chapter unlocks remain learned after an upstream repair is removed', () => {
  const removed = reduceGame(restoredGame(), { kind: 'change', field: 'cell', value: 'home' });
  assert.equal(removed.unlocked, 3);
  assert.deepEqual(deriveWorld(removed.state), { powered: false, aimed: false, signalRecovered: false });
});

test('undo history is bounded to the last 64 committed arrangements', () => {
  let game = newGame();
  for (let i = 0; i < 100; i++) {
    game = reduceGame(game, { kind: 'change', field: 'cell', value: i % 2 ? 'home' : 'main' });
  }
  assert.equal(game.history.length, 64);
  assert.equal(game.revision, 100);
  for (let i = 0; i < 64; i++) game = reduceGame(game, { kind: 'undo' });
  assert.equal(reduceGame(game, { kind: 'undo' }), game);
});
