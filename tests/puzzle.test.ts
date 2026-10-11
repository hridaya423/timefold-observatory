import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chapterComplete, newPuzzleSession, placementChoices, reducePuzzle, type PuzzleField, type PuzzleSession } from '../shared/puzzle.ts';

function place(session: PuzzleSession, field: PuzzleField, label: string) {
  const choice = placementChoices(field).find(item => item.label === label);
  assert.ok(choice);
  const index = placementChoices(field).indexOf(choice);
  return reducePuzzle(reducePuzzle(session, { kind: 'select', field }), { kind: 'placeChoice', index });
}
function powered() { return place(place(newPuzzleSession(), 'cell', 'Main socket'), 'fuse', 'Protection socket'); }

test('selection is not a committed edit and locked chapter objects cannot be selected', () => {
  const initial = newPuzzleSession();
  const selected = reducePuzzle(initial, { kind: 'select', field: 'cell' });
  assert.equal(selected.selected, 'cell');
  assert.equal(selected.game, initial.game);
  assert.equal(reducePuzzle(initial, { kind: 'select', field: 'gear' }), initial);
});

test('destination slots require a selected object; wrong valid placements remain reversible', () => {
  const initial = newPuzzleSession();
  assert.equal(reducePuzzle(initial, { kind: 'placeChoice', index: 1 }), initial);
  assert.equal(reducePuzzle(initial, { kind: 'placeChoice', index: 99 }), initial);
  const selected = reducePuzzle(initial, { kind: 'select', field: 'cell' });
  assert.equal(reducePuzzle(selected, { kind: 'placeChoice', index: 3 }), selected);
  const wrong = place(initial, 'cell', 'Spare socket');
  assert.equal(wrong.game.state.cell, 'spare');
  assert.equal(chapterComplete(wrong.game, 1), false);
  assert.equal(reducePuzzle(wrong, { kind: 'undo' }).game.state.cell, 'home');
});

test('chapter completion is derived and causal feedback includes the actual edit and consequences', () => {
  const session = powered();
  assert.equal(chapterComplete(session.game, 1), true);
  assert.equal(session.game.unlocked, 2);
  assert.ok(session.trace?.past.includes('Protection fuse'));
  assert.ok(session.trace?.present.includes('energized'));
  assert.ok(session.trace?.future.includes('illuminated'));
});

test('chapter navigation never bypasses locks or mutates game history', () => {
  const initial = newPuzzleSession();
  assert.equal(reducePuzzle(initial, { kind: 'chapter', chapter: 3 }), initial);
  const session = powered();
  const chapterTwo = reducePuzzle(session, { kind: 'chapter', chapter: 2 });
  assert.equal(chapterTwo.chapter, 2);
  assert.equal(chapterTwo.game, session.game);
  assert.equal(chapterTwo.selected, null);
});

test('reset requires matching named confirmation, cancellation commits nothing, and reset is undoable', () => {
  const session = powered();
  assert.equal(reducePuzzle(session, { kind: 'confirmReset', chapter: 1 }), session);
  const pending = reducePuzzle(session, { kind: 'requestReset' });
  assert.equal(pending.pendingReset, 1);
  assert.equal(pending.game, session.game);
  assert.equal(reducePuzzle(pending, { kind: 'confirmReset', chapter: 2 }), pending);
  const cancelled = reducePuzzle(pending, { kind: 'cancelReset' });
  assert.equal(cancelled.game, session.game);
  const reset = reducePuzzle(pending, { kind: 'confirmReset', chapter: 1 });
  assert.equal(reset.game.state.cell, 'home');
  assert.equal(reset.game.unlocked, 2);
  assert.equal(reducePuzzle(reset, { kind: 'undo' }).game.state.cell, 'main');
});

test('all chapters complete through explicit named choices, and removing a prerequisite changes the world without relocking chapters', () => {
  let session = reducePuzzle(powered(), { kind: 'chapter', chapter: 2 });
  session = place(place(place(session, 'gear', 'Drive socket'), 'lens', 'Optical mount'), 'alignment', 'Target mark');
  session = reducePuzzle(session, { kind: 'chapter', chapter: 3 });
  session = place(place(session, 'crystal', 'Receiver mount'), 'frequency', 'Target mark');
  assert.equal(chapterComplete(session.game, 3), true);
  session = reducePuzzle(session, { kind: 'chapter', chapter: 1 });
  session = place(session, 'cell', 'Bench');
  assert.equal(chapterComplete(session.game, 3), false);
  assert.equal(session.game.unlocked, 3);
  assert.ok(session.trace?.future.includes('dark'));
});
