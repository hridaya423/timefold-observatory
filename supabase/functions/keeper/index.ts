import { createClient } from '@supabase/supabase-js';
import { createGeminiGenerator } from '../_shared/gemini.ts';
import { createKeeperHandler } from '../_shared/keeperService.ts';
import { createSupabaseQuotaStore } from '../_shared/supabaseQuota.ts';

function configuredHandler() {
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const enabled = Deno.env.get('KEEPER_ENABLED') === 'true';
  const model = Deno.env.get('KEEPER_GEMINI_MODEL');
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const dailyLimit = Number(Deno.env.get('KEEPER_GLOBAL_DAILY_LIMIT') ?? '100');
  if (!url || !anonKey || !serviceKey || (enabled && (!model || !apiKey))) {
    return async () => Response.json({ error: 'configuration_unavailable' }, { status: 503 });
  }
  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const generate = enabled && model && apiKey
    ? createGeminiGenerator({ model, apiKey, fetcher: fetch })
    : async () => null;
  return createKeeperHandler({
    enabled, timeoutMs: 8000,
    allowedOrigins: (Deno.env.get('KEEPER_ALLOWED_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean),
    authenticate: async token => {
      const { data, error } = await auth.auth.getUser(token);
      return error ? null : data.user?.id ?? null;
    },
    quota: createSupabaseQuotaStore(admin, dailyLimit),
    generate,
  });
}

Deno.serve(configuredHandler());
