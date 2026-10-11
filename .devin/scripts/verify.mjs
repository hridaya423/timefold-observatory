import { spawnSync } from 'node:child_process';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this verification with npm run verify.');

for (const task of ['typecheck', 'lint', 'test', 'check:backend', 'test:keeper-db', 'doctor', 'check:dependencies']) {
  const result = spawnSync(process.execPath, [npmCli, 'run', task], {
    cwd: new URL('../../', import.meta.url),
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
