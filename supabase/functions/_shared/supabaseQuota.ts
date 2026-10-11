import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { QuotaStore } from './keeperService.ts';

const reservationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('new') }).strict(),
  z.object({ kind: z.literal('pending') }).strict(),
  z.object({ kind: z.literal('conflict') }).strict(),
  z.object({ kind: z.literal('denied') }).strict(),
  z.object({ kind: z.literal('cached'), reply: z.unknown() }).strict(),
]);

export function createSupabaseQuotaStore(client: SupabaseClient, dailyLimit: number): QuotaStore {
  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 100) throw new Error('Keeper daily cap must be between 1 and 100.');
  return {
    async reserve(userId, requestId, fingerprint) {
      const { data, error } = await client.rpc('reserve_keeper_request', { p_user: userId, p_request: requestId, p_fingerprint: fingerprint, p_global_limit: dailyLimit });
      if (error) throw new Error('Keeper quota reservation failed.');
      const result = reservationSchema.safeParse(data);
      if (!result.success) throw new Error('Keeper quota response is invalid.');
      return result.data;
    },
    async complete(userId, requestId, fingerprint, reply) {
      const { data, error } = await client.rpc('complete_keeper_request', { p_user: userId, p_request: requestId, p_fingerprint: fingerprint, p_reply: reply });
      if (error || data !== true) throw new Error('Owned keeper request completion failed.');
    },
  };
}
