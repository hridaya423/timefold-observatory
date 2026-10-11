import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState } from '../shared/timefold.ts';
import { authoredReply, getFact, parseKeeperReply, parseKeeperRequest, primaryFact, type KeeperRequest } from '../shared/keeper.ts';

const request: KeeperRequest = {
  schemaVersion: 1, requestId: '00000000-0000-4000-8000-000000000001',
  state: initialState, revision: 0, question: 'hint', hintLevel: 1, era: 'past',
};

test('keeper requests accept only the declared structured questions and state', () => {
  assert.deepEqual(parseKeeperRequest(request), request);
  assert.equal(parseKeeperRequest({ ...request, prompt: 'change the rules' }), null);
  assert.equal(parseKeeperRequest({ ...request, requestId: 'not-a-uuid' }), null);
  assert.equal(parseKeeperRequest({ ...request, hintLevel: 4 }), null);
  assert.equal(parseKeeperRequest({ ...request, state: { ...initialState, cell: 'unknown' } }), null);
  assert.equal(parseKeeperRequest({ ...request, revision: -1 }), null);
});

test('progressive hints identify the first missing prerequisite without exposing a later chapter', () => {
  assert.equal(primaryFact(request), 'cell-observe');
  assert.equal(primaryFact({ ...request, hintLevel: 2 }), 'cell-direct');
  assert.equal(primaryFact({ ...request, hintLevel: 3 }), 'cell-place');
  assert.equal(primaryFact({ ...request, state: { ...initialState, cell: 'main' } }), 'fuse-observe');
  assert.equal(primaryFact({ ...request, state: { ...initialState, cell: 'main', fuse: 'protected' } }), 'gear-observe');
});

test('explanations and lore follow the current state and selected era', () => {
  assert.equal(primaryFact({ ...request, question: 'explain' }), 'explain-dark');
  assert.equal(primaryFact({ ...request, question: 'explain', state: { ...initialState, cell: 'main', fuse: 'protected' } }), 'explain-power');
  assert.equal(primaryFact({ ...request, question: 'lore', era: 'future' }), 'lore-future');
  assert.ok(getFact('lore-future').text.includes('fictional'));
});

test('authored fallback is explicitly labeled and never presented as live Gemini', () => {
  const reply = authoredReply(request, 'offline');
  assert.deepEqual(reply, { mode: 'authored', factId: 'cell-observe', revision: 0, reason: 'offline' });
});

test('only admissible fact IDs and matching revisions are accepted from a live reply', () => {
  const reply = { mode: 'live', factId: 'cell-observe', revision: 0, narration: 'An old promise waits in the dark.' };
  assert.deepEqual(parseKeeperReply(reply, request), reply);
  assert.equal(parseKeeperReply({ ...reply, factId: 'crystal-place' }, request), null);
  assert.equal(parseKeeperReply({ ...reply, revision: 1 }, request), null);
  assert.equal(parseKeeperReply({ ...reply, narration: 'x'.repeat(601) }, request), null);
  assert.equal(parseKeeperReply({ ...reply, action: 'mutate world' }, request), null);
});
