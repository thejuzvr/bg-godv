import { getRedis } from '../redis';
import * as storage from '../storage';
import { enqueueDigest } from '../queues/digestQueue';

function nowUtcHour(): number {
  const d = new Date();
  return d.getUTCHours();
}

export async function startDigestProducer(): Promise<never> {
  console.log('[DigestProducer] Starting digest producer...');
  const redis = getRedis();
  const targetHour = Number(process.env.DIGEST_HOUR_UTC || '7');

  while (true) {
    try {
      const enabled = String(process.env.TELEGRAM_ENABLED || '').toLowerCase() === 'true';
      if (!enabled) {
        await new Promise(r => setTimeout(r, 15000));
        continue;
      }

      const hour = nowUtcHour();
      if (hour === targetHour) {
        const subs = await storage.getActiveTelegramSubscriptions();
        const dayKey = new Date().toISOString().slice(0, 10);
        let enqueued = 0;
        for (const sub of subs as any[]) {
          const last = (sub as any).lastSentAt || 0;
          const todayAtHour = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), targetHour);
          if (last >= todayAtHour) continue;
          const guardKey = `digest:guard:${(sub as any).id}:${dayKey}`;
          const ok = await redis.set(guardKey, '1', 'EX', 26 * 3600, 'NX');
          if (ok !== 'OK') continue;
          await enqueueDigest({
            subscriptionId: (sub as any).id,
            userId: (sub as any).userId,
            chatId: (sub as any).chatId,
            sendAt: Date.now() + Math.floor(Math.random() * 300000), // spread within 5m
          });
          enqueued++;
        }
        if (enqueued > 0) {
          console.log(`[DigestProducer] Enqueued ${enqueued} daily digests.`);
        }
      }
    } catch (e) {
      console.error('[DigestProducer] Error', e);
    }
    await new Promise(r => setTimeout(r, 60000)); // check each minute
  }
}


