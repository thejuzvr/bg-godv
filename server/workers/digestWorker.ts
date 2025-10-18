import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { getRedis } from '../redis';
import type { DigestJob } from '../queues/digestQueue';
import * as storage from '../storage';
import { buildDailyDigest } from '../digest/digestService';

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const enabled = String(process.env.TELEGRAM_ENABLED || '').toLowerCase() === 'true';
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!enabled || !token) {
    console.log('[Telegram] Disabled, would send to', chatId, text);
    return true;
  }
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[Telegram] sendMessage failed', resp.status, body);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Telegram] sendMessage error', e);
    return false;
  }
}

export const digestWorker = new Worker<DigestJob>('digests', async (job: Job<DigestJob>) => {
  const { subscriptionId, userId, chatId, sendAt } = job.data;
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const text = await buildDailyDigest(userId, since);
  if (!text) return { ok: true } as any;
  const ok = await sendTelegramMessage(chatId, text);
  if (ok) {
    await storage.setTelegramLastSentAt(subscriptionId, Date.now());
  }
  return { ok } as any;
}, {
  connection: getRedis().duplicate(),
  concurrency: Number(process.env.QUEUE_CONCURRENCY || '2'),
  prefix: 'bull',
  autorun: true,
});

try {
  digestWorker.on('ready', () => console.log('[DigestWorker] ready'));
  digestWorker.on('error', (err) => console.error('[DigestWorker] error', err));
} catch {}


