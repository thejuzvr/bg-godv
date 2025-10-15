import type { Character, WorldState, Weather, WeatherEffect, TimeOfDay, TimeOfDayEffect } from '@/types/character';
import type { GameData } from '@/services/gameDataService';
import type { Action } from './brain';
import { idleActions, combatActions, deadActions, exploringActions } from './brain';

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
        case 'Rain':
            return {
                attackModifier: -1,
                stealthModifier: 1,
                findChanceModifier: 0.9,
                fatigueModifier: 0.95,
                moodModifier: -1,
                regenModifier: { health: 0.95, magicka: 1.05, stamina: 0.95, fatigue: 1.05 }
            };
        case 'Snow':
            return {
                attackModifier: -1,
                stealthModifier: -1,
                findChanceModifier: 0.85,
                fatigueModifier: 0.9,
                moodModifier: -2,
                regenModifier: { health: 0.95, magicka: 1.0, stamina: 0.9, fatigue: 1.0 }
            };
        case 'Storm':
            return {
                attackModifier: -2,
                stealthModifier: -2,
                findChanceModifier: 0.8,
                fatigueModifier: 0.85,
                moodModifier: -3,
                regenModifier: { health: 0.9, magicka: 1.1, stamina: 0.85, fatigue: 1.05 }
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
        case 'day':
            return { attackModifier: 0, stealthModifier: -1, findChanceModifier: 1.1, regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0 } };
        case 'night':
            return { attackModifier: 0, stealthModifier: 1, findChanceModifier: 0.95, regenModifier: { health: 1.0, magicka: 1.05, stamina: 0.95 } };
        default:
            return { attackModifier: 0, stealthModifier: 0, findChanceModifier: 1.0, regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0 } };
    }
}

export function buildWorldState(character: Character, gameData: GameData): WorldState {
    const currentLocation = gameData.locations.find(l => l.id === character.location);
    const now = Date.now();
    const lastCityExploration = character.actionCooldowns?.['exploreCity'] || 0;
    const inventoryCapacity = 150 + (character.attributes.strength * 5);
    const inventoryWeight = character.inventory.reduce((acc, item) => acc + (item.weight * item.quantity), 0);

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
        canExploreCity: now > (lastCityExploration + 20 * 60 * 1000),
        isOverencumbered: inventoryWeight > inventoryCapacity,
        hasPoisonDebuff: character.effects.some(e => e.id === 'weak_poison'),
        hasBuffPotion: character.inventory.some(i => i.type === 'potion' && i.effect?.type === 'buff' && i.effect.id != null && !character.effects.some(e => e.id === i.effect!.id)),
        hasVampirism: diseaseFlags.hasVampirism,
        hasLycanthropy: diseaseFlags.hasLycanthropy,
        isHungry: diseaseFlags.isHungry,
        timeOfDay: character.timeOfDay,
        isNightTime,
        weatherModifier: weatherEffect.attackModifier,
        weatherEffect,
        timeOfDayEffect,
    };
    return worldState;
}

export function listPossibleActions(character: Character, gameData: GameData): Action[] {
    const worldState = buildWorldState(character, gameData);
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
    return actionSet.filter(action => action.canPerform(character, worldState, gameData));
}


