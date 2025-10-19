import { getRedis } from '@/../server/redis';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { characterId: string } }) {
  const characterId = params.characterId;
  const encoder = new TextEncoder();
  const redis = getRedis().duplicate();
  const channel = 'ai-graph-updates';
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      send('open', { ok: true });
      await redis.subscribe(channel, (msg, data) => {
        try {
          const cid = data?.toString?.() || data;
          if (cid === characterId) send('update', { characterId, at: Date.now() });
        } catch {}
      });
    },
    async cancel() {
      try { await redis.unsubscribe(channel); await redis.quit(); } catch {}
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
}


