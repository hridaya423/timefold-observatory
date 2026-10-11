import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildEraVisuals } from '../shared/presentation.ts';
import { initialState } from '../shared/timefold.ts';

test('three era visuals have distinct identity and derive their effects from the arrangement', () => {
  const initial = buildEraVisuals(initialState);
  assert.deepEqual(initial.map(value => value.era), ['past', 'present', 'future']);
  assert.equal(initial[2].signalRecovered, false);
  const powered = buildEraVisuals({ ...initialState, cell: 'main', fuse: 'protected' });
  assert.equal(powered[1].powered, true);
  assert.equal(powered[2].powered, true);
  assert.equal(powered[2].signalRecovered, false);
  assert.equal(initial[1].powered, false);
});
