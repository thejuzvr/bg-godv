#!/usr/bin/env tsx

import { loadEnv } from './load-env';
loadEnv();
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedis, pingRedis } from './redis';
import type { GameEvent } from './events/event-types';

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

// Subscribe to legacy worker publications (backward compatibility)
const subLegacy = pub.duplicate();
subLegacy.on('error', (err) => console.error('[Realtime][legacy] error', err));
subLegacy.subscribe('ws:tick', (err) => {
  if (err) console.error('[Realtime] subscribe error', err);
});
subLegacy.on('message', (channel: string, message: string) => {
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

// Subscribe to new event bus
const subEvents = pub.duplicate();
subEvents.on('error', (err) => console.error('[Realtime][events] error', err));

// Subscribe to all game event channels
const eventChannels = [
  'game:events:all',
  'game:events:realm:global', // Default realm
  'game:events:category:character',
  'game:events:category:market',
  'game:events:category:divine',
  'game:events:category:companion',
  'game:events:category:quest',
];

Promise.all(eventChannels.map(channel => 
  new Promise<void>((resolve, reject) => {
    subEvents.subscribe(channel, (err) => {
      if (err) {
        console.error(`[Realtime] Failed to subscribe to ${channel}:`, err);
        reject(err);
      } else {
        console.log(`[Realtime] Subscribed to ${channel}`);
        resolve();
      }
    });
  })
)).catch(err => {
  console.error('[Realtime] Event subscription failed:', err);
});

subEvents.on('message', (channel: string, message: string) => {
  try {
    const event: GameEvent = JSON.parse(message);
    const { type, realmId, characterId, data } = event;
    
    // Route event to appropriate Socket.IO rooms
    const rooms: string[] = [];
    
    // Always send to realm room
    rooms.push(`realm:${realmId}`);
    
    // Send to character room if specified
    if (characterId) {
      rooms.push(`char:${characterId}`);
    }
    
    // For market events, also send to market room
    if (type.startsWith('market:')) {
      rooms.push('market:global');
    }
    
    // Broadcast to all relevant rooms
    for (const room of rooms) {
      io.to(room).emit('game:event', {
        type,
        data,
        timestamp: event.timestamp,
      });
    }
    
    // Also emit specific event type for fine-grained subscriptions
    for (const room of rooms) {
      io.to(room).emit(type, {
        data,
        timestamp: event.timestamp,
      });
    }
    
    console.log(`[Realtime] Broadcasted ${type} to ${rooms.length} rooms`);
  } catch (e) {
    console.error('[Realtime] Error processing event:', e);
  }
});

io.on('connection', (socket) => {
  const realmId = (socket.handshake.query.realmId as string) || 'global';
  const characterId = socket.handshake.query.characterId as string | undefined;

  console.log(`[Realtime] Client connected: realm=${realmId}, char=${characterId || 'none'}`);

  // Join rooms
  socket.join(`realm:${realmId}`);
  if (characterId) {
    socket.join(`char:${characterId}`);
  }
  // Join market room for all clients
  socket.join('market:global');

  socket.emit('connected', { realmId, characterId });

  // Allow clients to subscribe to specific event types
  socket.on('subscribe', (eventType: string) => {
    const room = `event:${eventType}`;
    socket.join(room);
    console.log(`[Realtime] Client subscribed to ${eventType}`);
  });

  socket.on('unsubscribe', (eventType: string) => {
    const room = `event:${eventType}`;
    socket.leave(room);
    console.log(`[Realtime] Client unsubscribed from ${eventType}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Realtime] Client disconnected: char=${characterId || 'none'}`);
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
    console.log(`[Realtime] Real-time event broadcasting enabled`);
  });
})();


