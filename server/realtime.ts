#!/usr/bin/env tsx

import { loadEnv } from './load-env';
loadEnv();
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedis, pingRedis } from './redis';

const PORT = Number(process.env.WS_PORT || 5050);
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Redis adapter for horizontal scale
const pub = getRedis();
const sub = pub.duplicate();
sub.on('error', (err) => console.error('[Realtime][sub] error', err));
pub.on('error', (err) => console.error('[Realtime][pub] error', err));
io.adapter(createAdapter(pub as any, sub as any));

// Subscribe to worker publications
const subEvents = pub.duplicate();
subEvents.on('error', (err) => console.error('[Realtime][events] error', err));
subEvents.subscribe('ws:tick', (err) => {
  if (err) console.error('[Realtime] subscribe error', err);
});
subEvents.on('message', (channel: string, message: string) => {
  try {
    const evt = JSON.parse(message);
    const realmRoom = `realm:${evt.realmId}`;
    const charRoom = `char:${evt.characterId}`;
    io.to(realmRoom).emit('tick:update', evt);
    io.to(charRoom).emit('tick:update', evt);
  } catch (e) {
    console.error('[Realtime] bad payload on channel', channel, e);
  }
});

io.on('connection', (socket) => {
  const realmId = (socket.handshake.query.realmId as string) || 'global';
  const characterId = socket.handshake.query.characterId as string | undefined;

  // Join rooms
  socket.join(`realm:${realmId}`);
  if (characterId) socket.join(`char:${characterId}`);

  socket.emit('connected', { realmId, characterId });

  socket.on('disconnect', () => {
    // noop
  });
});

(async () => {
  const ok = await pingRedis();
  if (!ok) {
    console.error('[Realtime] Redis is unreachable. Check REDIS_URL or network. Exiting.');
    process.exit(1);
  }
  server.listen(PORT, () => {
    console.log(`[Realtime] Socket.IO server listening on :${PORT}`);
  });
})();


