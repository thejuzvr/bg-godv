#!/usr/bin/env tsx

import { loadEnv } from './load-env';
loadEnv();

import { runBackgroundWorker } from './background-worker';
import { tickWorker } from './workers/tickWorker';
import { startTickProducer } from './producers/tickProducer';
import { pingRedis } from './redis';
import './queues/queueEvents';

console.log('=== Starting ElderScrollsIdle Worker ===');
console.log('Feature flags:', {
  FEATURE_BULLMQ: process.env.FEATURE_BULLMQ,
});

async function main() {
  const useBull = String(process.env.FEATURE_BULLMQ || '').toLowerCase() === 'true';
  if (useBull) {
    const redisOk = await pingRedis();
    if (!redisOk) {
      console.error('[Runner] Redis is unreachable. Falling back to legacy background worker. Check REDIS_URL or network.');
      await runBackgroundWorker();
      return;
    }
    console.log('[Runner] BullMQ mode enabled. Starting tick worker and digest worker...');
    // Keep process alive by awaiting worker events
    tickWorker.on('ready', () => console.log('[TickWorker] ready'));
    tickWorker.on('error', (err) => console.error('[TickWorker] error', err));
    // Fire-and-forget producer loops
    startTickProducer().catch((e) => console.error('[Runner] tick producer failed', e));
    try {
      const { digestWorker } = await import('./workers/digestWorker');
      digestWorker.on('ready', () => console.log('[DigestWorker] ready (runner)'));
      const { startDigestProducer } = await import('./producers/digestProducer');
      startDigestProducer().catch((e) => console.error('[Runner] digest producer failed', e));
      // Optional Telegram polling (no webhook) if enabled
      if (String(process.env.TELEGRAM_POLLING || '').toLowerCase() === 'true') {
        const { startTelegramPoller } = await import('./producers/telegramPoller');
        startTelegramPoller().catch((e) => console.error('[Runner] telegram poller failed', e));
      }
    } catch (e) {
      console.error('[Runner] failed to start digest worker/producer', e);
    }
    await new Promise(() => {});
  } else {
    console.log('[Runner] Legacy loop mode. Starting background worker...');
    await runBackgroundWorker();
  }
}

main().catch((error) => {
  console.error('Fatal error in worker runner:', error);
  process.exit(1);
});
