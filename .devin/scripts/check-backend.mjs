import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const binary = process.platform === 'win32' ? fileURLToPath(new URL('../tools/deno-2.5.6/deno.exe', import.meta.url)) : 'deno';
const result = spawnSync(binary, ['check', '--config', 'supabase/functions/deno.json', 'supabase/functions/keeper/index.ts'], {
  cwd: new URL('../../', import.meta.url), stdio: 'inherit',
});
if (result.error) throw new Error('Install the pinned Deno runtime before checking the backend.', { cause: result.error });
process.exit(result.status ?? 1);
