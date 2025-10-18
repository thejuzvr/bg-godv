import type { Character, WorldState, ActionHistoryEntry } from "@/types/character";
import { fetchGameData, type GameData } from "@/services/gameDataService";
import { gameDataService } from "../../server/game-data-service";
import { processGameTick } from "./game-engine";
import { ACTION_CATALOG } from "./action-catalog";
import { computeActionScores, type ScoredAction } from "./priority-engine";

export type SimulatorMode = "single" | "batch";

export interface TestCharacterParams {
  id?: string;
  name?: string;
  race?: string;
  gender?: string;
  backstory?: string;
  patronDeity?: string;
  location?: string;
  level?: number;
  hp?: { current: number; max: number };
  stamina?: { current: number; max: number };
  flags?: { tired?: boolean; overencumbered?: boolean };
}

export interface SingleTickResult {
  updatedCharacter: Character;
  adventureLog: string[];
  combatLog: string[];
  scores: ScoredAction[];
}

export interface BatchSimulationResult {
  finalCharacter: Character;
  ticks: number;
  logsSample: { first: string[]; last: string[] };
  distributions: {
    byCategory: Record<string, number>;
    byActionName: Record<string, number>;
  };
  idleTicks: number;
  idlePercent: number;
  statusCounts?: Record<string, number>;
  statusPercent?: Record<string, number>;
  busyByActionType?: Record<string, number>;
  busyPercent?: number;
  combatPercent?: number;
  sleepingPercent?: number;
  deadPercent?: number;
  cycles: {
    longestRun: { type: string; length: number } | null;
    repeatedWindows: Array<{ window: string[]; count: number }>;
  };
}

export async function buildGameDataForSimulation(): Promise<GameData & { thoughts: Array<any> }> {
  const [base, thoughts] = await Promise.all([
    fetchGameData(),
    gameDataService.getAllThoughts(),
  ]);
  return { ...base, thoughts };
}

export function createTestCharacter(params: TestCharacterParams, gameData: GameData): Character {
  const now = Date.now();
  const id = params.id || `sim-${now}`;
  const name = params.name || "Sim Hero";
  const race = params.race || "nord";
  const gender = params.gender || "male";
  const backstory = params.backstory || "warrior";
  const patronDeity = (params.patronDeity as any) || "talos";
  const location = params.location || (gameData.locations[0]?.id || "whiterun");
  const level = params.level ?? 1;

  const hp = params.hp || { current: 100, max: 100 };
  const stamina = params.stamina || { current: 100, max: 100 };

  // Try to include gold if exists in DB/static items
  const goldBase = (gameData.items as any[]).find(i => i.id === "gold");
  const initialInventory: Character["inventory"] = [];
  if (goldBase) {
    initialInventory.push({ ...(goldBase as any), quantity: 100 });
  }

  const character: Character = {
    id,
    name,
    gender,
    race,
    backstory,
    patronDeity: patronDeity as any,
    level,
    xp: { current: 0, required: 100 },
    stats: {
      health: { current: hp.current, max: hp.max },
      magicka: { current: 80, max: 80 },
      stamina: { current: stamina.current, max: stamina.max },
      fatigue: { current: 0, max: 100 },
    },
    attributes: { strength: 5, agility: 5, intelligence: 5, endurance: 5 },
    skills: { oneHanded: 10, block: 5, heavyArmor: 5, lightArmor: 5, persuasion: 5, alchemy: 5 },
    points: { attribute: 0, skill: 0 },
    location,
    inventory: initialInventory,
    equippedItems: {},
    factions: {},
    status: "idle",
    combat: null,
    sleepUntil: null,
    respawnAt: null,
    deathOccurredAt: null,
    activeSovngardeQuest: null,
    activeCryptQuest: null,
    createdAt: now,
    lastUpdatedAt: now,
    deaths: 0,
    effects: [],
    knownSpells: [],
    knownShouts: [],
    currentAction: null,
    interventionPower: { current: 0, max: 100 },
    divineSuggestion: null,
    divineDestinationId: null,
    pendingTravel: null,
    completedQuests: [],
    season: "Summer",
    weather: "Clear",
    timeOfDay: "day",
    actionCooldowns: {},
    visitedLocations: [location],
    gameDate: now,
    mood: 50,
    unlockedPerks: [],
    perkPoints: 0,
    preferences: { autoAssignPoints: true, autoEquip: true },
    analytics: { killedEnemies: {}, diceRolls: { d20: Array(21).fill(0) }, encounteredEnemies: [], epicPhrases: [], actionCategoryCounts: {} },
    divineFavor: 0,
    templeProgress: 0,
    templeCompletedFor: null,
    relationships: {},
    actionHistory: [],
    unlockedAchievements: [],
    lastThoughtTime: undefined,
    hasSeenWelcomeMessage: true,
    lastLocationArrival: now,
    hasCompletedLocationActivity: false,
    recentDestinations: [],
    activeGeneratedQuest: null,
  };

  // Apply optional flags to approximate world state influences
  if (params.flags?.tired) {
    character.stats.stamina.current = Math.max(0, Math.min(character.stats.stamina.max, Math.floor(character.stats.stamina.max * 0.25)));
  }
  if (params.flags?.overencumbered) {
    // Simulate over encumbrance by stuffing inventory with heavy junk
    const heavy = (gameData.items as any[]).find(i => (i.weight || 0) >= 10);
    if (heavy) {
      character.inventory.push({ ...(heavy as any), quantity: 15 });
    }
  }

  return character;
}

export async function simulateSingleTick(character: Character, profileCode?: string): Promise<SingleTickResult> {
  const gameData = await buildGameDataForSimulation();
  const result = await processGameTick(character, gameData);

  // Compose an approximate world state for scoring
  const world: WorldState = {
    isIdle: result.updatedCharacter.status === "idle",
    isInCombat: result.updatedCharacter.status === "in-combat",
    isDead: result.updatedCharacter.status === "dead",
    isLocationSafe: true,
    isTired: result.updatedCharacter.stats.stamina.current < result.updatedCharacter.stats.stamina.max * 0.3,
    canTakeQuest: true,
    isInjured: result.updatedCharacter.stats.health.current < result.updatedCharacter.stats.health.max * 0.7,
    isBadlyInjured: result.updatedCharacter.stats.health.current < result.updatedCharacter.stats.health.max * 0.3,
    hasEnoughGoldForRest: true,
    hasEnoughGoldForSleep: true,
    hasEnoughGoldForDonation: true,
    hasHealingPotion: result.updatedCharacter.inventory.some(i => i.type === 'potion' && i.effect?.type === 'heal'),
    hasUnreadTome: result.updatedCharacter.inventory.some(i => i.type === 'spell_tome'),
    hasUnreadLearningBook: result.updatedCharacter.inventory.some(i => i.learningEffect != null),
    hasKeyItem: result.updatedCharacter.inventory.some(i => i.type === 'key_item'),
    isWellRested: true,
    canExploreCity: true,
    isOverencumbered: false,
    hasPoisonDebuff: result.updatedCharacter.effects.some(e => e.id === 'weak_poison'),
    hasBuffPotion: result.updatedCharacter.inventory.some(i => i.type === 'potion' && i.effect?.type === 'buff'),
    timeOfDay: result.updatedCharacter.timeOfDay,
    isNightTime: result.updatedCharacter.timeOfDay === 'night',
    weatherModifier: 1,
    weatherEffect: { attackModifier: 1, stealthModifier: 1, findChanceModifier: 1, fatigueModifier: 1, moodModifier: 0, regenModifier: { health: 1, magicka: 1, stamina: 1, fatigue: 1 } },
    timeOfDayEffect: { findChanceModifier: 1, enemyStrengthModifier: 1, stealthModifier: 1, fleeChanceModifier: 0, regenModifier: { health: 1, magicka: 1, stamina: 1, fatigue: 1 }, npcAvailability: true },
  };

  const scores = await computeActionScores({ character: result.updatedCharacter, actions: ACTION_CATALOG, profileCode: profileCode as any, world });
  return {
    updatedCharacter: result.updatedCharacter,
    adventureLog: result.adventureLog,
    combatLog: result.combatLog,
    scores: scores.slice(0, 12),
  };
}

export async function runSimulation(initial: Character, ticks: number): Promise<BatchSimulationResult> {
  const gameData = await buildGameDataForSimulation();
  // Deterministic RNG seed (simple LCG) to make tests reproducible
  let seed = 123456789;
  const rand = () => {
    seed = (1103515245 * seed + 12345) % 0x80000000;
    return (seed / 0x80000000);
  };
  const oldRandom = Math.random;
  (Math as any).random = rand;
  let char = structuredClone(initial);
  const byCategory: Record<string, number> = {};
  const byActionName: Record<string, number> = {};
  const logs: string[] = [];
  let idleTicks = 0;
  const statusCounts: Record<string, number> = { idle: 0, busy: 0, 'in-combat': 0, sleeping: 0, dead: 0, exploring: 0 };
  const busyByActionType: Record<string, number> = {};
  let lastActionHistoryLen = char.actionHistory?.length || 0;
  let lastAction: ActionHistoryEntry | undefined = char.actionHistory?.at(-1);

  for (let i = 0; i < ticks; i++) {
    // Advance in-game time to allow timed actions to complete between ticks.
    // We "warp" timestamps backwards so that engine, which uses Date.now(), 
    // considers actions/effects/cooldowns older by delta.
    char = advanceCharacterTime(char, 60 * 1000); // +60s per simulated tick

    const { updatedCharacter, adventureLog, combatLog } = await processGameTick(char, gameData);
    char = updatedCharacter;
    if (adventureLog.length) logs.push(...adventureLog);
    if (combatLog.length) logs.push(...combatLog);

    // Status accounting
    const status = char.status as string;
    if (statusCounts[status] == null) statusCounts[status] = 0;
    statusCounts[status] += 1;

    if (status === 'idle') {
      idleTicks += 1;
    } else if (status === 'busy' || status === 'exploring') {
      const actType = (char.currentAction?.type || (status === 'exploring' ? 'exploring' : 'unknown')) as string;
      busyByActionType[actType] = (busyByActionType[actType] || 0) + 1;
    }

    // Category distribution from actionHistory deltas (when a new action is taken)
    const hist = char.actionHistory || [];
    const newLen = hist.length;
    if (newLen > lastActionHistoryLen) {
      for (let j = lastActionHistoryLen; j < newLen; j++) {
        const entry = hist[j];
        if (entry) {
          byCategory[entry.type] = (byCategory[entry.type] || 0) + 1;
          lastAction = entry;
        }
      }
    }
    lastActionHistoryLen = newLen;

    // Also approximate action name distribution from latest log line
    const lastLog = logs.at(-1);
    if (lastLog) {
      const key = normalizeActionNameFromLog(lastLog);
      if (key) byActionName[key] = (byActionName[key] || 0) + 1;
    }
  }
  // Restore Math.random
  (Math as any).random = oldRandom;

  const idlePercent = ticks === 0 ? 0 : Math.round((idleTicks / ticks) * 100);
  const statusPercent: Record<string, number> = {};
  const keys = Object.keys(statusCounts);
  for (const k of keys) {
    statusPercent[k] = ticks === 0 ? 0 : Math.round(((statusCounts[k] || 0) / ticks) * 100);
  }
  const busyPercent = statusPercent['busy'] || 0;
  const combatPercent = statusPercent['in-combat'] || 0;
  const sleepingPercent = statusPercent['sleeping'] || 0;
  const deadPercent = statusPercent['dead'] || 0;
  const cycles = detectCycles(char.actionHistory || []);
  const sample = {
    first: logs.slice(0, 20),
    last: logs.slice(-20),
  };
  return {
    finalCharacter: char,
    ticks,
    logsSample: sample,
    distributions: { byCategory, byActionName },
    idleTicks,
    idlePercent,
    statusCounts,
    statusPercent,
    busyByActionType,
    busyPercent,
    combatPercent,
    sleepingPercent,
    deadPercent,
    cycles,
  };
}

function normalizeActionNameFromLog(line: string): string | null {
  // Very lightweight heuristic: take verb phrase until first dot
  if (!line) return null;
  const dot = line.indexOf('.')
  const s = dot > 0 ? line.slice(0, dot) : line;
  return s.trim().toLowerCase();
}

function advanceCharacterTime(character: Character, deltaMs: number): Character {
  const ch = structuredClone(character);
  const dec = (v: number | null) => (typeof v === 'number' ? v - deltaMs : v);

  ch.gameDate = (ch.gameDate || Date.now()) + deltaMs; // logical time forward
  ch.lastUpdatedAt = (ch.lastUpdatedAt || Date.now()) + deltaMs;
  if (ch.lastLocationArrival) ch.lastLocationArrival = ch.lastLocationArrival + deltaMs;
  if (ch.lastThoughtTime != null) ch.lastThoughtTime = Math.max(0, ch.lastThoughtTime - deltaMs);

  if (ch.sleepUntil != null) ch.sleepUntil = dec(ch.sleepUntil) as any;
  if (ch.respawnAt != null) ch.respawnAt = dec(ch.respawnAt) as any;
  if (ch.deathOccurredAt != null) ch.deathOccurredAt = dec(ch.deathOccurredAt) as any;
  if (ch.pendingTravel) {
    ch.pendingTravel.remainingDuration = Math.max(0, (ch.pendingTravel.remainingDuration || 0) - deltaMs);
  }
  if (ch.currentAction) {
    ch.currentAction.startedAt = dec(ch.currentAction.startedAt) as any;
    // If duration is very long, give it a nudge sometimes
    if ((Math.random() < 0.05) && ch.currentAction.duration > 0) {
      ch.currentAction.startedAt -= ch.currentAction.duration;
    }
  }
  if (Array.isArray(ch.effects)) {
    ch.effects = ch.effects.map(e => ({ ...e, expiresAt: dec(e.expiresAt) as any }));
  }
  if (ch.actionCooldowns) {
    const cooled: Record<string, number> = {} as any;
    for (const [k, v] of Object.entries(ch.actionCooldowns)) {
      const num = Number(v);
      cooled[k] = Number.isFinite(num) ? Math.max(0, num - deltaMs) : (v as any as number);
    }
    ch.actionCooldowns = cooled;
  }
  return ch;
}

function detectCycles(history: ActionHistoryEntry[]): BatchSimulationResult["cycles"] {
  if (!history || history.length === 0) return { longestRun: null, repeatedWindows: [] };
  // Longest consecutive run
  let longest: { type: string; length: number } = { type: history[0].type, length: 1 };
  let cur = { type: history[0].type, length: 1 };
  for (let i = 1; i < history.length; i++) {
    if (history[i].type === cur.type) cur.length += 1; else { if (cur.length > longest.length) longest = { ...cur }; cur = { type: history[i].type, length: 1 }; }
  }
  if (cur.length > longest.length) longest = { ...cur };

  // Repeated windows (short periods up to size 4)
  const repeated: Array<{ window: string[]; count: number }> = [];
  const types = history.map(h => h.type);
  const maxWindow = Math.min(4, types.length);
  const seen = new Map<string, number>();
  for (let w = 2; w <= maxWindow; w++) {
    seen.clear();
    for (let i = 0; i + w <= types.length; i++) {
      const slice = types.slice(i, i + w).join("|");
      const c = (seen.get(slice) || 0) + 1;
      seen.set(slice, c);
    }
    for (const [key, count] of seen.entries()) {
      if (count >= 2) {
        repeated.push({ window: key.split("|"), count });
      }
    }
  }
  return { longestRun: longest, repeatedWindows: repeated };
}


