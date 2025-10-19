import { describe, it, expect } from 'vitest';
import { buildGameDataForSimulation, createTestCharacter } from '@/ai/simulator';
import { processGameTick } from '@/ai/game-engine';

describe('Idle guard vs arrival sequencing', () => {
  it('does not emit inactivity immediately after arriving from long travel', async () => {
    const data = await buildGameDataForSimulation();
    const from = data.locations.find(l => l.type === 'city') || data.locations[0];
    const to = data.locations.find(l => l.type === 'city' && l.id !== from.id) || data.locations[1] || from;

    let char = createTestCharacter({ name: 'Arriver', location: from.id }, data);

    const duration = 2 * 60 * 1000 + 10 * 1000; // > 2m
    char.status = 'busy';
    char.currentAction = {
      type: 'travel',
      name: `Путь в ${to.name}`,
      description: 'Долгое путешествие.',
      startedAt: Date.now() - duration,
      duration,
      originalDuration: duration,
      destinationId: to.id,
    } as any;

    const res = await processGameTick(char as any, data as any);
    const logs = res.adventureLog.join('\n');
    expect(logs).toMatch(/После долгого пути/u);
    expect(logs).not.toMatch(/Слишком долгое бездействие/u);
    expect(res.updatedCharacter.location).toBe(to.id);
    expect(res.updatedCharacter.status).toBe('idle');
  });

  it('emits inactivity after sufficient idle time post-arrival', async () => {
    const data = await buildGameDataForSimulation();
    const city = data.locations.find(l => l.type === 'city') || data.locations[0];

    // Start already idle in a city
    let char = createTestCharacter({ name: 'Idler', location: city.id }, data);
    char.status = 'idle';
    char.currentAction = null;
    // Force last activity far in the past (> 3m)
    const old = Date.now() - 3 * 60 * 1000;
    char.lastLocationArrival = old;
    char.lastUpdatedAt = old;
    char.actionHistory = [{ type: 'travel', timestamp: old } as any];

    const res = await processGameTick(char as any, data as any);
    const logs = res.adventureLog.join('\n');
    expect(logs).toMatch(/Слишком долгое бездействие/u);
  });
});


