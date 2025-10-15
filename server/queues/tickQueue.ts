import { Queue } from 'bullmq';
import { getRedis } from '../redis';

export type TickJob = {
  realmId: string;
  characterId: string;
  tickAt: number; // epoch ms
  correlationId?: string;
};

const connection = getRedis();

export const tickQueue = new Queue<TickJob>('ticks', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 5000,
    removeOnFail: 10000,
  },
});

// BullMQ v5: QueueScheduler no longer required; Queue handles delayed jobs internally

export async function enqueueTick(job: TickJob) {
  const jobId = `${job.realmId}:${job.characterId}:${job.tickAt}`;
  return tickQueue.add('tick', job, {
    jobId,
    delay: Math.max(0, job.tickAt - Date.now()),
  });
}


