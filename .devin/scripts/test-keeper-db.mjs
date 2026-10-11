import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

const image = 'postgres:17.11-alpine3.23@sha256:9ea644da56f1a82283b173fa38a316636fe7c538991a8ae41998cd3765434991';
const container = `timefold-keeper-tests-${randomUUID()}`;
const password = randomBytes(32).toString('hex');
let created = false;
function docker(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', env: { ...process.env, POSTGRES_PASSWORD: password } });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || 'Scratch Docker command failed.');
  return result.stdout.trim();
}
function sql(input) {
  return docker(['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'timefold_test', '-v', 'ON_ERROR_STOP=1', '-At'], input);
}
try {
  docker(['run', '--rm', '--detach', '--name', container, '--env', 'POSTGRES_PASSWORD', '--env', 'POSTGRES_DB=timefold_test', image]);
  created = true;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const probe = spawnSync('docker', ['exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres', '-d', 'timefold_test'], { encoding: 'utf8' });
    if (probe.status === 0) { ready = true; break; }
    await setTimeout(500);
  }
  if (!ready) throw new Error('Scratch Postgres did not become ready.');
  sql('create role anon; create role authenticated; create role service_role;');
  sql(await readFile(new URL('../../supabase/migrations/202610060001_keeper_quota.sql', import.meta.url), 'utf8'));
  sql(await readFile(new URL('../../supabase/tests/keeper_quota.sql', import.meta.url), 'utf8'));
  const parallelSql = command => new Promise((resolve, reject) => {
    const child = spawn('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'timefold_test', '-v', 'ON_ERROR_STOP=1', '-At']);
    let output = '';
    let errors = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { errors += data; });
    child.on('error', reject);
    child.on('close', status => status === 0 ? resolve(output.trim()) : reject(new Error(errors)));
    child.stdin.end(command);
  });
  const results = await Promise.all(Array.from({ length: 8 }, (_, index) => {
    const id = `90000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    return parallelSql(`select public.reserve_keeper_request('80000000-0000-4000-8000-000000000001', '${id}', repeat('e',64))->>'kind';`);
  }));
  assert.equal(results.filter(value => value === 'new').length, 3);
  assert.equal(results.filter(value => value === 'denied').length, 5);
  assert.equal(sql('select count(*) from public.keeper_requests;'), '3');
  const globalResults = await Promise.all(Array.from({ length: 8 }, (_, index) => {
    const suffix = String(index + 1).padStart(12, '0');
    return parallelSql(`select public.reserve_keeper_request('a0000000-0000-4000-8000-${suffix}', 'b0000000-0000-4000-8000-${suffix}', repeat('f',64), 4)->>'kind';`);
  }));
  assert.equal(globalResults.filter(value => value === 'new').length, 1);
  assert.equal(globalResults.filter(value => value === 'denied').length, 7);
  assert.equal(sql('select count(*) from public.keeper_requests;'), '4');
  console.log('Scratch Postgres passed: ownership, replay/conflict, role permissions, daily/global/minute caps, and concurrent user/global limits.');
} finally {
  if (created) docker(['stop', container]);
}
