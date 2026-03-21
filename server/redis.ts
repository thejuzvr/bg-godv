import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (client) return client;

  const url = process.env.REDIS_URL;
  if (!url) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('[Redis] Warning: REDIS_URL not set during build. Returning mock client.');
      return {
        set: async () => 'OK',
        get: async () => null,
        duplicate: () => getRedis(),
        subscribe: async () => {},
        unsubscribe: async () => {},
        quit: async () => {},
        on: () => {},
      } as any;
    }
    throw new Error('REDIS_URL is not set');
  }

  const useSsl = String(process.env.REDIS_SSL || '').toLowerCase() === 'true' || url.startsWith('rediss://');
  const rejectUnauthorized = String(process.env.REDIS_SSL_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true';
  const connectTimeout = Number(process.env.REDIS_CONNECT_TIMEOUT_MS || '10000');
  const retryBase = Number(process.env.REDIS_RETRY_BASE_MS || '1000');

  client = new Redis(url, {
    maxRetriesPerRequest: null,        // required for BullMQ
    enableReadyCheck: true,
    connectTimeout,
    retryStrategy(times) {
      // exponential backoff up to 30s
      const delay = Math.min(30000, retryBase * Math.max(1, times));
      console.log(`[Redis] Retry ${times}, waiting ${delay}ms`);
      return delay;
    },
    reconnectOnError(err) {
      const msg = err?.message || '';
      // Reconnect on transient errors
      if (msg.includes('READONLY')) {
        console.error('[Redis] ERROR: Redis is in READONLY mode. Cannot write. Check Redis configuration.');
        return false; // Don't reconnect on READONLY - it won't help
      }
      return msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT');
    },
    tls: useSsl ? { rejectUnauthorized } as any : undefined,
  });

  client.on('error', (err) => {
    const msg = err?.message || '';
    if (msg.includes('READONLY')) {
      console.error('[Redis] CRITICAL: Redis is in READ-ONLY mode!');
      console.error('[Redis] Solution 1: Use local Redis: REDIS_URL=redis://localhost:6379');
      console.error('[Redis] Solution 2: Disable BullMQ: FEATURE_BULLMQ=false');
      console.error('[Redis] Solution 3: Fix Redis server config to allow writes');
    } else {
      console.error('[Redis] Client error:', err);
    }
  });
  
  client.on('ready', () => {
    console.log('[Redis] Connected successfully to', url.replace(/:[^:]*@/, ':****@'));
  });

  return client;
}

export async function pingRedis(): Promise<boolean> {
  try {
    const c = getRedis();
    const res = await c.ping();
    return res === 'PONG';
  } catch (e) {
    return false;
  }
}


