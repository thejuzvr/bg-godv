import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (client) return client;

  const url = process.env.REDIS_URL;
  if (!url) {
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
      return Math.min(30000, retryBase * Math.max(1, times));
    },
    reconnectOnError(err) {
      const msg = err?.message || '';
      // Reconnect on transient errors
      return msg.includes('READONLY') || msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT');
    },
    tls: useSsl ? { rejectUnauthorized } as any : undefined,
  });

  client.on('error', (err) => {
    console.error('[Redis] Client error:', err);
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


