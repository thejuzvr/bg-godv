import { Queue } from 'bullmq';
import { getRedis } from '../redis';

export type DigestJob = {
  subscriptionId: string;
  userId: string;
  chatId: string;
  sendAt: number;
};

const connection = getRedis().duplicate();

export const digestQueue = new Queue<DigestJob>('digests', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 5000,
    removeOnFail: 10000,
  },
});

export async function enqueueDigest(job: DigestJob) {
  const jobId = `${job.subscriptionId}:${job.sendAt}`;
  return digestQueue.add('digest', job, {
    jobId,
    delay: Math.max(0, job.sendAt - Date.now()),
  });
}


