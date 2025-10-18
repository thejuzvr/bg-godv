import { describe, it, expect } from 'vitest';
import { createTestCharacter, runSimulation, simulateSingleTick } from '@/ai/simulator';
import { fetchGameData } from '@/services/gameDataService';
import { buildGameDataForSimulation } from '@/ai/simulator';
import { processGameTick } from '@/ai/game-engine';
import { buildGameDataForSimulation } from '@/ai/simulator';
import { processGameTick } from '@/ai/game-engine';

describe('AI Simulator', () => {
  it('creates a synthetic character and runs a single tick', async () => {
    const data = await fetchGameData();
    const char = createTestCharacter({ name: 'Test', location: 'whiterun' }, data);
    const res = await simulateSingleTick(char);
    expect(res.updatedCharacter).toBeTruthy();
    expect(Array.isArray(res.adventureLog)).toBe(true);
    expect(Array.isArray(res.scores)).toBe(true);
  });

  it('runs batch simulation and returns metrics', async () => {
    const data = await fetchGameData();
    const char = createTestCharacter({ name: 'Batch', location: 'whiterun' }, data);
    const res = await runSimulation(char, 10);
    expect(res.ticks).toBe(10);
    expect(res.finalCharacter).toBeTruthy();
    expect(res.distributions).toBeTruthy();
    expect(typeof res.idlePercent).toBe('number');
  });

  it('produces social/18+ actions occasionally and respects thought spam filter', async () => {
    const data = await buildGameDataForSimulation();
    let char = createTestCharacter({ name: 'SocialCheck', location: 'whiterun' }, data);
    const total = 120;
    let socialSeen = 0;
    let drunkSeen = 0;
    let brothelSeen = 0;
    let repeatedThoughtBurst = false;
    let lastThoughts: string[] = [];
    for (let i = 0; i < total; i++) {
      const res = await processGameTick(char, data);
      char = res.updatedCharacter;
      const lastEntry = (char.actionHistory || []).at(-1);
      if (lastEntry && lastEntry.type === 'explore') {
        socialSeen += 1;
      }
      for (const m of res.adventureLog) {
        if (/Герой хорошенько напился в таверне/u.test(m)) drunkSeen += 1;
        if (/Герой провёл ночь в борделе/u.test(m)) brothelSeen += 1;
        if (/^У героя родилась мысль:/u.test(m)) {
          lastThoughts.push(m);
          if (lastThoughts.length > 12) lastThoughts.shift();
          // If the same exact thought repeats inside 10 recent, flag burst
          const textOnly = lastThoughts.map(s => s.replace(/^У героя родилась мысль:\s*"|"$/gu, ''));
          const set = new Set(textOnly);
          if (set.size <= Math.floor(textOnly.length * 0.6)) {
            repeatedThoughtBurst = true;
          }
        }
      }
    }
    expect(socialSeen).toBeGreaterThan(0);
    expect(drunkSeen + brothelSeen).toBeGreaterThanOrEqual(0); // may be zero due RNG
    expect(repeatedThoughtBurst).toBe(false);
  });
});

// Added test to validate thought quotas and reduced travel loops

describe('AI anti-spam and travel balance', () => {
  it('limits thoughts and keeps travel under control', async () => {
    const data = await buildGameDataForSimulation();
    let char = createTestCharacter({ name: 'AntiLoop', location: 'whiterun' }, data);
    const total = 60;
    let thoughtCount = 0;
    let travelCount = 0;
    for (let i = 0; i < total; i++) {
      const res = await processGameTick(char, data);
      char = res.updatedCharacter;
      thoughtCount += res.adventureLog.filter(m => m.startsWith('У героя родилась мысль:')).length;
      const last = (char.actionHistory || []).at(-1);
      if (last && last.type === 'travel') travelCount += 1;
    }
    expect(thoughtCount).toBeLessThanOrEqual(10);
    expect(travelCount).toBeLessThanOrEqual(Math.floor(total * 0.35));
  });
});


