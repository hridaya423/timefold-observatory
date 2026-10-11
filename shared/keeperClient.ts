import { authoredReply, parseKeeperReply, type FallbackReason, type KeeperReply, type KeeperRequest } from './keeper.ts';

export type KeeperTransport = (request: KeeperRequest, signal: AbortSignal) => Promise<unknown>;
export type KeeperClientResult = { kind: 'reply'; reply: KeeperReply } | { kind: 'stale' };
export type KeeperClientOptions = {
  mode: 'authored' | 'live';
  transport: KeeperTransport | null;
  currentRevision: () => number;
  timeoutMs: number;
};
export class KeeperClientError extends Error {
  readonly reason: FallbackReason;
  constructor(reason: FallbackReason) { super('Keeper request could not complete.'); this.reason = reason; }
}

export function createKeeperClient(options: KeeperClientOptions) {
  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 1 || options.timeoutMs > 10000) throw new Error('Keeper client deadline must be between 1 and 10000 milliseconds.');
  const transport = options.transport;
  const inFlight = new Map<string, Promise<KeeperReply>>();
  const cache = new Map<string, { reply: KeeperReply; expires: number }>();
  async function fetchReply(request: KeeperRequest): Promise<KeeperReply> {
    if (!transport) return authoredReply(request, 'not_configured');
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('Keeper client deadline elapsed.')); }, options.timeoutMs);
    });
    try {
      const value = await Promise.race([transport(request, controller.signal), deadline]);
      return parseKeeperReply(value, request) ?? authoredReply(request, 'invalid_reply');
    } catch (error) {
      return authoredReply(request, controller.signal.aborted ? 'timeout' : error instanceof KeeperClientError ? error.reason : 'offline');
    } finally { clearTimeout(timer); }
  }
  return async (request: KeeperRequest): Promise<KeeperClientResult> => {
    const respond = (reply: KeeperReply): KeeperClientResult => options.currentRevision() === request.revision ? { kind: 'reply', reply } : { kind: 'stale' };
    if (options.currentRevision() !== request.revision) return { kind: 'stale' };
    if (options.mode === 'authored') return respond(authoredReply(request, 'offline'));
    if (!transport) return respond(authoredReply(request, 'not_configured'));
    const key = JSON.stringify({ ...request, requestId: undefined });
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return respond(cached.reply);
    cache.delete(key);
    let pending = inFlight.get(key);
    if (!pending) {
      pending = fetchReply(request).then(reply => {
        inFlight.delete(key);
        if (reply.mode === 'live') {
          if (cache.size >= 32) {
            const oldest = cache.keys().next().value;
            if (oldest !== undefined) cache.delete(oldest);
          }
          cache.set(key, { reply, expires: Date.now() + 300000 });
        }
        return reply;
      });
      inFlight.set(key, pending);
    }
    return respond(await pending);
  };
}
