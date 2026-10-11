import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveWorld, initialState, type TimeFoldState } from '../shared/timefold.ts';

test('power requires both the main cell and the protection fuse', () => {
  assert.equal(deriveWorld(initialState).powered, false);
  assert.equal(deriveWorld({ ...initialState, cell: 'main' }).powered, false);
  assert.equal(deriveWorld({ ...initialState, fuse: 'protected' }).powered, false);
  assert.equal(deriveWorld({ ...initialState, cell: 'main', fuse: 'bypass' }).powered, false);
  assert.equal(deriveWorld({ ...initialState, cell: 'main', fuse: 'protected' }).powered, true);
});

test('a complete causal chain breaks when an upstream repair is removed', () => {
  const restored: TimeFoldState = {
    cell: 'main', fuse: 'protected', gear: 'drive', lens: 'optic',
    alignment: 'target', crystal: 'receiver', frequency: 'target',
  };
  assert.deepEqual(deriveWorld(restored), { powered: true, aimed: true, signalRecovered: true });
  assert.deepEqual(deriveWorld({ ...restored, cell: 'home' }), { powered: false, aimed: false, signalRecovered: false });
  assert.deepEqual(deriveWorld({ ...restored, lens: 'home' }), { powered: true, aimed: false, signalRecovered: false });
  assert.deepEqual(deriveWorld({ ...restored, frequency: 'low' }), { powered: true, aimed: true, signalRecovered: false });
});

test('all 648 arrangements preserve causality and have exactly one complete solution', () => {
  const choices: { [Key in keyof TimeFoldState]: TimeFoldState[Key][] } = {
    cell: ['home', 'main', 'spare'], fuse: ['home', 'protected', 'bypass'],
    gear: ['home', 'drive'], lens: ['home', 'optic'], alignment: ['left', 'target', 'right'],
    crystal: ['home', 'receiver'], frequency: ['low', 'target', 'high'],
  };
  let arrangements = 0;
  let powered = 0;
  let aimed = 0;
  let recovered = 0;
  for (const cell of choices.cell) for (const fuse of choices.fuse)
  for (const gear of choices.gear) for (const lens of choices.lens)
  for (const alignment of choices.alignment) for (const crystal of choices.crystal)
  for (const frequency of choices.frequency) {
    const world = deriveWorld({ cell, fuse, gear, lens, alignment, crystal, frequency });
    arrangements++;
    powered += Number(world.powered);
    aimed += Number(world.aimed);
    recovered += Number(world.signalRecovered);
    assert.ok(!world.aimed || world.powered);
    assert.ok(!world.signalRecovered || world.aimed);
  }
  assert.equal(arrangements, 648);
  assert.equal(powered, 72);
  assert.equal(aimed, 6);
  assert.equal(recovered, 1);
});
