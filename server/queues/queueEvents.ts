import { QueueEvents } from 'bullmq';
import { getRedis } from '../redis';

export const tickQueueEvents = new QueueEvents('ticks', {
  connection: getRedis().duplicate(),
  autorun: true,
});

try {
  tickQueueEvents.on('waiting', ({ jobId }) => {
    console.log('[QueueEvents] waiting job', jobId);
  });
  tickQueueEvents.on('active', ({ jobId }) => {
    console.log('[QueueEvents] active job', jobId);
  });
  tickQueueEvents.on('completed', ({ jobId }) => {
    console.log('[QueueEvents] completed job', jobId);
  });
  tickQueueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error('[QueueEvents] failed job', jobId, failedReason);
  });
} catch {}


