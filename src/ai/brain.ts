// Server-only module, but not a Next.js Server Action file.
/**
 * @fileoverview This file contains the core AI logic for the character.
 * SIMPLIFIED (Godville-style): Uses simple priority system instead of complex weighted decisions.
 */

import type { Character, WorldState, ActiveEffect, ActiveAction, EquipmentSlot, CharacterInventoryItem, ActiveCryptQuest, Weather, CharacterSkills, CharacterAttributes, TimeOfDay, WeatherEffect, TimeOfDayEffect } from "@/types/character";
import type { LootEntry } from "@/types/enemy";
import { selectActionSimple } from './policy';
import { USE_CONFIG_PRIORITY, AI_BT_ENABLED } from './config/constants';
import type { ActionLike } from './bt/types';
import { buildBehaviorTree } from './bt/tree';
import { getBtSettings } from './config/runtime';
import { computeActionScores } from './priority-engine';
import { updateOnAction } from './fatigue';
import { recordAttempt, recordOutcome } from './learning';
import { recordDecisionTrace } from './diagnostics';
import type { GameData } from "@/services/gameDataService";
import { allSpells } from "@/data/spells";
import { allPerks } from "@/data/perks";
import { sovngardeThoughts } from "@/data/sovngarde";
import { jailHumor } from "@/data/jail";
import { allFactions } from "@/data/factions";
import { donateToFaction as performFactionDonation } from "@/app/dashboard/actions";

// Helper functions for faction reputation (duplicated from game-engine.ts)
function getFactionForLocation(location: string): string | null {
    const locationToFaction: Record<string, string> = {
        'whiterun': 'companions',
        'winterhold': 'college_of_winterhold',
        'riften': 'thieves_guild',
        'solitude': 'dark_brotherhood',
        'windhelm': 'dark_brotherhood',
        'markarth': 'dark_brotherhood',
    };
    return locationToFaction[location] || null;
}

function getFactionName(factionId: string): string {
    const factionNames: Record<string, string> = {
        'companions': 'Соратники',
        'college_of_winterhold': 'Коллегия Винтерхолда',
        'thieves_guild': 'Гильдия Воров',
        'dark_brotherhood': 'Темное Братство',
    };
    return factionNames[factionId] || 'Неизвестная фракция';
}
import type { Spell } from "@/types/spell";
import { addChronicleEntry } from "@/services/chronicleService";
import { getFallbackThought } from "@/data/thoughts";
import { Priority, rollPriority } from "@/ai/simple-brain";
import { interactWithNPC, tradeWithNPC } from "@/actions/npc-actions";
import { computeBaseValue } from "@/services/pricing";
import { getCharacterById } from "../../server/storage";
import { saveCombatAnalytics } from "@/services/combatAnalyticsService";

// Weather and time modifier functions (duplicated from game-engine.ts)
function getWeatherModifiers(weather: Weather): WeatherEffect {
    switch (weather) {
        case 'Clear':
            return {
                attackModifier: 0,
                stealthModifier: 0,
                findChanceModifier: 1.0,
                fatigueModifier: 1.0,
                moodModifier: 2,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 }
            };
        case 'Cloudy':
            return {
                attackModifier: 0,
                stealthModifier: 0,
                findChanceModifier: 1.0,
                fatigueModifier: 1.0,
                moodModifier: -1,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 }
            };
        case 'Rain':
            return {
                attackModifier: -2,
                stealthModifier: 0,
                findChanceModifier: 0.9,
                fatigueModifier: 1.1,
                moodModifier: -2,
                regenModifier: { health: 0.8, magicka: 0.9, stamina: 0.9, fatigue: 0.8 }
            };
        case 'Snow':
            return {
                attackModifier: -1,
                stealthModifier: 0,
                findChanceModifier: 0.85,
                fatigueModifier: 1.2,
                moodModifier: -1,
                regenModifier: { health: 0.9, magicka: 0.95, stamina: 0.9, fatigue: 0.9 }
            };
        case 'Fog':
            return {
                attackModifier: -1,
                stealthModifier: 2,
                findChanceModifier: 0.8,
                fatigueModifier: 1.0,
                moodModifier: -1,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 }
            };
        default:
            return {
                attackModifier: 0,
                stealthModifier: 0,
                findChanceModifier: 1.0,
                fatigueModifier: 1.0,
                moodModifier: 0,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 }
            };
    }
}

function getTimeOfDayModifiers(timeOfDay: TimeOfDay): TimeOfDayEffect {
    switch (timeOfDay) {
        case 'night':
            return {
                findChanceModifier: 0.7,
                enemyStrengthModifier: 1.2,
                stealthModifier: 2,
                fleeChanceModifier: 1.1,
                regenModifier: { health: 0.9, magicka: 0.7, stamina: 0.9, fatigue: 0.8 },
                npcAvailability: false
            };
        case 'morning':
            return {
                findChanceModifier: 1.0,
                enemyStrengthModifier: 1.0,
                stealthModifier: 0,
                fleeChanceModifier: 1.0,
                regenModifier: { health: 1.5, magicka: 1.2, stamina: 1.5, fatigue: 1.5 },
                npcAvailability: true
            };
        case 'day':
            return {
                findChanceModifier: 1.0,
                enemyStrengthModifier: 1.0,
                stealthModifier: 0,
                fleeChanceModifier: 1.0,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 },
                npcAvailability: true
            };
        case 'evening':
            return {
                findChanceModifier: 1.1,
                enemyStrengthModifier: 1.0,
                stealthModifier: 0,
                fleeChanceModifier: 1.0,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 },
                npcAvailability: false
            };
        default:
            return {
                findChanceModifier: 1.0,
                enemyStrengthModifier: 1.0,
                stealthModifier: 0,
                fleeChanceModifier: 1.0,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 },
                npcAvailability: true
            };
    }
}

/**
 * A helper function to add an item to the character's inventory. It handles stacking.
 */
function addItemToInventory(character: Character, itemToAdd: Omit<CharacterInventoryItem, 'quantity'>, quantity: number): { updatedCharacter: Character; logMessage: string } {
    const updatedChar = structuredClone(character);
    let itemLog = `Получен предмет: ${itemToAdd.name}${quantity > 1 ? ` (x${quantity})` : ''}.`;
    
    const existingItem = updatedChar.inventory.find((i: CharacterInventoryItem) => i.id === itemToAdd.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        updatedChar.inventory.push({ ...itemToAdd, quantity });
    }
    
    return { updatedCharacter: updatedChar, logMessage: itemLog };
}

// ==================================
// Action History Helpers
// ==================================

/**
 * Add action to history and keep only last 40 entries (circular buffer)
 */
function addToActionHistory(character: Character, actionType: 'combat' | 'quest' | 'explore' | 'travel' | 'rest' | 'learn' | 'social' | 'misc' | 'system'): Character {
    const updatedChar = structuredClone(character);
    if (!updatedChar.actionHistory) {
        updatedChar.actionHistory = [];
    }
    
    updatedChar.actionHistory.push({
        type: actionType,
        timestamp: Date.now()
    });
    
    // Keep only last 40 actions (circular buffer)
    if (updatedChar.actionHistory.length > 40) {
        updatedChar.actionHistory = updatedChar.actionHistory.slice(-40);
    }
    
    return updatedChar;
}

/**
 * Count recent actions of a specific type (within last N actions)
 */
function countRecentActions(character: Character, actionType: string, lookBack: number = 10): number {
    if (!character.actionHistory) return 0;
    const recentActions = character.actionHistory.slice(-lookBack);
    return recentActions.filter(a => a.type === actionType).length;
}

/**
 * Get time since last action of specific type (in milliseconds)
 */
function getTimeSinceLastAction(character: Character, actionType: string): number | null {
    if (!character.actionHistory) return null;
    
    const lastAction = [...character.actionHistory].reverse().find(a => a.type === actionType);
    if (!lastAction) return null;
    
    return Date.now() - lastAction.timestamp;
}

/**
 * Calculate repetition penalty for an action based on recent history
 */
function getRepetitionPenalty(character: Character, actionType: string): number {
    const recentCount = countRecentActions(character, actionType, 10);
    
    // No penalty for first 2 times
    if (recentCount <= 2) return 1.0;
    
    // Progressive penalty: 3rd time = 0.7, 4th = 0.5, 5th+ = 0.3
    if (recentCount === 3) return 0.7;
    if (recentCount === 4) return 0.5;
    return 0.3;
}

/**
 * SIMPLIFIED (Godville-style): Convert Priority to weight with randomness
 * This replaces complex weight calculations with simple priority + dice roll
 * 
 * SCALE UP to compete with legacy weights (which range 70-150+)
 * We multiply by 2 to get competitive ranges:
 * - URGENT: 100 * 2 = 200 (always wins)
 * - HIGH: 50 * 2 = 100 (competitive)
 * - MEDIUM: 20 * 2 = 40 (reasonable)
 * - LOW: 5 * 2 = 10 (low but present)
 */
function priorityToWeight(basePriority: Priority): number {
    if (basePriority === Priority.DISABLED) return 0;
    
    const SCALE_FACTOR = 2; // Scale up to compete with legacy weights
    const baseWeight = basePriority * SCALE_FACTOR;
    
    // Add randomness (0 to baseWeight) - Godville-style
    return baseWeight + (Math.random() * baseWeight);
}


// ==================================
// Action Definitions
// ==================================

export interface Action {
    name: string;
    type: 'combat' | 'quest' | 'explore' | 'travel' | 'rest' | 'learn' | 'social' | 'misc' | 'system';
    canPerform: (character: Character, worldState: WorldState, gameData: GameData) => boolean;
    getWeight?: (character: Character, worldState: WorldState, gameData: GameData) => number;
    perform: (character: Character, gameData: GameData) => Promise<{ character: Character, logMessage: string | string[] }>;
}

const cryptStages = [
    { name: "Открытие Врат", description: "Герой использует коготь, чтобы активировать древний механизм.", duration: 1 * 60 * 1000 },
    { name: "Преодоление Ловушек", description: "Герой осторожно продвигается по коридору, уворачиваясь от дротиков и огненных струй.", duration: 2 * 60 * 1000 },
    { name: "Битва со Стражем", description: "В центре зала пробуждается древний страж. Бой неизбежен!", duration: 0, isCombatStage: true, enemyId: 'draugr_wight' },
    { name: "Осмотр Сокровищницы", description: "Герой осматривает главную усыпальницу, собирая награды.", duration: 1.5 * 60 * 1000 }
];

/**
 * Rolls a D20 dice and records the roll.
 */
const rollD20 = (character: Character): { roll: number, updatedCharacter: Character } => {
    const updatedChar = structuredClone(character);
    const roll = Math.floor(Math.random() * 20) + 1;
    if (!updatedChar.analytics) {
        updatedChar.analytics = { killedEnemies: {}, diceRolls: { d20: Array(21).fill(0) }, encounteredEnemies: [], epicPhrases: [] };
    }
    updatedChar.analytics.diceRolls.d20[roll]++;
    return { roll, updatedCharacter: updatedChar };
};


/**
 * Save combat analytics to database
 */
async function saveCombatToAnalytics(character: Character, victory: boolean, fled: boolean) {
    if (!character.combat) return;
    
    const combat = character.combat;
    const characterHealthEnd = character.stats.health.current;
    const rounds = combat.rounds || 1;
    const damageDealt = combat.totalDamageDealt || 0;
    const damageTaken = combat.totalDamageTaken || 0;
    const xpGained = victory && !fled ? combat.enemy.xp : 0;
    
    try {
        await saveCombatAnalytics({
            characterId: character.id,
            enemyId: combat.enemyId,
            enemyName: combat.enemy.name,
            enemyLevel: combat.enemy.damage, // Using damage as level approximation
            victory,
            fled,
            characterLevel: character.level,
            characterHealthStart: combat.characterHealthStart || character.stats.health.max,
            characterHealthEnd,
            enemyHealthStart: combat.enemyHealthStart || combat.enemy.health.max,
            roundsCount: rounds,
            damageDealt,
            damageTaken,
            xpGained,
            combatLog: combat.combatLog || [],
        });
    } catch (error) {
        console.error('[Combat Analytics] Failed to save combat data:', error);
    }
}

/**
 * Represents a single round of combat against the current enemy.
 */
const performCombatRound = async (character: Character, gameData: GameData, logMessages: string[]): Promise<Character> => {
    let updatedChar = structuredClone(character);
    const { enemies, items } = gameData;

    if (!updatedChar.combat) {
        updatedChar.status = 'idle';
        return updatedChar;
    }

    let enemy = updatedChar.combat.enemy;
    const baseEnemyDef = gameData.enemies.find(e => e.id === updatedChar.combat!.enemyId);
    
    // Initialize combat tracking on first round
    if (!updatedChar.combat.characterHealthStart) {
        updatedChar.combat.characterHealthStart = updatedChar.stats.health.current;
        updatedChar.combat.enemyHealthStart = enemy.health.current;
        updatedChar.combat.rounds = 0;
        updatedChar.combat.totalDamageDealt = 0;
        updatedChar.combat.totalDamageTaken = 0;
        updatedChar.combat.combatLog = [];
    }
    
    // Increment round counter
    updatedChar.combat.rounds = (updatedChar.combat.rounds || 0) + 1;

    // Long fight warning at 20 rounds
    if (updatedChar.combat.rounds === 20) {
        if (!updatedChar.combat.combatLog) updatedChar.combat.combatLog = [];
        updatedChar.combat.combatLog.push('[Предупреждение] Бой длится 20 раундов — возможна патовая ситуация.');
    }

    // Cap total rounds to avoid endless fights (auto-escape)
    const MAX_COMBAT_ROUNDS = 30;
    if (updatedChar.combat.rounds >= MAX_COMBAT_ROUNDS) {
        if (!updatedChar.combat.combatLog) updatedChar.combat.combatLog = [];
        updatedChar.combat.combatLog.push(`Бой автоматически завершен после ${MAX_COMBAT_ROUNDS} раундов. Герой отступает.`);
        await saveCombatToAnalytics(updatedChar, false, true);
        updatedChar.status = 'idle';
        updatedChar.combat = null;
        return updatedChar;
    }
    
    // Add round header to combat log
    if (!updatedChar.combat.combatLog) updatedChar.combat.combatLog = [];
    updatedChar.combat.combatLog.push(`=== Раунд ${updatedChar.combat.rounds} ===`);
    
    const getAttributeBonus = (value: number) => Math.max(0, Math.floor((value - 10) / 2));

    // Computes armor class gained from equipped armor pieces.
    // Rule: every 5 points of armor on gear gives +1 to armor class.
    const computeEquipmentArmorClass = (char: Character): number => {
        const equippedArmorSum = Object.entries(char.equippedItems)
            .filter(([slot]) => ['head', 'torso', 'legs', 'hands', 'feet'].includes(slot as any))
            .reduce((sum, [, itemId]) => {
                const item = char.inventory.find(i => i.id === itemId);
                return sum + (item?.armor || 0);
            }, 0);
        return Math.floor(equippedArmorSum / 5);
    };
    
    // Compute disease-based damage modifiers for hero
    const hasVampirism = updatedChar.effects.some(e => e.id === 'disease_vampirism');
    const hasLycanthropy = updatedChar.effects.some(e => e.id === 'disease_lycanthropy');
    let heroDamageMultiplier = 1;
    if (hasVampirism && updatedChar.timeOfDay === 'day') {
        heroDamageMultiplier *= 0.8; // Daylight penalty
        const vamp = updatedChar.effects.find(e => e.id === 'disease_vampirism');
        if (vamp?.data?.penaltyBoostUntil && Date.now() < vamp.data.penaltyBoostUntil) {
            heroDamageMultiplier *= 0.75; // Stronger penalty during boosted period
        }
    }
    if (hasLycanthropy && updatedChar.timeOfDay === 'night') {
        heroDamageMultiplier *= 1.2; // Night bonus
    }

    // --- Hero's Turn ---
    logMessages.push('--- Ход героя ---');

    // Single-use shout (Fus-Ro-Dah) decision
    if (updatedChar.combat && !updatedChar.combat.shoutUsed) {
        try {
            const { SHOUT_USE_CHANCE } = await import('./config/balance');
            if (Math.random() < (SHOUT_USE_CHANCE || 0.18)) {
                const minDmg = 20 + Math.floor(updatedChar.level * 1.1);
                const maxDmg = 35 + Math.floor(updatedChar.level * 1.6);
                const dmg = Math.max(5, Math.floor(minDmg + Math.random() * (maxDmg - minDmg + 1)));
                enemy.health.current = Math.max(0, enemy.health.current - dmg);
                updatedChar.combat.enemyStunnedRounds = ((updatedChar.combat?.enemyStunnedRounds) || 0) + 1;
                updatedChar.combat.shoutUsed = true;
                updatedChar.combat.totalDamageDealt = ((updatedChar.combat?.totalDamageDealt) || 0) + dmg;
                logMessages.push(`"Фус-Ро-Да!" Герой оглушает ${enemy.name} на 1 ход и наносит ${dmg} урона.`);
            }
        } catch {}
    }

    // Check if should use healing potion first (critical health)
    const healthRatio = updatedChar.stats.health.current / updatedChar.stats.health.max;
    if (healthRatio < 0.35) {
        const healingPotion = updatedChar.inventory.find(i => i.type === 'potion' && i.effect?.type === 'heal');
        if (healingPotion && healingPotion.quantity > 0) {
            healingPotion.quantity -= 1;
            if (healingPotion.quantity <= 0) {
                updatedChar.inventory = updatedChar.inventory.filter(i => i.id !== healingPotion.id);
            }
            const healAmount = healingPotion.effect?.amount || 30;
            updatedChar.stats.health.current = Math.min(updatedChar.stats.health.max, updatedChar.stats.health.current + healAmount);
            logMessages.push(`⚗️ Критическое состояние! Герой быстро выпивает ${healingPotion.name}, восстанавливая ${healAmount} здоровья.`);
            
            // Update combat enemy state before returning.
            updatedChar.combat.enemy = enemy;
            // Don't perform attack this turn, just use potion
            // Continue to enemy turn
        }
    }
    // Decide action: attack, defend, cast spell, or flee.
    let heroAction: 'attack' | 'defend' | 'cast' | 'flee' = 'attack';
    const canCast = (updatedChar.knownSpells || []).some(id => (allSpells.find(s => s.id === id)?.manaCost || Infinity) <= updatedChar.stats.magicka.current);
    
    // Consider fleeing if very low health and no potions.
    // Fleeing is a "reflex" action, so this logic is now in `fleeFromCombatReflex`.
    // This block can be simplified or removed if the reflex handles it.
    // For now, we'll keep it as a fallback decision point.
    if (healthRatio < 0.25 && !updatedChar.combat!.fleeAttempted) {
        const hasHealingPotion = updatedChar.inventory.some(i => i.type === 'potion' && i.effect?.type === 'heal');
        if (!hasHealingPotion && !canCast) {
            heroAction = 'flee'; // Try to flee if critically injured
        }
    }
    
    if (heroAction !== 'flee') {
        if (canCast && updatedChar.stats.health.current < updatedChar.stats.health.max * 0.6) {
            heroAction = 'cast'; // Prioritize healing
        } else if (canCast && Math.random() < 0.3) {
            heroAction = 'cast';
        } else if (updatedChar.stats.stamina.current > 20 && Math.random() < 0.25) {
            heroAction = 'defend';
        }
    }

    // Perform action
    if (heroAction === 'flee') {
        updatedChar.combat!.fleeAttempted = true;
        
        // Apply weather and time modifiers to flee chance
        const weatherEffect = getWeatherModifiers(updatedChar.weather);
        const timeOfDayEffect = getTimeOfDayModifiers(updatedChar.timeOfDay);
        const fleeModifier = weatherEffect.stealthModifier + timeOfDayEffect.fleeChanceModifier;
        const fleeDC = Math.max(5, 10 - Math.floor(fleeModifier)); // Lower DC is better
        
        const { roll, updatedCharacter: charWithRoll } = rollD20(updatedChar);
        updatedChar = charWithRoll;
        const fleeSuccess = roll >= fleeDC;
        
        if (fleeSuccess) {
            logMessages.push(`🏃 Герой пытается сбежать... и успешно отступает! (бросок: ${roll}, цель: ${fleeDC})`);
            // Append round messages to combat log before saving analytics
            if (updatedChar.combat?.combatLog) {
                updatedChar.combat.combatLog.push(...logMessages);
            }
            await saveCombatToAnalytics(updatedChar, false, true);
            updatedChar.status = 'idle';
            updatedChar.combat = null;
            updatedChar.mood = Math.max(0, updatedChar.mood - 10);
            return updatedChar;
        } else {
            logMessages.push(`🏃 Герой пытается сбежать, но ${enemy.name} преграждает путь! (бросок: ${roll}, цель: ${fleeDC})`);
            // Fleeing failed, enemy gets a free attack
        }
    } else if (heroAction === 'attack') {
        const strengthBonus = getAttributeBonus(updatedChar.attributes.strength);
        const skillBonus = Math.floor(updatedChar.skills.oneHanded / 5);
        const totalBonus = strengthBonus + skillBonus;

        // Apply weather modifier to attack roll
        const weatherEffect = getWeatherModifiers(updatedChar.weather);
        const weatherModifier = weatherEffect.attackModifier;
        const weatherBonusText = weatherModifier !== 0 ? ` (погода: ${weatherModifier > 0 ? '+' : ''}${weatherModifier})` : '';

        const { roll, updatedCharacter: charWithRoll } = rollD20(updatedChar);
        updatedChar = charWithRoll;
        const totalRoll = roll + totalBonus + weatherModifier;

        const success = totalRoll >= enemy.armor;
        updatedChar.combat!.lastRoll = { actor: 'hero', action: 'Атака', roll, bonus: totalBonus + weatherModifier, total: totalRoll, target: enemy.armor, success };
        logMessages.push(`Бросок атаки: ${roll} + ${strengthBonus} (сила) + ${skillBonus} (навык)${weatherBonusText} = ${totalRoll} (цель: ${enemy.armor})`);

        if (roll === 20) {
            const weaponId = updatedChar.equippedItems.weapon;
            const weapon = weaponId ? updatedChar.inventory.find((i: CharacterInventoryItem) => i.id === weaponId) : null;
            const baseDamage = 1 + getAttributeBonus(updatedChar.attributes.strength);
            let heroDamage = Math.max(1, Math.floor(((weapon ? weapon.damage || 1 : 1) + baseDamage) * 2 * heroDamageMultiplier)); // Double damage with mods
            enemy.health.current -= heroDamage;
            updatedChar.combat!.totalDamageDealt = (updatedChar.combat!.totalDamageDealt || 0) + heroDamage;
            const msg = `🎲 Критический успех! Герой наносит сокрушительный удар на ${heroDamage} урона!`;
            logMessages.push(msg);
        } else if (roll === 1) {
            const fumblePhrases = [
                "Герой спотыкается о собственный ботинок и роняет оружие. Какой позор!",
                "Замахнувшись, герой случайно бьет себя по колену. -2 здоровья.",
                "Оружие выскальзывает из потных рук и улетает в кусты. Придется искать."
            ];
            logMessages.push(`🎲 Критический провал! ${fumblePhrases[Math.floor(Math.random() * fumblePhrases.length)]}`);
            if (Math.random() > 0.5) {
                updatedChar.stats.health.current -= 2;
                updatedChar.combat!.totalDamageTaken = (updatedChar.combat!.totalDamageTaken || 0) + 2;
            }
        } else if (success) {
            const weaponId = updatedChar.equippedItems.weapon;
            const weapon = weaponId ? updatedChar.inventory.find((i: CharacterInventoryItem) => i.id === weaponId) : null;
            const baseDamage = 1 + getAttributeBonus(updatedChar.attributes.strength);
            let heroDamage = Math.max(1, Math.floor(((weapon ? weapon.damage || 1 : 1) + baseDamage) * heroDamageMultiplier));
            enemy.health.current -= heroDamage;
            logMessages.push(`Попадание! Герой наносит ${heroDamage} урона.`);
            updatedChar.combat!.totalDamageDealt = (updatedChar.combat!.totalDamageDealt || 0) + heroDamage;
        } else {
            logMessages.push("Промах! Враг увернулся от удара.");
        }

    } else if (heroAction === 'defend') {
        updatedChar.stats.stamina.current -= 10;
        logMessages.push(`Герой готовится к защите, тратя 10 выносливости.`);
        // The effect of defending will be applied on the enemy's turn.
    } else if (heroAction === 'cast') {
        const knownSpells = (updatedChar.knownSpells || []).map(id => allSpells.find(s => s.id === id)).filter(Boolean) as Spell[];
        const spellToCast = knownSpells.find(s => s.manaCost <= updatedChar.stats.magicka.current);

        if (spellToCast) {
            updatedChar.stats.magicka.current -= spellToCast.manaCost;
            const castBonus = getAttributeBonus(updatedChar.attributes.intelligence);
            const { roll, updatedCharacter: charWithRoll } = rollD20(updatedChar);
            updatedChar = charWithRoll;
            const totalRoll = roll + castBonus;
            const success = totalRoll >= 10; // Simple magic success check.
            updatedChar.combat!.lastRoll = { actor: 'hero', action: `Колдует: ${spellToCast.name}`, roll, bonus: castBonus, total: totalRoll, target: 10, success };
            logMessages.push(`Бросок магии: ${roll} + ${castBonus} (бонус) = ${totalRoll} (цель: 10)`);
            
            if (success) {
                switch(spellToCast.type) {
                    case 'damage':
                        enemy.health.current -= spellToCast.value;
                        logMessages.push(`"${spellToCast.name}" попадает во врага, нанося ${spellToCast.value} урона.`);
                        updatedChar.combat!.totalDamageDealt = (updatedChar.combat!.totalDamageDealt || 0) + spellToCast.value;
                        break;
                    case 'heal':
                        updatedChar.stats.health.current = Math.min(updatedChar.stats.health.max, updatedChar.stats.health.current + spellToCast.value);
                        logMessages.push(`Герой исцеляет себя на ${spellToCast.value} здоровья.`);
                        break;
                    // Other spell types can be added here
                }
            } else {
                logMessages.push("Заклинание рассеялось в воздухе, не достигнув цели.");
            }
        } else {
             logMessages.push("Герой пытается колдовать, но не хватает магии.");
        }
    }

    updatedChar.combat!.enemy = enemy; // Persist enemy state changes

    if (enemy.health.current <= 0) {
        let winMsg = `Герой победил ${enemy.name}.`;
        const moodBoost = 15;
        updatedChar.mood = Math.min(100, updatedChar.mood + moodBoost);
        winMsg += ` Получено ${enemy.xp} опыта. Настроение улучшилось (+${moodBoost}).`;
        updatedChar.xp.current += enemy.xp;

        // Analytics tracking
        if (updatedChar.combat) {
            const enemyId = updatedChar.combat.enemyId;
            updatedChar.analytics.killedEnemies[enemyId] = (updatedChar.analytics.killedEnemies[enemyId] || 0) + 1;
        }


        if (baseEnemyDef?.guaranteedDrop) {
            for (const drop of baseEnemyDef.guaranteedDrop) {
                const baseItem = items.find(i => i.id === drop.id);
                if (baseItem) {
                    const { updatedCharacter: charWithItem, logMessage } = addItemToInventory(updatedChar, baseItem, drop.quantity);
                    updatedChar = charWithItem;
                    winMsg += ` ${logMessage}`;
                }
            }
        }

        // New loot table system
        if (baseEnemyDef?.lootTable) {
            const lootTable = baseEnemyDef.lootTable;
            const levelMultiplier = 1 + (updatedChar.level - 1) * 0.1; // Scale loot with hero level
            
            // Process each rarity tier
            const rarityTiers = [
                { tier: 'common', chance: 0.6 },
                { tier: 'uncommon', chance: 0.3 },
                { tier: 'rare', chance: 0.08 },
                { tier: 'legendary', chance: 0.02 }
            ];

            for (const { tier, chance } of rarityTiers) {
                if (Math.random() < chance) {
                    const tierLoot = lootTable[tier as keyof typeof lootTable] as LootEntry[];
                    if (tierLoot && tierLoot.length > 0) {
                        // Select random item from this tier
                        const selectedLoot = tierLoot[Math.floor(Math.random() * tierLoot.length)];
                        if (Math.random() < selectedLoot.chance) {
                            const baseItem = items.find(i => i.id === selectedLoot.id);
                            if (baseItem) {
                                const quantity = Math.max(1, Math.floor(selectedLoot.quantity * levelMultiplier));
                                const { updatedCharacter: charWithItem, logMessage } = addItemToInventory(updatedChar, baseItem, quantity);
                                updatedChar = charWithItem;
                                winMsg += ` ${logMessage}`;
                            }
                        }
                    }
                }
            }

            // Gold drop
            if (Math.random() < lootTable.goldChance) {
                const goldAmount = Math.floor(
                    (lootTable.goldMin + Math.random() * (lootTable.goldMax - lootTable.goldMin)) * levelMultiplier
                );
                const goldItem = updatedChar.inventory.find(i => i.id === 'gold');
                if (goldItem) {
                    goldItem.quantity += goldAmount;
                    winMsg += ` Найдено ${goldAmount} золота.`;
                } else {
                    updatedChar.inventory.push({ id: 'gold', name: 'Золото', weight: 0, type: 'misc', quantity: goldAmount });
                    winMsg += ` Найдено ${goldAmount} золота.`;
                }
            }
        }

        // Award faction reputation for killing enemies near faction cities
        const factionId = getFactionForLocation(updatedChar.location);
        if (factionId) {
            if (!updatedChar.factions) updatedChar.factions = {};
            if (!updatedChar.factions[factionId]) {
                updatedChar.factions[factionId] = { reputation: 0 };
            }
            const reputationGain = 2; // Base reputation for killing enemies
            updatedChar.factions[factionId]!.reputation += reputationGain;
            winMsg += ` Репутация с ${getFactionName(factionId)} увеличилась на ${reputationGain}.`;
        }
        
        // Humorous flavor line and chronicle hook
        try {
            const { getHumorousVictoryLine } = await import('./game-engine');
            const humor = (getHumorousVictoryLine as any)?.(enemy.name, updatedChar.location) || '';
            if (humor) {
                logMessages.push(humor);
                if (updatedChar.combat) {
                    if (!updatedChar.combat.combatLog) updatedChar.combat.combatLog = [];
                    updatedChar.combat.combatLog.push(`[chronicle] combat_victory|Победа!|${humor}|Swords|enemy=${enemy.name}`);
                }
            }
        } catch {}
        logMessages.push(winMsg);
        // Append round messages to combat log before saving analytics
        if (updatedChar.combat?.combatLog) {
            updatedChar.combat.combatLog.push(...logMessages);
        }
        await saveCombatToAnalytics(updatedChar, true, false);
        updatedChar.status = 'idle';
        updatedChar.combat = null;
        return updatedChar;
    }
    
    // --- Enemy's Turn ---
    logMessages.push(`--- Ход ${enemy.name} ---`);
    if (updatedChar.combat && (updatedChar.combat.enemyStunnedRounds || 0) > 0) {
        updatedChar.combat.enemyStunnedRounds = Math.max(0, (updatedChar.combat.enemyStunnedRounds || 0) - 1);
        logMessages.push(`${enemy.name} оглушен и пропускает ход.`);
        updatedChar.combat.enemy = enemy;
        return updatedChar;
    }
    const enemyAttackBonus = getAttributeBonus(baseEnemyDef?.level || 1);
    const { roll: enemyRoll, updatedCharacter: charAfterEnemyRoll } = rollD20(updatedChar);
    updatedChar = charAfterEnemyRoll;
    let enemyTotalRoll = enemyRoll + enemyAttackBonus;
    
    // Calculate hero armor class (defense target)
    const equipmentAC = computeEquipmentArmorClass(updatedChar);
    const MAX_AC = 25; // Avoid unreachable targets (no 30+ AC)
    let heroDefenseTarget = 10 + getAttributeBonus(updatedChar.attributes.agility) + equipmentAC;
    if (heroAction === 'defend') {
        heroDefenseTarget += 5 + getAttributeBonus(updatedChar.attributes.strength);
    }
    heroDefenseTarget = Math.max(8, Math.min(MAX_AC, heroDefenseTarget));

    const enemySuccess = enemyTotalRoll >= heroDefenseTarget;
    updatedChar.combat!.lastRoll = { actor: 'enemy', action: 'Атака', roll: enemyRoll, bonus: enemyAttackBonus, total: enemyTotalRoll, target: heroDefenseTarget, success: enemySuccess };
    logMessages.push(`Бросок атаки врага: ${enemyRoll} + ${enemyAttackBonus} (бонус) = ${enemyTotalRoll} (цель: ${heroDefenseTarget})`);

    if (enemyRoll === 20) {
        let damageTaken = Math.max(1, Math.floor(baseEnemyDef!.damage * 1.5));
        updatedChar.stats.health.current -= damageTaken;
        updatedChar.combat!.totalDamageTaken = (updatedChar.combat!.totalDamageTaken || 0) + damageTaken;
        logMessages.push(`🎲 Критический удар! ${enemy.name} наносит ${damageTaken} урона.`);
        // Attempt to infect on critical hit as well
        updatedChar = tryApplyInfection(updatedChar, baseEnemyDef, logMessages);
    } else if (enemyRoll === 1) {
        logMessages.push(`🎲 Критический провал! ${enemy.name} спотыкается и падает, не нанося урона.`);
    } else if (enemySuccess) {
        let damageTaken = Math.max(1, baseEnemyDef!.damage);
        if (heroAction === 'defend') {
            damageTaken = Math.floor(damageTaken / 2);
            logMessages.push("Герой успешно блокирует, получив лишь половину урона!");
        }
        updatedChar.stats.health.current -= damageTaken;
        updatedChar.combat!.totalDamageTaken = (updatedChar.combat!.totalDamageTaken || 0) + damageTaken;
        logMessages.push(`${enemy.name} попадает, нанося ${damageTaken} урона.`);
        // Attempt to infect on successful hit
        updatedChar = tryApplyInfection(updatedChar, baseEnemyDef, logMessages);
    } else {
        logMessages.push("Герой ловко уворачивается от атаки!");
    }

    if (updatedChar.stats.health.current > 0) logMessages.push(`У героя осталось ${Math.max(0, updatedChar.stats.health.current)} здоровья.`);

    // Append this round's messages to persistent combat log
    if (updatedChar.combat?.combatLog) {
        updatedChar.combat.combatLog.push(...logMessages);
    }

    // Death check is handled in the main loop for clarity
    return updatedChar;
};

// Tries to apply disease infection from enemy to hero
function tryApplyInfection(character: Character, baseEnemyDef: any, logMessages: string[]): Character {
    if (!baseEnemyDef?.appliesEffect) return character;
    const eff = baseEnemyDef.appliesEffect;
    // Only diseases we recognize should persist permanently
    const isDisease = eff.id === 'disease_vampirism' || eff.id === 'disease_lycanthropy';
    if (!isDisease) return character;
    const alreadyDiseased = character.effects.some(e => e.id === 'disease_vampirism' || e.id === 'disease_lycanthropy');
    if (alreadyDiseased) return character;
    if (Math.random() < Math.max(0, Math.min(1, eff.chance))) {
        const updatedChar = structuredClone(character);
        const newEffect: ActiveEffect = {
            id: eff.id,
            name: eff.name,
            description: eff.description,
            icon: eff.icon,
            type: 'permanent',
            expiresAt: Infinity,
            data: { hungerLevel: 0, lastFedAt: Date.now() }
        };
        updatedChar.effects.push(newEffect);
        logMessages.push(`☠️ Герой заражен: ${eff.name}!`);
        return updatedChar;
    }
    return character;
}


// --- IDLE ACTIONS ---

const equipBestGearAction: Action = {
    name: "Оценить снаряжение",
    type: "system",
    getWeight: (char) => char.preferences?.autoEquip ? 100 : 0,
    canPerform: (char, worldState) => worldState.isIdle && (char.preferences?.autoEquip ?? true),
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const logMessages: string[] = [];
        let gearChanged = false;

        const slots: EquipmentSlot[] = ['weapon', 'head', 'torso', 'legs', 'hands', 'feet', 'amulet', 'ring'];

        for (const slot of slots) {
            const availableItems = updatedChar.inventory.filter((i: CharacterInventoryItem) => i.equipmentSlot === slot);
            
            if (availableItems.length === 0) {
                continue;
            }

            // Find the best available item by its primary stat (damage or armor)
            const bestAvailableItem = availableItems.reduce((best, current) => {
                const currentStat = (slot === 'weapon') ? (current.damage || 0) : (current.armor || 0);
                const bestStat = (slot === 'weapon') ? (best.damage || 0) : (best.armor || 0);
                return currentStat > bestStat ? current : best;
            });
            
            const bestAvailableStat = (slot === 'weapon' ? bestAvailableItem.damage : bestAvailableItem.armor) || 0;

            // Get the currently equipped item in this slot
            const currentItemId = updatedChar.equippedItems[slot];
            const currentItem = currentItemId ? updatedChar.inventory.find((i: CharacterInventoryItem) => i.id === currentItemId) : null;
            
            const currentStat = currentItem ? ((slot === 'weapon' ? currentItem.damage : currentItem.armor) || 0) : -1;

            // If the best available item is better than the currently equipped one
            if (bestAvailableItem && bestAvailableStat > currentStat) {
                updatedChar.equippedItems[slot] = bestAvailableItem.id;
                
                let logMessage = `Герой надевает ${bestAvailableItem.name}.`;
                if (currentItem) {
                    logMessage = `Герой снимает "${currentItem.name}" и надевает "${bestAvailableItem.name}".`;
                }
                logMessages.push(logMessage);
                gearChanged = true;
            }
        }

        if (!gearChanged) {
            return { character, logMessage: "" };
        }

        return { character: updatedChar, logMessage: logMessages };
    }
};


const takeQuestAction: Action = {
    name: "Взять задание",
    type: "quest",
    getWeight: (char, worldState) => {
        // STRICT SEQUENCING: High priority when just arrived and haven't completed activity
        const now = Date.now();
        const arrivalTime = char.lastLocationArrival || 0;
        const timeSinceArrival = now - arrivalTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeSinceArrival < fiveMinutes && !char.hasCompletedLocationActivity) {
            return priorityToWeight(Priority.HIGH); // Highest priority on fresh arrival
        }
        
        // IMPROVED: Quests should be the main activity for healthy characters
        const healthRatio = char.stats.health.current / char.stats.health.max;
        const staminaRatio = char.stats.stamina.current / char.stats.stamina.max;
        
        // Low health or stamina - questing is risky
        if (healthRatio < 0.4 || staminaRatio < 0.3) {
            return priorityToWeight(Priority.LOW);
        }
        
        // Good health and stamina - questing is HIGH priority!
        if (healthRatio > 0.7 && staminaRatio > 0.5) {
            return priorityToWeight(Priority.HIGH);
        }
        
        // Medium health/stamina - still good option
        return priorityToWeight(Priority.MEDIUM);
    },
    canPerform: (char, worldState, gameData) => {
        if (!worldState.canTakeQuest) {
            return false;
        }
        // Check if the character is on a cooldown from fleeing a quest combat
        const questCooldown = char.actionCooldowns?.['takeQuest'] || 0;
        return Date.now() >= questCooldown;
    },
    async perform(character: Character, gameData: GameData) {
        let updatedChar = structuredClone(character);
        const { enemies, quests } = gameData;
        
        const suitableQuests = quests.filter(q => {
            if (q.location !== updatedChar.location || 
                q.status !== 'available' || 
                character.level < q.requiredLevel ||
                (updatedChar.completedQuests || []).includes(q.id)) {
                return false;
            }
            if (q.requiredFaction) {
                const currentRep = updatedChar.factions[q.requiredFaction.id]?.reputation || 0;
                return currentRep >= q.requiredFaction.reputation;
            }
            return true;
        });

        const quest = suitableQuests[Math.floor(Math.random() * suitableQuests.length)];
        let initialLog = `Задание "${quest.title}"? Звучит как неплохой способ разбогатеть. Герой берется за дело.`;

        if (quest.type === 'bounty' || (quest.type === 'side' && Math.random() < (quest.combatChance || 0))) {
            const baseEnemy = enemies.find(e => e.id === quest.targetEnemyId) || enemies[Math.floor(Math.random() * enemies.length)];
            const levelMultiplier = 1 + (character.level - 1) * 0.15;
            const enemy = { 
                name: baseEnemy.name, 
                health: { current: Math.floor(baseEnemy.health * levelMultiplier), max: Math.floor(baseEnemy.health * levelMultiplier) }, 
                damage: Math.floor(baseEnemy.damage * levelMultiplier), 
                xp: Math.floor(baseEnemy.xp * levelMultiplier),
                armor: Math.max(8, Math.min(25, (baseEnemy.armor ?? (10 + (baseEnemy.level || 1))))),
                appliesEffect: baseEnemy.appliesEffect || null,
            };

            // Analytics Tracking for encounter
            if (!updatedChar.analytics.encounteredEnemies.includes(baseEnemy.id)) {
                updatedChar.analytics.encounteredEnemies.push(baseEnemy.id);
            }


            updatedChar.status = 'in-combat';
            updatedChar.combat = { enemyId: baseEnemy.id, enemy, onWinQuestId: quest.id, fleeAttempted: false };
            updatedChar = addToActionHistory(updatedChar, 'quest');
            const questLog = `Герой выследил цель по заданию и вступает в бой с ${enemy.name}!`;
            return { character: updatedChar, logMessage: initialLog + " " + questLog };
        } else {
            updatedChar.status = 'busy';
            updatedChar.currentAction = {
                type: "quest", name: `Выполнение: ${quest.title}`, description: quest.narrative,
                startedAt: Date.now(), duration: quest.duration * 60 * 1000, questId: quest.id,
            };
            updatedChar = addToActionHistory(updatedChar, 'quest');
            return { character: updatedChar, logMessage: initialLog + ` Герой приступил к выполнению.` };
        }
    }
};

const exploreCityAction: Action = {
    name: "Провести время в городе",
    type: "social",
    getWeight: (char, worldState) => {
        if (!worldState.isLocationSafe || !worldState.canExploreCity) return 0;
        
        // SIMPLIFIED (Godville-style): Basic priority
        // City exploration is generally a LOW priority background activity
        return priorityToWeight(Priority.LOW);
    },
    canPerform: (char, worldState) => worldState.isLocationSafe! && worldState.canExploreCity!,
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        updatedChar.status = 'busy';

        const roll = Math.random();

        if (character.mood < 40 && roll < 0.4) { // Feeling down, seeks company
            updatedChar.mood = Math.min(100, updatedChar.mood + 10);
            updatedChar.currentAction = { type: 'explore', name: 'Общение в таверне', description: 'Герой решил пропустить стаканчик в таверне и поболтать с местными, чтобы поднять себе настроение.', startedAt: Date.now(), duration: 2.5 * 60 * 1000 };
            updatedChar = addToActionHistory(updatedChar, 'social');
            return { character: updatedChar, logMessage: 'Чувствуя себя не в своей тарелке, герой отправляется в таверну, чтобы развеяться.' };
        }
        if (roll < 0.15) { // Stupid action
            const rustyDagger = updatedChar.inventory.find(i => i.id === 'weapon_dagger_rusty');
            if (rustyDagger) {
                rustyDagger.quantity -= 1;
                if (rustyDagger.quantity <= 0) updatedChar.inventory = updatedChar.inventory.filter(i => i.id !== rustyDagger.id);
                const fine = 50;
                let logMessage = "Герой решил, что старому ржавому кинжалу не место в его сумке и отдал его стражнику. Стражник этого не оценил. ";
                const goldItem = updatedChar.inventory.find(i => i.id === 'gold')!;
                if (goldItem.quantity >= fine) {
                    goldItem.quantity -= fine;
                    logMessage += `Пришлось заплатить штраф в ${fine} золота.`;
                } else {
                    logMessage += `Денег на штраф не хватило, так что арест будет дольше.`;
                }
                updatedChar.mood = Math.max(0, updatedChar.mood - 20);
                updatedChar.currentAction = { type: 'jail', name: 'В тюрьме', description: 'Отбывает наказание за... странное поведение.', startedAt: Date.now(), duration: 5 * 60 * 1000 };
                const debuff: ActiveEffect = { id: 'public_shame', name: 'Публичное унижение', description: 'От позора и голода в камере силы восстанавливаются медленнее.', icon: 'EyeOff', type: 'debuff', expiresAt: Date.now() + 15 * 60 * 1000 };
                updatedChar.effects = updatedChar.effects.filter(e => e.id !== debuff.id);
                updatedChar.effects.push(debuff);
                return { character: updatedChar, logMessage: logMessage + ` Герой брошен в камеру на 5 минут.` };
            }
        }
        if (roll < 0.60 && gameData.npcs.some(npc => npc.location === updatedChar.location && npc.inventory && npc.inventory.length > 0)) { // Trading
            updatedChar.currentAction = { type: 'trading', name: `Торговля`, description: 'Герой решил прицениться к товарам в местной лавке.', startedAt: Date.now(), duration: 1.5 * 60 * 1000 };
            return { character: updatedChar, logMessage: 'Герой решил осмотреться в городе. Возможно, найдется что-то интересное в лавках... или в чужих карманах.' };
        }
        // Default: walk around
        updatedChar.currentAction = { type: 'explore', name: 'Прогулка по городу', description: 'Герой бесцельно бродит по улицам, впитывая атмосферу.', startedAt: Date.now(), duration: 2 * 60 * 1000 };
        updatedChar = addToActionHistory(updatedChar, 'explore');
        return { character: updatedChar, logMessage: 'Герой решил просто прогуляться по городу и осмотреться.' };
    }
};

// Enhanced: Sell low-value items and duplicates to free space or get cash
const sellJunkAction: Action = {
    name: "Продать хлам",
    type: "social",
    getWeight: (char, worldState, gameData) => {
        // High priority if overencumbered
        if (worldState.isOverencumbered) return priorityToWeight(Priority.URGENT);
        
        // Check for duplicates (more than 5 of same item)
        const hasDuplicates = char.inventory.some(i => 
            i.id !== 'gold' && 
            i.type !== 'key_item' &&
            i.quantity > 5 && 
            !Object.values(char.equippedItems || {}).includes(i.id)
        );
        if (hasDuplicates) return priorityToWeight(Priority.MEDIUM);
        
        // Medium if gold is low (< 100) and in safe location with merchant
        const gold = char.inventory.find(i => i.id === 'gold')?.quantity || 0;
        const hasMerchant = gameData.npcs.some(n => (n.location === char.location || n.location === 'on_road') && n.inventory && n.inventory.length > 0);
        if (gold < 100 && hasMerchant) return priorityToWeight(Priority.MEDIUM);
        
        return priorityToWeight(Priority.DISABLED);
    },
    canPerform: (char, worldState, gameData) => {
        if (!worldState.isLocationSafe) return false;
        const hasMerchant = gameData.npcs.some(n => (n.location === char.location || n.location === 'on_road') && n.inventory && n.inventory.length > 0);
        if (!hasMerchant) return false;
        // Any sellable item available?
        return char.inventory.some(i => i.id !== 'gold' && i.type !== 'key_item' && i.quantity > 0 && !Object.values(char.equippedItems || {}).includes(i.id));
    },
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        // Find merchants nearby
        const merchants = gameData.npcs.filter(n => (n.location === updatedChar.location || n.location === 'on_road') && n.inventory && n.inventory.length > 0);
        if (merchants.length === 0) {
            return { character, logMessage: 'Рядом нет торговцев.' };
        }
        
        const equippedSet = new Set(Object.values(updatedChar.equippedItems || {}));
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];
        
        // Priority 1: Sell duplicates (30-50% of excess)
        const duplicates = updatedChar.inventory.filter(i => 
            i.id !== 'gold' && 
            i.type !== 'key_item' &&
            i.quantity > 5 && 
            !equippedSet.has(i.id)
        );
        
        if (duplicates.length > 0) {
            const target = duplicates[Math.floor(Math.random() * duplicates.length)];
            const excessQuantity = target.quantity - 5; // Keep 5, sell the rest
            const sellQuantity = Math.max(1, Math.floor(excessQuantity * (0.3 + Math.random() * 0.2))); // 30-50% of excess
            
            const result = await tradeWithNPC(updatedChar.id, merchant.id, 'sell', target.id, sellQuantity);
            if (result.success) {
                const refreshedChar = await getCharacterById(updatedChar.id);
                if (!refreshedChar) {
                    return { character, logMessage: 'Ошибка: персонаж не найден после продажи.' };
                }
                updatedChar = addToActionHistory(refreshedChar as Character, 'social');
                return { character: updatedChar, logMessage: `Герой продал ${sellQuantity} ${target.name} торговцу ${merchant.name}. ${result.message}` };
            }
        }
        
        // Priority 2: Sell low-value items (junk)
        const sellable = updatedChar.inventory
            .filter(i => i.id !== 'gold' && i.type !== 'key_item' && i.quantity > 0 && !equippedSet.has(i.id) && i.type !== 'spell_tome')
            .map(i => ({ item: i, value: computeBaseValue(i as any) }))
            .sort((a, b) => a.value - b.value);
            
        if (sellable.length === 0) {
            return { character, logMessage: 'Нечего продавать.' };
        }
        
        const target = sellable[0].item;
        const qty = 1;
        const result = await tradeWithNPC(updatedChar.id, merchant.id, 'sell', target.id, qty);
        if (result.success) {
            const refreshedChar = await getCharacterById(updatedChar.id);
            if (!refreshedChar) {
                return { character, logMessage: 'Ошибка: персонаж не найден после продажи.' };
            }
            updatedChar = addToActionHistory(refreshedChar as Character, 'social');
            return { character: updatedChar, logMessage: `Герой продал ${target.name} торговцу ${merchant.name}. ${result.message}` };
        }
        return { character, logMessage: `Не удалось продать предмет: ${result.error}` };
    }
};

// NEW: Attempt to steal in city — risk of fine or jail
const stealAction: Action = {
    name: "Украсть",
    type: "social",
    getWeight: (char, worldState, gameData) => {
        if (!worldState.isLocationSafe) return priorityToWeight(Priority.DISABLED);
        // Only try in towns with NPCs/shops
        const hasTargets = gameData.npcs.some(n => n.location === char.location && (n.inventory && n.inventory.length > 0));
        if (!hasTargets) return priorityToWeight(Priority.DISABLED);
        
        // Weather and time modifiers for stealing
        const weatherEffect = getWeatherModifiers(char.weather);
        const timeOfDayEffect = getTimeOfDayModifiers(char.timeOfDay);
        const stealthModifier = weatherEffect.stealthModifier + timeOfDayEffect.stealthModifier;
        
        // Night time and fog make stealing more attractive
        let baseWeight = Priority.LOW;
        if (char.timeOfDay === 'night' || char.weather === 'Fog') {
            baseWeight = Priority.MEDIUM;
        }
        
        // If broke, more motivation
        const gold = char.inventory.find(i => i.id === 'gold')?.quantity || 0;
        if (gold < 50) baseWeight = Priority.MEDIUM;
        
        return priorityToWeight(baseWeight);
    },
    canPerform: (char, worldState, gameData) => {
        if (!worldState.isLocationSafe) return false;
        return gameData.npcs.some(n => n.location === char.location && (n.inventory && n.inventory.length > 0));
    },
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        updatedChar.status = 'busy';
        updatedChar.currentAction = { type: 'explore', name: 'Попытка кражи', description: 'Герой осторожно присматривается к добыче.', startedAt: Date.now(), duration: 30 * 1000 };

        // Success chance influenced by agility, mood, weather, and time
        const agility = updatedChar.attributes.agility || 10;
        const weatherEffect = getWeatherModifiers(updatedChar.weather);
        const timeOfDayEffect = getTimeOfDayModifiers(updatedChar.timeOfDay);
        
        let baseChance = 0.25 + Math.min(0.25, agility * 0.01) + (updatedChar.mood - 50) * 0.002; // 10 agility => +10%
        
        // Apply weather and time modifiers
        const stealthModifier = weatherEffect.stealthModifier + timeOfDayEffect.stealthModifier;
        baseChance *= (1 + stealthModifier * 0.1); // 10% per stealth modifier point
        
        const chance = Math.max(0.05, Math.min(0.8, baseChance));
        const roll = Math.random();

        // Pick a random NPC with inventory
        const candidates = gameData.npcs.filter(n => n.location === updatedChar.location && n.inventory && n.inventory.length > 0);
        if (candidates.length === 0) {
            return { character, logMessage: 'Здесь некого обокрасть.' };
        }
        const target = candidates[Math.floor(Math.random() * candidates.length)];

        if (roll < chance) {
            // Success: add a small item from target inventory
            const itemRef = target.inventory![Math.floor(Math.random() * target.inventory!.length)];
            const baseItem = gameData.items.find(i => i.id === itemRef.itemId);
            if (baseItem) {
                const { updatedCharacter, logMessage } = addItemToInventory(updatedChar, baseItem, 1);
                updatedChar = updatedCharacter;
                updatedChar.mood = Math.min(100, updatedChar.mood + 5);
                updatedChar = addToActionHistory(updatedChar, 'social');
                return { character: updatedChar, logMessage: `Герой украл: ${baseItem.name}. ${logMessage}` };
            }
            return { character: updatedChar, logMessage: 'Попытка кражи удалась, но стоящего предмета не оказалось.' };
        }

        // Failure: pay fine if possible, else jail
        const goldItem = updatedChar.inventory.find(i => i.id === 'gold');
        const fine = 100;
        let log = `Попытка кражи провалилась! `;
        if (goldItem && goldItem.quantity >= fine) {
            goldItem.quantity -= fine;
            updatedChar.mood = Math.max(0, updatedChar.mood - 10);
            updatedChar = addToActionHistory(updatedChar, 'social');
            log += `Пришлось заплатить штраф в ${fine} золота.`;
            return { character: updatedChar, logMessage: log };
        }

        updatedChar.mood = Math.max(0, updatedChar.mood - 20);
        updatedChar.currentAction = { type: 'jail', name: 'Арестован', description: 'Стража поймала героя на месте преступления.', startedAt: Date.now(), duration: 4 * 60 * 1000 };
        const debuff: ActiveEffect = { id: 'public_shame', name: 'Публичное унижение', description: 'От позора и голода в камере силы восстанавливаются медленнее.', icon: 'EyeOff', type: 'debuff', expiresAt: Date.now() + 10 * 60 * 1000 };
        updatedChar.effects = updatedChar.effects.filter(e => e.id !== debuff.id);
        updatedChar.effects.push(debuff);
        return { character: updatedChar, logMessage: log + ' Герой брошен в камеру.' };
    }
};

// NEW: Eat food when hungry or injured
const eatFoodAction: Action = {
    name: "Перекусить",
    type: "rest",
    getWeight: (char, worldState) => {
        const hasFood = char.inventory.some(i => i.type === 'food' && i.quantity > 0);
        if (!hasFood) return priorityToWeight(Priority.DISABLED);
        const healthRatio = char.stats.health.current / char.stats.health.max;
        const staminaRatio = char.stats.stamina.current / char.stats.stamina.max;
        if (healthRatio < 0.4 || staminaRatio < 0.4) return priorityToWeight(Priority.HIGH);
        if (healthRatio < 0.8 || staminaRatio < 0.7) return priorityToWeight(Priority.MEDIUM);
        return priorityToWeight(Priority.LOW);
    },
    canPerform: (char) => char.inventory.some(i => i.type === 'food' && i.quantity > 0),
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const foodIndex = updatedChar.inventory.findIndex(i => i.type === 'food' && i.quantity > 0);
        if (foodIndex === -1) {
            return { character, logMessage: 'В сумке пусто. Нечего съесть.' };
        }
        const foodItem = updatedChar.inventory[foodIndex];
        foodItem.quantity -= 1;
        if (foodItem.quantity <= 0) {
            updatedChar.inventory.splice(foodIndex, 1);
        }
        // Apply effect
        const effect = foodItem.effect;
        let log = `Герой съел: ${foodItem.name}.`;
        if (effect) {
            if (effect.type === 'heal') {
                const statKey = effect.stat as keyof typeof updatedChar.stats;
                // Only apply to valid stats
                if (statKey in updatedChar.stats) {
                    // @ts-ignore
                    const pool = updatedChar.stats[statKey];
                    pool.current = Math.min(pool.max, pool.current + (effect.amount || 0));
                    log += ` Восстановлено ${effect.amount} ${effect.stat}.`;
                }
            } else if (effect.type === 'buff' && effect.id) {
                // Remove existing same buff, then add
                updatedChar.effects = updatedChar.effects.filter(e => e.id !== effect.id);
                updatedChar.effects.push({
                    id: effect.id,
                    name: effect.description || 'Эффект еды',
                    description: effect.description || 'Временный положительный эффект после еды.',
                    icon: effect.icon || 'Drumstick',
                    type: 'buff',
                    expiresAt: Date.now() + (effect.duration || 5 * 60 * 1000),
                });
                log += ` Получен бафф: ${effect.description || effect.id}.`;
            }
        }
        updatedChar = addToActionHistory(updatedChar, 'rest');
        return { character: updatedChar, logMessage: log };
    }
};

const findEnemyAction: Action = {
    name: "Найти врага",
    type: "combat",
    getWeight: (char, worldState, gameData) => {
        if (worldState.isLocationSafe) return 0;

        // Readiness scoring: gear, potions, spells, HP
        const healthRatio = char.stats.health.current / char.stats.health.max;
        const hasHealingPotions = char.inventory.filter(i => i.type === 'potion' && i.effect?.type === 'heal').reduce((s, p) => s + p.quantity, 0);
        const hasOffensiveSpell = (char.knownSpells || []).some(id => {
            const s = allSpells.find(sp => sp.id === id);
            return s && s.type === 'damage';
        });

        // Gear score: best weapon damage + sum armor pieces
        const weapon = char.equippedItems.weapon ? char.inventory.find(i => i.id === char.equippedItems.weapon) : null;
        const bestWeaponDamage = weapon?.damage || 0;
        const armorSum = (['head','torso','legs','hands','feet'] as EquipmentSlot[])
            .map((slot: EquipmentSlot) => char.equippedItems[slot])
            .map((id) => (id ? (char.inventory.find(i => i.id === id)?.armor || 0) : 0))
            .reduce((a,b)=>a+b,0);

        const gearScore = bestWeaponDamage + armorSum * 0.3;
        const potionScore = Math.min(3, hasHealingPotions) * 5;
        const spellScore = hasOffensiveSpell ? 8 : 0;
        const hpScore = Math.floor(healthRatio * 20);
        const readiness = gearScore + potionScore + spellScore + hpScore;

        // Threat estimate: average enemy tier at location (fallback medium)
        const locationEnemies = gameData.enemies.filter(e => !e.isUnique);
        const avgEnemyTier = locationEnemies.length > 0 ? locationEnemies.reduce((s,e)=>s+(e.level||1),0)/locationEnemies.length : 3;
        const dangerMultiplier = 6; // tuneable
        const threat = avgEnemyTier * dangerMultiplier;

        const engageScore = readiness - threat; // higher means safer to fight
        if (healthRatio < 0.3) return priorityToWeight(Priority.DISABLED);
        if (engageScore < 0) return priorityToWeight(Priority.LOW);
        if (engageScore < 20) return priorityToWeight(Priority.MEDIUM);
        return priorityToWeight(Priority.HIGH);
    },
    canPerform: (char, worldState) => !worldState.isLocationSafe!,
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const possibleEnemies = gameData.enemies.filter(e => !e.isUnique && (e.minLevel || 1) <= character.level);
        if (possibleEnemies.length === 0) {
            return { character, logMessage: "Герой искал приключений, но в округе было тихо."};
        }
        const baseEnemy = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
        const levelMultiplier = 1 + (character.level - 1) * 0.15;
        const finalEnemy = {
            name: baseEnemy.name,
            health: { current: Math.floor(baseEnemy.health * levelMultiplier), max: Math.floor(baseEnemy.health * levelMultiplier) },
            damage: Math.floor(baseEnemy.damage * levelMultiplier),
            xp: Math.floor(baseEnemy.xp * levelMultiplier),
            armor: Math.max(8, Math.min(25, (baseEnemy.armor ?? (10 + (baseEnemy.level || 1))))),
            appliesEffect: baseEnemy.appliesEffect || null,
        };
        if (Math.random() < 0.1) { // Stealth kill
             updatedChar.xp.current += finalEnemy.xp;
             updatedChar.analytics.killedEnemies[baseEnemy.id] = (updatedChar.analytics.killedEnemies[baseEnemy.id] || 0) + 1;
             if (!updatedChar.analytics.encounteredEnemies.includes(baseEnemy.id)) {
                updatedChar.analytics.encounteredEnemies.push(baseEnemy.id);
             }
             return { character: updatedChar, logMessage: `Герой подкрался к ${finalEnemy.name} незамеченным и нанес смертельный удар! Получено ${finalEnemy.xp} опыта.` };
        }

        // Analytics Tracking for encounter
        if (!updatedChar.analytics.encounteredEnemies.includes(baseEnemy.id)) {
            updatedChar.analytics.encounteredEnemies.push(baseEnemy.id);
        }

        updatedChar.status = 'in-combat';
        updatedChar.combat = { enemyId: baseEnemy.id, enemy: finalEnemy, fleeAttempted: false };
        updatedChar = addToActionHistory(updatedChar, 'combat');
        return { character: updatedChar, logMessage: `Впереди опасность! Герой вступает в бой с ${finalEnemy.name}!` };
    }
};

const travelAction: Action = {
    name: "Путешествовать",
    type: "travel",
    getWeight: (char) => {
        // IMPROVED: Prevent aimless wandering with repetition penalty
        if (char.divineDestinationId) {
            return priorityToWeight(Priority.HIGH); // Divine command is always high
        }
        
        // STRICT SEQUENCING: Check if character has completed location activity
        const now = Date.now();
        const arrivalTime = char.lastLocationArrival || 0;
        const timeSinceArrival = now - arrivalTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        // If arrived recently and hasn't completed activity, disable travel
        if (timeSinceArrival < fiveMinutes && !char.hasCompletedLocationActivity) {
            return priorityToWeight(Priority.DISABLED);
        }
        
        // Check recent travel history - discourage constant travel
        const recentTravelCount = countRecentActions(char, 'travel', 10);
        
        // If traveled recently multiple times, drastically reduce weight
        if (recentTravelCount >= 3) {
            // Fallback: if character is stagnating (no progress) allow escape via travel
            const lastNonWander = [...(char.actionHistory||[])].reverse().find(a => a.type !== 'misc');
            const stagnantTicks = (char.actionHistory||[]).slice(-8).every(a => a.type === 'misc') ? 8 : 0;
            if (stagnantTicks >= 5) {
                return priorityToWeight(Priority.LOW); // temporarily allow travel to escape
            }
            return priorityToWeight(Priority.DISABLED); // Stop wandering normally
        }
        if (recentTravelCount >= 2) {
            return priorityToWeight(Priority.LOW) * 0.3; // Strong penalty
        }
        
        // Prefer traveling after completing one local activity
        if (char.hasCompletedLocationActivity) {
            return priorityToWeight(Priority.HIGH);
        }
        return priorityToWeight(Priority.LOW);
    },
    canPerform: (char, worldState, gameData) =>
        !worldState.isOverencumbered &&
        gameData.locations.length > 1 &&
        char.stats.stamina.current > char.stats.stamina.max * 0.25,
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const { locations } = gameData;
        const currentLocationName = locations.find(l => l.id === character.location)?.name || 'неизвестного места';
        
        let destination = null;
        if (character.divineDestinationId) {
            destination = locations.find(l => l.id === character.divineDestinationId);
        } else {
            const possibleDestinations = locations.filter(l => l.id !== updatedChar.location);
            if (possibleDestinations.length > 0) {
                destination = possibleDestinations[Math.floor(Math.random() * possibleDestinations.length)];
            }
        }

        if (!destination) {
            return { character, logMessage: "Герою некуда идти. Он остался на месте."};
        }

        updatedChar.status = 'busy';
        updatedChar.currentAction = { 
            type: 'travel', 
            name: `Путешествие в ${destination.name}`, 
            description: `Герой идет пешком в ${destination.name}.`, 
            startedAt: Date.now(), 
            duration: 3 * 60 * 1000, 
            destinationId: destination.id 
        };
        updatedChar.currentAction.originalDuration = updatedChar.currentAction.duration;
        updatedChar = addToActionHistory(updatedChar, 'travel');
        return { character: updatedChar, logMessage: `Дорога зовет! Герой покинул ${currentLocationName} и держит путь в ${destination.name}.` };
    }
};

const restAtTavernAction: Action = {
    name: "Отдохнуть в таверне",
    type: "rest",
    getWeight: (char, worldState) => {
        if (!worldState.isLocationSafe || !worldState.isInjured) return 0;
        
        // STRICT SEQUENCING: Medium priority when just arrived and haven't completed activity
        const now = Date.now();
        const arrivalTime = char.lastLocationArrival || 0;
        const timeSinceArrival = now - arrivalTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeSinceArrival < fiveMinutes && !char.hasCompletedLocationActivity) {
            return priorityToWeight(Priority.MEDIUM); // Medium priority on fresh arrival
        }
        
        // SIMPLIFIED (Godville-style): Priority based on health
        const healthRatio = char.stats.health.current / char.stats.health.max;
        
        // Critical health - rest is URGENT!
        if (healthRatio < 0.3) {
            return priorityToWeight(Priority.URGENT);
        }
        
        // Low health - rest is important
        if (healthRatio < 0.6) {
            return priorityToWeight(Priority.HIGH);
        }
        
        // Minor injuries - rest is an option
        return priorityToWeight(Priority.MEDIUM);
    },
    canPerform: (char, worldState) => worldState.isLocationSafe! && worldState.isInjured! && worldState.hasEnoughGoldForRest!,
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const cost = 10;
        const goldItem = updatedChar.inventory.find(i => i.id === 'gold')!;
        goldItem.quantity -= cost;
        updatedChar.status = 'busy';
        updatedChar.currentAction = { type: 'rest', name: 'Отдых в таверне', description: 'Герой отдыхает за кружкой эля, восстанавливая силы.', startedAt: Date.now(), duration: 30 * 1000 };
        
        const restedEffect: ActiveEffect = {
            id: 'rested', name: 'Отдохнувший', description: 'Короткий отдых придал сил. Запас сил восстанавливается немного быстрее.',
            icon: 'Coffee', type: 'buff', expiresAt: Date.now() + 10 * 60 * 1000,
        };
        if (!updatedChar.effects.some(e => e.id === 'well_rested' || e.id === 'rested')) {
            updatedChar.effects.push(restedEffect);
        }

        updatedChar = addToActionHistory(updatedChar, 'rest');
        return { character: updatedChar, logMessage: `Герой заплатил ${cost} золотых и присел отдохнуть в таверне на полминуты.` };
    }
};

const makeCampAction: Action = {
    name: "Сделать привал",
    type: "rest",
    getWeight: (char, worldState) => {
        if (!worldState.isTired) return 0;
        
        const healthRatio = char.stats.health.current / char.stats.health.max;
        const fatigueRatio = char.stats.fatigue.current / char.stats.fatigue.max;
        
        // Strong weight increase with fatigue
        let weight = fatigueRatio * 90; // Up to 90 when exhausted
        
        // Additional boost if injured
        weight += (1 - healthRatio) * 40;
        
        // Boost after traveling or combat
        if (countRecentActions(char, 'travel', 3) > 1) {
            weight += 30;
        }
        
        return Math.max(1, weight);
    },
    canPerform: (char, worldState) => worldState.isTired!,
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        updatedChar.status = 'busy';
        
        const food = updatedChar.inventory.find(i => i.type === 'food');
        let foodLog = "Герой делает привал, чтобы перевести дух. Усталость валит с ног.";
        
        if (food) {
            food.quantity -= 1;
            if (food.quantity <= 0) {
                updatedChar.inventory = updatedChar.inventory.filter(i => i.id !== food.id);
            }
            foodLog += ` Он съедает ${food.name}, восстанавливая немного здоровья.`;
            updatedChar.stats.health.current = Math.min(updatedChar.stats.health.max, updatedChar.stats.health.current + (food.effect?.amount || 10));
            
            if (food.effect?.type === 'buff' && food.effect.id && food.effect.duration) {
                const newEffect: ActiveEffect = {
                    id: food.effect.id,
                    name: food.name,
                    description: food.effect.description || "Временное усиление от еды.",
                    icon: food.effect.icon || 'Sparkles',
                    type: 'buff',
                    expiresAt: Date.now() + food.effect.duration,
                };
                updatedChar.effects = updatedChar.effects.filter(e => e.id !== newEffect.id);
                updatedChar.effects.push(newEffect);
                foodLog += ` Еда придает ему сил: "${newEffect.name}".`;
            }
        } else {
            foodLog += " Еды в сумке не оказалось, так что отдых будет коротким.";
        }
        
        updatedChar.currentAction = { type: 'travel_rest', name: 'Привал', description: 'Герой отдыхает у импровизированного костра, чтобы восстановить силы для дальнейшего пути.', startedAt: Date.now(), duration: 45 * 1000 };
        updatedChar = addToActionHistory(updatedChar, 'rest');
        return { character: updatedChar, logMessage: foodLog };
    }
};


const sleepAtTavernAction: Action = {
    name: "Переночевать в таверне",
    type: "rest",
    getWeight: (char, worldState) => {
        if (!worldState.isLocationSafe || worldState.isWellRested) return 0;
        
        const healthRatio = char.stats.health.current / char.stats.health.max;
        const staminaRatio = char.stats.stamina.current / char.stats.stamina.max;
        const fatigueRatio = char.stats.fatigue.current / char.stats.fatigue.max;
        
        // Prefer strong sleep when fatigue is high
        if (fatigueRatio >= 0.7) {
            return priorityToWeight(Priority.URGENT);
        }

        // Otherwise scale with resources and moderate fatigue
        let weight = 30;
        if (healthRatio < 0.7) weight += (0.7 - healthRatio) * 100;
        if (staminaRatio < 0.5) weight += (0.5 - staminaRatio) * 60;
        weight += fatigueRatio * 60;

        return Math.max(1, weight);
    },
    canPerform: (char, worldState) => {
        if (!worldState.isLocationSafe || worldState.isWellRested || !worldState.hasEnoughGoldForSleep) return false;
        const fatigueRatio = char.stats.fatigue.current / char.stats.fatigue.max;
        const healthRatio = char.stats.health.current / char.stats.health.max;
        // Allow sleep either due to high fatigue or noticeable injury
        return fatigueRatio >= 0.5 || healthRatio < 0.85;
    },
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const cost = 250;
        const goldItem = updatedChar.inventory.find(i => i.id === 'gold')!;
        goldItem.quantity -= cost;
        updatedChar.status = 'sleeping';
        updatedChar.sleepUntil = Date.now() + 5 * 60 * 1000;
        updatedChar = addToActionHistory(updatedChar, 'rest');
        return { character: updatedChar, logMessage: `Герой заплатил ${cost} золотых за комнату в таверне и лег спать. Он проснется через 5 минут.` };
    }
};

const learnSpellAction: Action = {
    name: "Изучить заклинание",
    type: "learn",
    getWeight: () => 70, // High weight, it's always good to learn spells
    canPerform: (char, worldState) => worldState.hasUnreadTome!,
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const tome = updatedChar.inventory.find(
            i => i.type === 'spell_tome' && i.spellId != null && !(character.knownSpells || []).includes(i.spellId)
        )!;
        const spellToLearn = allSpells.find(s => s.id === tome.spellId)!;

        if (!updatedChar.knownSpells) updatedChar.knownSpells = [];
        let logMessage: string;

        if (updatedChar.knownSpells.includes(spellToLearn.id)) {
            logMessage = `Герой перечитал ${tome.name}, но уже знает это заклинание. Том рассыпался в пыль.`;
        } else {
            updatedChar.knownSpells.push(spellToLearn.id);
            logMessage = `Герой изучает ${tome.name} и осваивает заклинание: "${spellToLearn.name}"!`;
        }

        tome.quantity -= 1;
        if (tome.quantity <= 0) updatedChar.inventory = updatedChar.inventory.filter(i => i.id !== tome.id);
        updatedChar = addToActionHistory(updatedChar, 'learn');
        return { character: updatedChar, logMessage };
    },
};

const readLearningBookAction: Action = {
    name: "Изучить обучающую книгу",
    type: "learn",
    getWeight: () => 80, // Very high weight, these buffs are great
    canPerform: (char, worldState) => worldState.hasUnreadLearningBook!,
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const book = updatedChar.inventory.find(i => i.type === 'learning_book' && i.learningEffect)!;
        
        if (!book || !book.learningEffect) {
            return { character, logMessage: "" };
        }

        const effect = book.learningEffect;
        
        const newEffect: ActiveEffect = {
            id: effect.id,
            name: effect.name,
            description: effect.description,
            icon: effect.icon,
            type: 'buff',
            expiresAt: Date.now() + effect.duration,
        };
        
        updatedChar.effects = updatedChar.effects.filter(e => e.id !== newEffect.id);
        updatedChar.effects.push(newEffect);

        const logMessage = `Герой прочел "${book.name}" и получил вдохновение: "${effect.name}"!`;

        book.quantity -= 1;
        if (book.quantity <= 0) {
            updatedChar.inventory = updatedChar.inventory.filter(i => i.id !== book.id);
        }
        
        updatedChar = addToActionHistory(updatedChar, 'learn');
        return { character: updatedChar, logMessage };
    },
};

const donateToFactionAction: Action = {
    name: "Пожертвовать фракции",
    type: "social",
    getWeight: (char) => {
        const gold = char.inventory.find(i => i.id === 'gold')?.quantity || 0;
        // Updated weight system based on gold amount
        if (gold > 2000) return 35; // More frequent when very rich
        if (gold > 1000) return 20; // Moderate frequency
        if (gold > 500) return 10;  // Less frequent
        return 0; // Don't donate when poor
    },
    canPerform: (char, worldState) => worldState.isLocationSafe! && worldState.hasEnoughGoldForDonation!,
    async perform(character, gameData) {
        let entitiesToDonate = allFactions.filter(f => 
            !f.joinRestrictions || !f.joinRestrictions.includes(character.backstory)
        ).map(f => ({ id: f.id, name: f.name }));
        
        entitiesToDonate.push({ id: `deity_${character.patronDeity}`, name: `Храм Покровителя` });
        
        if (entitiesToDonate.length === 0) {
            return { character, logMessage: "" };
        }

        // 70% chance to donate to temple, 30% to factions
        const isTempleDonation = Math.random() < 0.7;
        let entityToDonate;
        
        if (isTempleDonation) {
            entityToDonate = { id: `deity_${character.patronDeity}`, name: `Храм Покровителя` };
        } else {
            const availableFactions = entitiesToDonate.filter(e => !e.id.startsWith('deity_'));
            entityToDonate = availableFactions[Math.floor(Math.random() * availableFactions.length)];
        }
        
        // Dynamic donation amount: 5-10% of current gold (min 50, max 500)
        const currentGold = character.inventory.find(i => i.id === 'gold')?.quantity || 0;
        const percentage = 0.05 + Math.random() * 0.05; // 5-10%
        const donationAmount = Math.max(50, Math.min(500, Math.floor(currentGold * percentage)));
        
        // Directly update character data to avoid async server action dependency in brain
        let updatedChar = structuredClone(character);
        const gold = updatedChar.inventory.find(i => i.id === 'gold');
        if (!gold || gold.quantity < donationAmount) {
             return { character, logMessage: `Герой хотел сделать пожертвование, но в карманах ветер свищет.` };
        }
        
        gold.quantity -= donationAmount;
        let logMessage = '';

        if (entityToDonate.id.startsWith('deity_')) {
            updatedChar.templeProgress = (updatedChar.templeProgress || 0) + donationAmount;
            const templeProgress = updatedChar.templeProgress;
            const templeGoal = 1000000; // TEMPLE_GOAL from factions page
            const progressPercent = (templeProgress / templeGoal) * 100;
            logMessage = `Движимый верой, герой пожертвовал ${donationAmount} золота на постройку храма для своего покровителя. Прогресс: ${progressPercent.toFixed(2)}%.`;
        } else {
             if (!updatedChar.factions) {
                updatedChar.factions = {};
            }
            if (!updatedChar.factions[entityToDonate.id]) {
                updatedChar.factions[entityToDonate.id] = { reputation: 0 };
            }
            updatedChar.factions[entityToDonate.id]!.reputation += Math.floor(donationAmount / 10);
            const newReputation = updatedChar.factions[entityToDonate.id]!.reputation;
            logMessage = `Герой пожертвовал ${donationAmount} золота фракции "${entityToDonate.name}", укрепляя свою репутацию. Текущая репутация: ${newReputation}.`;
        }
        
        updatedChar = addToActionHistory(updatedChar, 'social');
        return { character: updatedChar, logMessage: logMessage };
    }
};

const prayAction: Action = {
    name: "Помолиться",
    type: "social",
    getWeight: (char) => (char.divineFavor || 0) < 90 ? 30 : 0, // Pray if favor is not nearly full
    canPerform: (char, worldState) => worldState.isLocationSafe! && !char.effects.some(e => e.id.startsWith('grace_')),
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        updatedChar.divineFavor = Math.min(100, (updatedChar.divineFavor || 0) + 10);
        updatedChar = addToActionHistory(updatedChar, 'social');
        return { character: updatedChar, logMessage: "Герой возносит молитву своему богу-покровителю, чувствуя, как его связь с высшими силами крепнет." };
    }
};


const travelToCryptAction: Action = {
    name: "Отправиться к склепу",
    type: "quest",
    getWeight: () => 95, // Very high weight if available
    canPerform: (char, worldState) => worldState.hasKeyItem && char.location !== 'forgotten_crypt',
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const { locations } = gameData;
        const currentLocationName = locations.find(l => l.id === character.location)?.name || 'неизвестного места';
        const destination = locations.find(l => l.id === 'forgotten_crypt')!;

        updatedChar.status = 'busy';
        updatedChar.currentAction = { 
            type: 'travel', 
            name: `Путешествие в ${destination.name}`, 
            description: `Древний коготь зовет героя. Он отправляется к ${destination.name}.`, 
            startedAt: Date.now(), 
            duration: 3 * 60 * 1000, 
            destinationId: destination.id 
        };
        updatedChar.currentAction.originalDuration = updatedChar.currentAction.duration;
        return { character: updatedChar, logMessage: `Забыв о других делах, герой покинул ${currentLocationName} и держит путь к таинственному склепу.` };
    }
};

const startCryptExplorationAction: Action = {
    name: "Войти в склеп",
    type: "quest",
    getWeight: () => 100, // Highest weight action
    canPerform: (char, worldState) => 
        char.location === 'forgotten_crypt' && 
        worldState.hasKeyItem && 
        !char.activeCryptQuest &&
        !worldState.isBadlyInjured && // Don't enter if badly hurt
        worldState.hasHealingPotion, // Make sure to have at least one potion
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const claw = updatedChar.inventory.find(i => i.type === 'key_item')!;
        const firstStage = cryptStages[0];

        updatedChar.status = 'exploring';
        updatedChar.activeCryptQuest = {
            cryptId: 'forgotten_crypt',
            clawId: claw.id,
            stage: 0,
            stageName: firstStage.name,
            stageDescription: firstStage.description,
            startedAt: Date.now(),
            duration: firstStage.duration,
        };
        
        return { character: updatedChar, logMessage: `Герой вставляет ${claw.name} в замочную скважину. Массивные каменные двери со скрежетом отворяются, открывая путь во тьму.` };
    }
};

export const wanderAction: Action = {
    name: "Слоняться без дела",
    type: "misc",
    getWeight: () => 1, // Lowest possible weight, a true fallback
    canPerform: () => true,
    async perform(character, gameData) {
        // Increase thought chance to 30% to reduce dull loops
        if (Math.random() > 0.30) {
            return { character, logMessage: "" };
        }
        return { character, logMessage: getFallbackThought(character) };
    }
};


// --- REFLEX ACTIONS (Highest Priority) ---
// These are not chosen by weight, but are checked first.
interface ReflexAction extends Omit<Action, 'getWeight'> {
    isTriggered: (character: Character, worldState: WorldState, gameData: GameData) => boolean;
}

const usePotionReflex: ReflexAction = {
    name: "Использовать зелье здоровья",
    type: "misc",
    isTriggered: (char, worldState) => worldState.isBadlyInjured || worldState.hasPoisonDebuff,
    canPerform: (char, worldState) => (worldState.isInjured! || worldState.hasPoisonDebuff!) && worldState.hasHealingPotion!,
    async perform(character, gameData) {
        const updatedChar = structuredClone(character);
        const potion = updatedChar.inventory.find(i => i.type === 'potion' && i.effect?.type === 'heal' && i.effect.stat === 'health')!;
        
        const healthToRestore = potion.effect!.amount;
        updatedChar.stats.health.current = Math.min(updatedChar.stats.health.max, updatedChar.stats.health.current + healthToRestore);
        
        let logMessage = `Герой выпил ${potion.name} и восстановил ${healthToRestore} здоровья.`;
        
        // If poisoned, a health potion can also feel like an antidote
        if (character.effects.some(e => e.id === 'weak_poison')) {
            logMessage += ' Это должно помочь против яда.';
        }

        potion.quantity -= 1;
        if (potion.quantity <= 0) updatedChar.inventory = updatedChar.inventory.filter(i => i.id !== potion.id);
        
        return { character: updatedChar, logMessage };
    },
};

const useBuffPotionReflex: ReflexAction = {
    name: "Использовать зелье усиления",
    type: "misc",
    isTriggered: (char, worldState) => worldState.isInCombat && worldState.hasBuffPotion,
    canPerform: (char, worldState) => worldState.isInCombat && worldState.hasBuffPotion,
    async perform(character, gameData) {
        const updatedChar = structuredClone(character);
        const potion = updatedChar.inventory.find(i => i.type === 'potion' && i.effect?.type === 'buff' && i.effect.id != null)!;
        
        const newEffect: ActiveEffect = {
            id: potion.effect!.id!,
            name: potion.name,
            description: potion.effect!.description || "Герой чувствует прилив сил.",
            icon: potion.effect!.icon || 'Sparkles',
            type: 'buff',
            expiresAt: Date.now() + (potion.effect!.duration || 60000),
            value: potion.effect!.amount,
        };

        updatedChar.effects.push(newEffect);

        const logMessage = `Герой выпивает ${potion.name}, чувствуя, как его мускулы наливаются мощью!`;
        potion.quantity -= 1;
        if (potion.quantity <= 0) updatedChar.inventory = updatedChar.inventory.filter(i => i.id !== potion.id);

        return { character: updatedChar, logMessage };
    }
};


const fleeFromCombatReflex: ReflexAction = {
    name: "Сбежать из боя",
    type: "combat",
    isTriggered: (char, worldState) => worldState.isInCombat && worldState.isBadlyInjured,
    canPerform: (char, worldState) => worldState.isInCombat && worldState.isBadlyInjured && !char.combat!.fleeAttempted!,
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        updatedChar.combat!.fleeAttempted = true;
        const staminaCost = 15;
        let logMessage: string;
        if (updatedChar.stats.stamina.current < staminaCost) {
            logMessage = "Герой слишком измотан, чтобы бежать! Попытка провалилась.";
        } else {
            updatedChar.stats.stamina.current -= staminaCost;
            
            // Apply weather and time modifiers to flee chance
            const weatherEffect = getWeatherModifiers(updatedChar.weather);
            const timeOfDayEffect = getTimeOfDayModifiers(updatedChar.timeOfDay);
            const fleeModifier = weatherEffect.stealthModifier + timeOfDayEffect.fleeChanceModifier;
            
            let successChance = 0.5 + (updatedChar.stats.stamina.current / updatedChar.stats.stamina.max) * 0.25;
            successChance *= fleeModifier; // Apply weather/time modifier
            successChance = Math.min(0.95, Math.max(0.05, successChance)); // Clamp between 5% and 95%
            
            if (Math.random() < successChance) {
                updatedChar.status = 'idle';
                updatedChar.mood = Math.max(0, updatedChar.mood - 15);
                
                // Add a cooldown to prevent immediately re-taking a quest
                if (updatedChar.combat?.onWinQuestId) {
                    if (!updatedChar.actionCooldowns) updatedChar.actionCooldowns = {};
                    // 5 minute cooldown for taking quests
                    updatedChar.actionCooldowns['takeQuest'] = Date.now() + 5 * 60 * 1000; 
                    logMessage = `Понимая, что бой проигран, герой успешно скрывается. После такого он вряд ли скоро захочет снова браться за задания. Потрачено ${staminaCost} выносливости.`;
                } else {
                    logMessage = `Понимая, что бой проигран, герой тратит последние силы на рывок и успешно скрывается. Потрачено ${staminaCost} выносливости.`;
                }

                updatedChar.combat = null;

            } else {
                logMessage = `Попытка к бегству провалилась! Враг преградил путь, и, похоже, герою пустили стрелу в колено. Бой продолжается! Потрачено ${staminaCost} выносливости.`;
            }
        }
        return { character: updatedChar, logMessage };
    }
};

/**
 * Determines the character's build type based on their backstory.
 * @param backstory The character's backstory ID.
 * @returns 'warrior' or 'mage' build type.
 */
function getArchetype(backstory: string): 'warrior' | 'mage' {
    switch (backstory) {
        case 'scholar':
            return 'mage';
        case 'noble':
        case 'thief':
        case 'warrior':
        case 'shipwrecked':
        case 'left_for_dead':
        case 'companion':
        default:
            return 'warrior';
    }
}

const autoAssignPointsAction: Action = {
    name: "Распределить очки",
    type: "system",
    getWeight: (char) => (char.preferences?.autoAssignPoints && (char.points.attribute > 0 || char.points.skill > 0)) ? 100 : 0,
    canPerform: (char) => !!char.preferences?.autoAssignPoints && (char.points.attribute > 0 || char.points.skill > 0),
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        const logMessages: string[] = [];
        let pointsAssigned = false;

        const buildType = getArchetype(updatedChar.backstory);

        // Attribute point assignment
        if (updatedChar.points.attribute > 0) {
            let primaryAttr: keyof CharacterAttributes, secondaryAttr: keyof CharacterAttributes;
            let primaryLog: string, secondaryLog: string;

            if (buildType === 'mage') {
                primaryAttr = 'intelligence';
                secondaryAttr = 'endurance';
                primaryLog = "Герой вкладывает очко в Интеллект, оттачивая магические способности.";
                secondaryLog = "Герой вкладывает очко в Выносливость, укрепляя свое тело.";
            } else { // Warrior (default)
                primaryAttr = 'strength';
                secondaryAttr = 'endurance';
                primaryLog = "Герой вкладывает очко в Силу, чувствуя, как его удары становятся мощнее.";
                secondaryLog = "Герой вкладывает очко в Выносливость, чувствуя себя более стойким.";
            }
            
            if (updatedChar.attributes[primaryAttr] <= updatedChar.attributes[secondaryAttr]) {
                updatedChar.attributes[primaryAttr] += 1;
                logMessages.push(primaryLog);
            } else {
                updatedChar.attributes[secondaryAttr] += 1;
                logMessages.push(secondaryLog);
            }
            updatedChar.points.attribute -= 1;
            pointsAssigned = true;
        } 
        // Skill point assignment
        else if (updatedChar.points.skill > 0) {
            const skillChoices: { skill: keyof CharacterSkills, name: string }[] = buildType === 'mage'
                ? [
                    { skill: 'alchemy', name: 'искусстве алхимии' },
                    { skill: 'lightArmor', name: 'ношении легкой брони' },
                ]
                : [ // Warrior (default)
                    { skill: 'oneHanded', name: 'владении одноручным оружием' },
                    { skill: 'block', name: 'искусстве блока' },
                    { skill: 'heavyArmor', name: 'ношении тяжелой брони' },
                ];
            
            // Find the lowest skill among the chosen build's skills
            let lowestSkillChoice = skillChoices[0];
            let lowestValue = updatedChar.skills[lowestSkillChoice.skill];
            for (let i = 1; i < skillChoices.length; i++) {
                const choice = skillChoices[i];
                if (updatedChar.skills[choice.skill] < lowestValue) {
                    lowestValue = updatedChar.skills[choice.skill];
                    lowestSkillChoice = choice;
                }
            }
            updatedChar.skills[lowestSkillChoice.skill] += 1;
            
            logMessages.push(`Герой упражняется, оттачивая свое мастерство в ${lowestSkillChoice.name}.`);
            
            updatedChar.points.skill -= 1;
            pointsAssigned = true;
        }
        
        if (pointsAssigned) {
             // Recalculate max stats
            updatedChar.stats.health.max = 80 + updatedChar.attributes.endurance * 10;
            updatedChar.stats.magicka.max = 80 + updatedChar.attributes.intelligence * 10;
            updatedChar.stats.stamina.max = 80 + (updatedChar.attributes.strength + updatedChar.attributes.endurance) * 5;
            
            // Check for new perks
            const currentPerks = updatedChar.unlockedPerks || [];
            const newlyUnlockedPerks = allPerks.filter(perk =>
                !currentPerks.includes(perk.id) &&
                updatedChar.skills[perk.skill] >= perk.requiredSkillLevel
            ).map(p => p.id);

            if (newlyUnlockedPerks.length > 0) {
                if (!updatedChar.unlockedPerks) {
                    updatedChar.unlockedPerks = [];
                }
                const newPerkNames = allPerks
                    .filter(p => newlyUnlockedPerks.includes(p.id))
                    .map(p => p.name)
                    .join(', ');
                    
                updatedChar.unlockedPerks.push(...newlyUnlockedPerks);
                logMessages.push(`Герой открыл новые перки: ${newPerkNames}!`);
            }
        }

        return { character: updatedChar, logMessage: logMessages };
    },
};

// --- COMBAT ACTIONS ---

const fightEnemyAction: Action = {
    name: "Сражаться",
    type: "combat",
    getWeight: () => 100, // Only action available in combat
    canPerform: (char, worldState) => worldState.isInCombat,
    async perform(character, gameData) {
        const logMessages: string[] = [];
        const updatedChar = await performCombatRound(character, gameData, logMessages);
        return { character: updatedChar, logMessage: logMessages };
    }
};

// --- DEAD (SOVNGARDE) ACTIONS ---

const takeSovngardeQuestAction: Action = {
    name: "Взять задание в Совнгарде",
    type: "quest",
    getWeight: () => 80,
    canPerform: (char) => !char.currentAction && !char.activeSovngardeQuest,
    async perform(character, gameData) {
        const updatedChar = structuredClone(character);
        const quest = gameData.sovngardeQuests[Math.floor(Math.random() * gameData.sovngardeQuests.length)];
        updatedChar.activeSovngardeQuest = { questId: quest.id, startedAt: Date.now() };
        updatedChar.currentAction = {
            type: 'sovngarde_quest', name: `В Совнгарде: ${quest.title}`, description: quest.description,
            startedAt: Date.now(), duration: quest.duration, sovngardeQuestId: quest.id,
        };
        return { character: updatedChar, logMessage: `В Совнгарде герой решил взяться за дело: "${quest.title}".` };
    }
};

const wanderSovngardeAction: Action = {
    name: "Размышлять в Совнгарде",
    type: "misc",
    getWeight: () => 20,
    canPerform: (char) => !char.currentAction,
    async perform(character, gameData) {
        // Only produce a thought 25% of the time this action is chosen to avoid spam.
        if (Math.random() > 0.25) {
            return { character, logMessage: "" };
        }
        return { character, logMessage: sovngardeThoughts[Math.floor(Math.random() * sovngardeThoughts.length)] };
    }
};

// --- EXPLORING ACTIONS ---

const processCryptStageAction: Action = {
    name: "Продолжить исследование склепа",
    type: "quest",
    getWeight: () => 100, // Only action available when exploring
    canPerform: (char) => char.status === 'exploring',
    async perform(character, gameData) {
        let updatedChar: Character = structuredClone(character) as Character;
        const activeQuest = updatedChar.activeCryptQuest!;
        const now = Date.now();
        
        const currentStageDef = cryptStages[activeQuest.stage];

        // If the current stage is a completed combat stage, move on immediately.
        if (currentStageDef.isCombatStage) {
             // This stage is done by virtue of winning the combat.
        }
        // Check if the current timed stage is completed
        else if (now < activeQuest.startedAt + activeQuest.duration) {
            // Stage not yet complete, do nothing.
            return { character, logMessage: "" };
        }
        
        let logMessage = `Этап "${activeQuest.stageName}" завершен. `;
        const nextStageIndex = activeQuest.stage + 1;

        if (nextStageIndex < cryptStages.length) {
            const nextStage = cryptStages[nextStageIndex];
            
            // Check for combat stage
            if (nextStage.isCombatStage && nextStage.enemyId) {
                const baseEnemy = gameData.enemies.find(e => e.id === nextStage.enemyId)!;
                const levelMultiplier = 1 + (updatedChar.level - 1) * 0.15;
                const enemy = { 
                    name: baseEnemy.name, 
                    health: { current: Math.floor(baseEnemy.health * levelMultiplier), max: Math.floor(baseEnemy.health * levelMultiplier) }, 
                    damage: Math.floor(baseEnemy.damage * levelMultiplier), 
                    xp: Math.floor(baseEnemy.xp * levelMultiplier), 
                    armor: baseEnemy.armor || (10 + (baseEnemy.level || 1)),
                    appliesEffect: baseEnemy.appliesEffect || null 
                };

                // Analytics Tracking for encounter
                if (!updatedChar.analytics.encounteredEnemies.includes(baseEnemy.id)) {
                    updatedChar.analytics.encounteredEnemies.push(baseEnemy.id);
                }
                
                updatedChar.status = 'in-combat';
                updatedChar.combat = { enemyId: baseEnemy.id, enemy, fleeAttempted: false };
                // We keep activeCryptQuest to know to resume exploration after combat.
                logMessage += `Впереди опасность! ${nextStage.description}`;
                return { character: updatedChar, logMessage };
            }

            updatedChar.activeCryptQuest = {
                ...activeQuest,
                stage: nextStageIndex,
                stageName: nextStage.name,
                stageDescription: nextStage.description,
                startedAt: now,
                duration: nextStage.duration,
            };
            logMessage += `Герой приступает к следующему этапу: "${nextStage.name}".`;
        } else {
            // Crypt exploration finished
            const claw = updatedChar.inventory.find(i => i.id === activeQuest.clawId)!;
            claw.quantity -= 1;
            if (claw.quantity <= 0) {
                updatedChar.inventory = updatedChar.inventory.filter(i => i.id !== claw.id);
            }

            const rewardGold = 1000;
            const rewardXp = 500;
            const goldItem = updatedChar.inventory.find(i => i.id === 'gold')!;
            goldItem.quantity += rewardGold;
            updatedChar.xp.current += rewardXp;
            updatedChar.mood = Math.min(100, updatedChar.mood + 30);
            
            logMessage += `Герой успешно исследовал склеп! Древний коготь рассыпался в пыль. Получено ${rewardGold} золота и ${rewardXp} опыта.`;
            
            // Guaranteed 1 rare item
            const rareItems = gameData.items.filter(i => i.rarity === 'rare' && (i.type === 'weapon' || i.type === 'armor'));
            if (rareItems.length > 0) {
                const chosenItem = rareItems[Math.floor(Math.random() * rareItems.length)];
                const { updatedCharacter: charWithItem, logMessage: itemLog } = addItemToInventory(updatedChar, chosenItem, 1);
                updatedChar = charWithItem;
                logMessage += ` В главной сокровищнице он находит ценный предмет: ${chosenItem.name}!`;
            }
            
            // 50% chance for an uncommon item
            if (Math.random() < 0.5) {
                const uncommonItems = gameData.items.filter(i => i.rarity === 'uncommon');
                if (uncommonItems.length > 0) {
                    const chosenItem = uncommonItems[Math.floor(Math.random() * uncommonItems.length)];
                    const { updatedCharacter: charWithItem, logMessage: itemLog } = addItemToInventory(updatedChar, chosenItem, 1);
                    updatedChar = charWithItem;
                    logMessage += ` Также ему попадается ${chosenItem.name}.`;
                }
            }

            updatedChar.status = 'idle';
            updatedChar.activeCryptQuest = null;
        }

        return { character: updatedChar, logMessage };
    }
};

// Lightweight ExploreDungeon action for bleak_falls_barrow (Windy Peak)
const exploreDungeonAction: Action = {
    name: 'Исследовать подземелье',
    type: 'explore',
    getWeight: (char, world, gameData) => {
        if (char.location !== 'bleak_falls_barrow') return 0;
        // Prefer exploring if idle and not recently performed
        return priorityToWeight(Priority.MEDIUM);
    },
    canPerform: (char) => char.status === 'idle' && char.location === 'bleak_falls_barrow',
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        // Small random outcomes: loot, trap, nothing
        const roll = Math.random();
        const logs: string[] = [];
        if (roll < 0.55) {
            // Loot small gold or misc
            const goldGain = 10 + Math.floor(Math.random() * 21); // 10-30
            const goldItem = updatedChar.inventory.find(i => i.id === 'gold');
            if (goldItem) goldItem.quantity += goldGain; else updatedChar.inventory.push({ id: 'gold', name: 'Золото', weight: 0, type: 'gold', quantity: goldGain } as any);
            logs.push(`В темных нишах герой находит ${goldGain} золота.`);
        } else if (roll < 0.75) {
            // Trap
            const dmg = 5 + Math.floor(Math.random() * 11); // 5-15
            updatedChar.stats.health.current = Math.max(0, updatedChar.stats.health.current - dmg);
            logs.push(`Ловушка! Копья выскакивают из стены, нанося ${dmg} урона.`);
        } else if (roll < 0.9) {
            // Minor item (common misc)
            const misc = gameData.items.find(i => i.type === 'misc' && i.rarity === 'common');
            if (misc) {
                const existing = updatedChar.inventory.find(i => i.id === misc.id);
                if (existing) existing.quantity += 1; else updatedChar.inventory.push({ ...misc, quantity: 1 } as any);
                logs.push(`Среди праха герой находит: ${misc.name}.`);
            } else {
                logs.push('Нашел кое-что… но ничего ценного.');
            }
        } else {
            // Rare discovery → chronicle
            logs.push('Герой находит древнюю надпись: «Кто с песней пришёл — с песней уйдёт».');
            // Chronicle effect will be emitted by outer engine if needed, keep log only here
        }
        return { character: updatedChar, logMessage: logs.join(' ') };
    }
};

// Register explore action

// ==================================
// NPC Social Actions
// ==================================

const interactWithNPCAction: Action = {
    name: "Пообщаться с NPC",
    type: "social",
    getWeight: (char) => {
        // Boost on fresh arrival before completing a local activity
        const now = Date.now();
        const arrivalTime = char.lastLocationArrival || 0;
        const timeSinceArrival = now - arrivalTime;
        const fiveMinutes = 5 * 60 * 1000;
        if (timeSinceArrival < fiveMinutes && !char.hasCompletedLocationActivity) {
            return priorityToWeight(Priority.HIGH);
        }
        return priorityToWeight(Priority.MEDIUM);
    },
    canPerform: (char, worldState, gameData) => {
        if (!worldState.isLocationSafe) return false;
        
        // Check if NPCs are available at current time
        const timeOfDayEffect = getTimeOfDayModifiers(char.timeOfDay);
        if (!timeOfDayEffect.npcAvailability) return false;
        
        // Check if there are NPCs at current location
        const locationNPCs = gameData.npcs.filter(
            npc => npc.location === char.location || npc.location === 'on_road'
        );
        return locationNPCs.length > 0;
    },
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        
        // Get NPCs at location
        const locationNPCs = gameData.npcs.filter(
            npc => npc.location === updatedChar.location || npc.location === 'on_road'
        );
        
        if (locationNPCs.length === 0) {
            return { character, logMessage: "Нет NPC для общения." };
        }
        
        // Pick random NPC
        const npc = locationNPCs[Math.floor(Math.random() * locationNPCs.length)];
        
        // Call server action (Character.id is the userId)
        const result = await interactWithNPC(updatedChar.id, npc.id);
        
        if (result.success) {
            // Refetch character from DB to get updated relationships
            const refreshedChar = await getCharacterById(updatedChar.id);
            if (!refreshedChar) {
                return { character, logMessage: "Ошибка: персонаж не найден после общения." };
            }
            
            updatedChar = addToActionHistory(refreshedChar as Character, 'social');
            // Mark location activity as completed for strict sequencing
            updatedChar.hasCompletedLocationActivity = true;
            
            return { 
                character: updatedChar, 
                logMessage: `${result.message} (отношения +${result.relationshipChange})` 
            };
        }
        
        return { character, logMessage: "Не удалось пообщаться с NPC." };
    }
};

const tradeWithNPCAction: Action = {
    name: "Торговать с торговцем",
    type: "social",
    getWeight: (char, worldState) => {
        if (!worldState.isLocationSafe) return 0;
        
        // Boost trading on fresh arrival before completing a local activity
        const now = Date.now();
        const arrivalTime = char.lastLocationArrival || 0;
        const timeSinceArrival = now - arrivalTime;
        const fiveMinutes = 5 * 60 * 1000;
        if (timeSinceArrival < fiveMinutes && !char.hasCompletedLocationActivity) {
            return priorityToWeight(Priority.HIGH);
        }

        // High priority after completing location activity as follow-up
        if (char.hasCompletedLocationActivity) {
            return priorityToWeight(Priority.HIGH);
        }
        
        // Check if we need healing potions
        const potions = char.inventory.filter(i => i.type === 'potion');
        const hasLowPotions = potions.reduce((sum, p) => sum + p.quantity, 0) < 3;
        
        // Check if we have gold
        const gold = char.inventory.find(i => i.id === 'gold');
        const hasGold = gold && gold.quantity > 50;
        
        if (hasLowPotions && hasGold) {
            return priorityToWeight(Priority.HIGH);
        }
        
        return priorityToWeight(Priority.LOW);
    },
    canPerform: (char, worldState, gameData) => {
        if (!worldState.isLocationSafe) return false;
        
        // Check if NPCs are available at current time
        const timeOfDayEffect = getTimeOfDayModifiers(char.timeOfDay);
        if (!timeOfDayEffect.npcAvailability) return false;
        
        // Check if there are merchant NPCs at current location
        const merchantNPCs = gameData.npcs.filter(
            npc => (npc.location === char.location || npc.location === 'on_road') && 
                   npc.inventory && npc.inventory.length > 0
        );
        
        const gold = char.inventory.find(i => i.id === 'gold');
        return merchantNPCs.length > 0 && !!gold && gold.quantity > 10;
    },
    async perform(character, gameData) {
        let updatedChar = structuredClone(character);
        
        // Get merchant NPCs at location
        const merchantNPCs = gameData.npcs.filter(
            npc => (npc.location === updatedChar.location || npc.location === 'on_road') && 
                   npc.inventory && npc.inventory.length > 0
        );
        
        if (merchantNPCs.length === 0) {
            return { character, logMessage: "Нет торговцев поблизости." };
        }
        
        // Pick random merchant
        const merchant = merchantNPCs[Math.floor(Math.random() * merchantNPCs.length)];
        
        // Decide what to buy - prefer potions if low
        const potions = updatedChar.inventory.filter(i => i.type === 'potion');
        const hasLowPotions = potions.reduce((sum, p) => sum + p.quantity, 0) < 3;
        
        let itemToBuy = null;
        if (hasLowPotions) {
            // Try to buy a potion
            itemToBuy = merchant.inventory!.find(i => {
                const fullItem = gameData.items.find(item => item.id === i.itemId);
                return fullItem?.type === 'potion';
            });
        }
        
        // If no potion found or not needed, buy random item
        if (!itemToBuy && merchant.inventory!.length > 0) {
            itemToBuy = merchant.inventory![Math.floor(Math.random() * merchant.inventory!.length)];
        }
        
        if (!itemToBuy) {
            return { character, logMessage: "У торговца нет нужных предметов." };
        }
        
        // Call server action to buy (Character.id is the userId)
        const result = await tradeWithNPC(updatedChar.id, merchant.id, 'buy', itemToBuy.itemId, 1);
        
        if (result.success) {
            // Refetch character from DB to get updated inventory
            const refreshedChar = await getCharacterById(updatedChar.id);
            if (!refreshedChar) {
                return { character, logMessage: "Ошибка: персонаж не найден после торговли." };
            }
            
            updatedChar = addToActionHistory(refreshedChar as Character, 'social');
            
            const itemName = gameData.items.find(i => i.id === itemToBuy.itemId)?.name || 'предмет';
            return { 
                character: updatedChar, 
                logMessage: `Герой купил ${itemName} у ${merchant.name}. ${result.message}` 
            };
        }
        
        return { character, logMessage: `Не удалось купить предмет: ${result.error}` };
    }
};

// ==================================
// AI Brain Logic
// ==================================

const reflexActions: ReflexAction[] = [fleeFromCombatReflex, useBuffPotionReflex, usePotionReflex];
export const idleActions: Action[] = [
    makeCampAction,
    autoAssignPointsAction,
    startCryptExplorationAction,
    travelToCryptAction,
    equipBestGearAction,
    takeQuestAction,
    exploreCityAction,
    findEnemyAction,
    travelAction,
    restAtTavernAction,
    sleepAtTavernAction,
    sellJunkAction,
    eatFoodAction,
    stealAction,
    learnSpellAction,
    readLearningBookAction,
    donateToFactionAction,
    prayAction,
    wanderAction,
    interactWithNPCAction,
    tradeWithNPCAction
];
export const combatActions: Action[] = [fightEnemyAction];
export const deadActions: Action[] = [takeSovngardeQuestAction, wanderSovngardeAction];
export const exploringActions: Action[] = [processCryptStageAction, exploreDungeonAction];


/**
 * The main AI decision-making function. This is now an internal helper.
 * @param character The current character state.
 * @param gameData All static game data.
 * @returns The action the character should perform.
 */
async function determineNextAction(character: Character, gameData: GameData): Promise<Action> {
    
    // 1. Handle actions that are not driven by choice (e.g. current busy action)
    if (character.status !== 'idle' && character.status !== 'in-combat' && character.status !== 'dead' && character.status !== 'exploring') {
        // Character is sleeping or busy with a timed action
        return { name: "Busy", type: 'misc', getWeight: () => 0, canPerform: () => false, perform: async () => ({character, logMessage: ""}) };
    }


    // 2. Build the current world state for decision making
    const currentLocation = gameData.locations.find(l => l.id === character.location);
    const now = Date.now();
    const lastCityExploration = character.actionCooldowns?.['exploreCity'] || 0;
    const inventoryCapacity = 150 + (character.attributes.strength * 5);
    const inventoryWeight = character.inventory.reduce((acc, item) => acc + (item.weight * item.quantity), 0);

    // Get weather and time modifiers
    const weatherEffect = getWeatherModifiers(character.weather);
    const timeOfDayEffect = getTimeOfDayModifiers(character.timeOfDay);
    const isNightTime = character.timeOfDay === 'night';

    const diseaseFlags = (() => {
        const hasVampirism = character.effects.some(e => e.id === 'disease_vampirism');
        const hasLycanthropy = character.effects.some(e => e.id === 'disease_lycanthropy');
        const disease = character.effects.find(e => e.id === 'disease_vampirism' || e.id === 'disease_lycanthropy');
        const isHungry = !!(disease && (disease.data?.hungerLevel || 0) >= 2);
        return { hasVampirism, hasLycanthropy, isHungry };
    })();
    const worldState: WorldState = {
        isIdle: character.status === 'idle',
        isInCombat: character.status === 'in-combat',
        isDead: character.status === 'dead',
        isLocationSafe: currentLocation?.isSafe || false,
        isTired: (character.stats.fatigue.current / character.stats.fatigue.max) > 0.5,
        canTakeQuest: gameData.quests.some(q => {
            if (q.location !== character.location || q.status !== 'available' || q.requiredLevel > character.level || (character.completedQuests||[]).includes(q.id)) {
                return false;
            }
            if (q.requiredFaction) {
                const currentRep = character.factions[q.requiredFaction.id]?.reputation || 0;
                return currentRep >= q.requiredFaction.reputation;
            }
            return true;
        }),
        isInjured: character.stats.health.current < character.stats.health.max,
        isBadlyInjured: character.stats.health.current < character.stats.health.max * 0.3,
        hasEnoughGoldForRest: (character.inventory.find(i => i.id === 'gold')?.quantity || 0) >= 10,
        hasEnoughGoldForSleep: (character.inventory.find(i => i.id === 'gold')?.quantity || 0) >= 250,
        hasEnoughGoldForDonation: (character.inventory.find(i => i.id === 'gold')?.quantity || 0) >= 100,
        hasHealingPotion: character.inventory.some(i => i.type === 'potion' && i.effect?.type === 'heal' && i.effect.stat === 'health'),
        hasUnreadTome: character.inventory.some(
            i => i.type === 'spell_tome' && i.spellId != null && !(character.knownSpells || []).includes(i.spellId)
        ),
        hasUnreadLearningBook: character.inventory.some(i => i.type === 'learning_book'),
        hasKeyItem: character.inventory.some(i => i.type === 'key_item'),
        isWellRested: character.effects.some(e => e.id === 'well_rested'),
        canExploreCity: now > (lastCityExploration + 20 * 60 * 1000), // 20 min cooldown
        isOverencumbered: inventoryWeight > inventoryCapacity,
        hasPoisonDebuff: character.effects.some(e => e.id === 'weak_poison'),
        hasBuffPotion: character.inventory.some(i => i.type === 'potion' && i.effect?.type === 'buff' && i.effect.id != null && !character.effects.some(e => e.id === i.effect!.id)),
        hasVampirism: diseaseFlags.hasVampirism,
        hasLycanthropy: diseaseFlags.hasLycanthropy,
        isHungry: diseaseFlags.isHungry,
        // Time and weather state
        timeOfDay: character.timeOfDay,
        isNightTime,
        weatherModifier: weatherEffect.attackModifier,
        weatherEffect,
        timeOfDayEffect,
    };

    // 3. Check for high-priority reflex actions first
    for (const reflex of reflexActions) {
        if (reflex.isTriggered(character, worldState, gameData) && reflex.canPerform(character, worldState, gameData)) {
            return reflex;
        }
    }

    // 3b. Behavior Tree arbitration (guarded by flag)
    if (AI_BT_ENABLED) {
        // Compose subsets using existing action definitions
        const toAL = (a: Action): ActionLike => a as unknown as ActionLike;
        const arrival: ActionLike[] = [takeQuestAction, restAtTavernAction, tradeWithNPCAction, interactWithNPCAction].map(toAL);
        const night: ActionLike[] = [takeQuestAction, restAtTavernAction, travelAction].map(toAL);
        const idle: ActionLike[] = idleActions.map(toAL);
        const combat: ActionLike[] = combatActions.map(toAL);
        const dead: ActionLike[] = deadActions.map(toAL);
        const settings = await getBtSettings();
        const tree = buildBehaviorTree({
            combatActions: combat,
            deadActions: dead,
            arrivalActions: arrival,
            nightActions: night,
            idleActions: idle,
            travelAction: toAL(travelAction),
            arrivalWindowMs: settings.arrivalWindowMs,
            stallWindowMs: settings.stallWindowMs,
        });
        const bb = { character, worldState, gameData, trace: [] as string[] };
        const picked = await tree.evaluate(bb);
        try { (globalThis as any).__bt_last_trace__ = bb.trace; } catch {}
        if (picked) return picked as unknown as Action;
    }

    // 4. Determine the correct set of actions based on character status
    let actionSet: Action[];
    switch(character.status) {
        case 'in-combat':
            actionSet = combatActions;
            break;
        case 'dead':
            actionSet = deadActions;
            break;
        case 'exploring':
            actionSet = exploringActions;
            break;
        case 'idle':
        default:
            actionSet = idleActions;
            break;
    }

    // 5. Filter for actions that can be performed (exclude fallback wander from primary selection)
    let possibleActions = actionSet
        .filter(action => action.canPerform(character, worldState, gameData))
        .filter(action => action.name !== wanderAction.name);

    if (possibleActions.length === 0) {
        return wanderAction;
    }

    // 5a. Anti-stall shortcut: if we cannot take quests here and NPCs are unavailable now,
    // and travel is possible, force travel to avoid city idle loops
    if (!worldState.canTakeQuest && !worldState.timeOfDayEffect.npcAvailability) {
        const travel = possibleActions.find(a => a.name === 'Путешествовать');
        if (travel) return travel;
    }
    // 5b. If location has no available quests for >2 minutes after arrival, prefer travel
    try {
        const nowTs = Date.now();
        const arrival = character.lastLocationArrival || 0;
        if (!worldState.canTakeQuest && (nowTs - arrival) > 2 * 60 * 1000) {
            const travel = possibleActions.find(a => a.name === 'Путешествовать');
            if (travel) return travel;
        }
    } catch {}
    
    // 6. Handle Divine Suggestion (override)
    if (character.divineSuggestion) {
        const suggestedAction = possibleActions.find(a => a.name === character.divineSuggestion);
        if (suggestedAction) {
            return suggestedAction;
        }
    }

    // 7. Selection
    if (USE_CONFIG_PRIORITY) {
        // Build lightweight catalog entries to score
        const entries = possibleActions.map((a, idx) => ({
            id: `${a.type}:${a.name}`,
            category: a.type as any,
            action: a as any,
        }));
        const scored = await computeActionScores({ character, actions: entries, profileCode: 'warrior', world: worldState });
        // record trace for diagnostics UI
        try {
            recordDecisionTrace(character.id, scored.map(s => ({
                actionId: s.actionId,
                name: s.name,
                base: s.breakdown.base,
                ruleBoost: s.breakdown.ruleBoost,
                profile: s.breakdown.profile,
                fatigue: s.breakdown.fatigue,
                modifiers: s.breakdown.modifiers,
                total: s.breakdown.total,
            })));
        } catch {}
        const top = scored[0];
        const selected = possibleActions.find(a => `${a.type}:${a.name}` === top?.actionId) || possibleActions[0];
        return selected ?? wanderAction;
    }
    // Fallback: Simplified policy selection (Godville-like)
    const choice = selectActionSimple(possibleActions, { character, gameData });
    return choice ?? wanderAction;
}

// Diagnostics helpers (pure, no side-effects)
// diagnostics moved to src/ai/diagnostics.ts

/**
 * Processes a single "turn" for the character AI.
 * It determines the character's next action, performs it, and returns the updated state.
 * This is a single entry point for the client to call.
 * @param character The current character state.
 * @param gameData All static game data.
 * @returns The updated character and any log messages, or null if no action was taken.
 */
export async function processCharacterTurn(
    character: Character, 
    gameData: GameData
): Promise<{ character: Character; logMessage: string | string[] } | null> {
    
    const nextAction = await determineNextAction(character, gameData);

    // If the character is busy or the action is a no-op, we don't perform it.
    if (nextAction.name === "Busy") {
        return null;
    }
    
    // Perform the action and get the results.
    const result = await nextAction.perform(character, gameData);
    
    let finalChar = result.character;
    // Clear divine suggestion after it has been performed
    if (finalChar.divineSuggestion && finalChar.divineSuggestion === nextAction.name) {
        finalChar = structuredClone(finalChar);
        finalChar.divineSuggestion = null;
        finalChar.divineDestinationId = null;
    }

    // Add action to history for fatigue system (circular buffer) and persist fatigue
    if (!finalChar.actionHistory) {
        finalChar.actionHistory = [];
    }
    const now = Date.now();
    finalChar.actionHistory.push({ type: nextAction.type, timestamp: now });
    // Keep only last 40 actions (circular buffer)
    if (finalChar.actionHistory.length > 40) {
        finalChar.actionHistory = finalChar.actionHistory.slice(-40);
    }
    // Persist fatigue counter for repetition dampening
    try {
        const key = `${nextAction.type}:${nextAction.name}`;
        await updateOnAction(finalChar.id, key);
        await recordAttempt(finalChar.id, key);
    } catch {}

    // Outcome-based learning can be recorded on action completion sites (quest/combat)


    return { ...result, character: finalChar };
}

// Reflex: use legendary cure potion when diseased
const useLegendaryCureReflex: ReflexAction = {
    name: "Использовать легендарное зелье исцеления",
    type: "misc",
    isTriggered: (char) => char.effects.some(e => e.id === 'disease_vampirism' || e.id === 'disease_lycanthropy') && char.inventory.some(i => i.id === 'potion_cure_legendary' && i.quantity > 0),
    canPerform: (char) => true,
    async perform(character) {
        const updatedChar = structuredClone(character);
        const pot = updatedChar.inventory.find(i => i.id === 'potion_cure_legendary');
        if (pot) {
            pot.quantity -= 1;
            if (pot.quantity <= 0) updatedChar.inventory = updatedChar.inventory.filter(i => i.id !== pot.id);
        }
        updatedChar.effects = updatedChar.effects.filter(e => e.id !== 'disease_vampirism' && e.id !== 'disease_lycanthropy');
        return { character: updatedChar, logMessage: 'Герой выпивает легендарное зелье. Проклятие снято.' };
    }
};

// Register reflex after declaration to avoid TDZ
// Ensures the array is updated only once
if (!reflexActions.includes(useLegendaryCureReflex)) {
    reflexActions.splice(1, 0, useLegendaryCureReflex);
}

// Action: start disease cure quest
const startCureDiseaseAction: Action = {
    name: "Начать лечение болезни",
    type: "quest",
    getWeight: (char, worldState) => (worldState.hasVampirism || worldState.hasLycanthropy) ? priorityToWeight(worldState.isHungry ? Priority.HIGH : Priority.MEDIUM) : priorityToWeight(Priority.DISABLED),
    canPerform: (char, worldState) => Boolean(worldState.isIdle && (worldState.hasVampirism || worldState.hasLycanthropy) && !char.currentAction),
    async perform(character) {
        const updatedChar = structuredClone(character);
        updatedChar.status = 'busy';
        updatedChar.currentAction = { type: 'quest', name: 'Лечение болезни', description: 'Поиск исцеления от проклятия.', startedAt: Date.now(), duration: 45 * 60 * 1000 };
        return { character: updatedChar, logMessage: 'Герой отправляется искать исцеление от своей болезни.' };
    }
};

// Action: hunt for blood (vampire) at night
const huntForBloodAction: Action = {
    name: "Охота за кровью",
    type: "quest",
    getWeight: (char, worldState) => (worldState.hasVampirism && worldState.isNightTime && worldState.isHungry) ? priorityToWeight(Priority.HIGH) : priorityToWeight(Priority.DISABLED),
    canPerform: (char, worldState) => Boolean(worldState.isIdle && worldState.hasVampirism && worldState.isNightTime && !char.currentAction),
    async perform(character) {
        const updatedChar = structuredClone(character);
        updatedChar.status = 'busy';
        updatedChar.currentAction = { type: 'quest', name: 'Охота за кровью', description: 'Тихий поиск добычи в ночи.', startedAt: Date.now(), duration: 10 * 60 * 1000 };
        return { character: updatedChar, logMessage: 'Жажда крови зовёт — герой выходит на охоту.' };
    }
};

// Action: hunt as beast (werewolf) at night
const huntAsBeastAction: Action = {
    name: "Охота на зверя",
    type: "quest",
    getWeight: (char, worldState) => (worldState.hasLycanthropy && worldState.isNightTime && worldState.isHungry) ? priorityToWeight(Priority.HIGH) : priorityToWeight(Priority.DISABLED),
    canPerform: (char, worldState) => Boolean(worldState.isIdle && worldState.hasLycanthropy && worldState.isNightTime && !char.currentAction),
    async perform(character) {
        const updatedChar = structuredClone(character);
        updatedChar.status = 'busy';
        updatedChar.currentAction = { type: 'quest', name: 'Охота на зверя', description: 'Поддаться звериным инстинктам и насытиться.', startedAt: Date.now(), duration: 10 * 60 * 1000 };
        return { character: updatedChar, logMessage: 'Волчий голод ведёт героя в темноту.' };
    }
};

// Register disease-related actions after their declarations to avoid TDZ
if (!idleActions.includes(startCureDiseaseAction)) {
    idleActions.splice(5, 0, startCureDiseaseAction);
}
if (!idleActions.includes(huntForBloodAction)) {
    idleActions.splice(6, 0, huntForBloodAction);
}
if (!idleActions.includes(huntAsBeastAction)) {
    idleActions.splice(7, 0, huntAsBeastAction);
}

    