
'use server';

import type { Character, ActiveEffect, Weather, Season } from "@/types/character";
import type { GameData } from "@/services/gameDataService";
import { processCharacterTurn } from '@/ai/brain';
import { addChronicleEntry } from "@/services/chronicleService";
import { allDivinities } from "@/data/divinities";
import { getFallbackThought } from "@/data/thoughts";


/**
 * @fileoverview This file contains the core, stateful game engine logic.
 * It's designed to be server-safe and can be run in any environment (client or server).
 */

// ==================================
// Helper Functions for the Game Loop
// ==================================

/**
 * A utility function to add an item to the character's inventory, handling stacking.
 */
function addItemToInventory(character: Character, itemToAdd: Omit<Character['inventory'][0], 'quantity'>, quantity: number): { updatedCharacter: Character; logMessage: string } {
    let updatedChar = structuredClone(character);
    
    // Apply Zenithar's grace
    if (itemToAdd.id === 'gold' && character.effects.some(e => e.id === 'grace_zenithar')) {
        quantity = Math.floor(quantity * 1.20);
    }
    
    let itemLog = `Получен предмет: ${itemToAdd.name}${quantity > 1 ? ` (x${quantity})` : ''}.`;
    
    const existingItem = updatedChar.inventory.find(i => i.id === itemToAdd.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        updatedChar.inventory.push({ ...itemToAdd, quantity });
    }
    
    return { updatedCharacter: updatedChar, logMessage: itemLog };
}


/**
 * Processes the character's respawn if they are dead and the timer has expired.
 */
function processRespawn(character: Character): {char: Character, log: string | null} {
    if (character.status === 'dead' && character.respawnAt && Date.now() > character.respawnAt) {
        let updatedChar = structuredClone(character);
        updatedChar.status = 'idle';
        updatedChar.deaths += 1;
        updatedChar.stats.health.current = updatedChar.stats.health.max / 2;
        updatedChar.stats.fatigue.current = 0;
        updatedChar.location = 'whiterun';
        updatedChar.respawnAt = null;
        updatedChar.deathOccurredAt = null;
        updatedChar.activeSovngardeQuest = null;
        updatedChar.currentAction = null;
        updatedChar.effects = [];
        updatedChar.mood = 40; // Respawned, but not happy
        const logMessage = "Боги сжалились, и душа героя вернулась в тело. Он очнулся в Вайтране.";
        return { char: updatedChar, log: logMessage };
    }
    return { char: character, log: null };
}

/**
 * Processes active effects, removing expired ones and applying ongoing damage like poison.
 */
function processEffects(character: Character): {char: Character, logs: string[]} {
    const logs: string[] = [];
    let updatedChar = structuredClone(character);
    const activeEffects: ActiveEffect[] = [];

    if (updatedChar.effects && updatedChar.effects.length > 0) {
        for (const effect of updatedChar.effects) {
            if (effect.type !== 'permanent' && Date.now() >= effect.expiresAt) {
                logs.push(`Действие эффекта "${effect.name}" закончилось.`);
                continue;
            }
            if (updatedChar.status !== 'dead' && effect.id === 'weak_poison') {
                const poisonDamage = effect.value || 2;
                updatedChar.stats.health.current -= poisonDamage;
                logs.push(`Герой теряет ${poisonDamage} здоровья от яда.`);
            }
            activeEffects.push(effect);
        }
        updatedChar.effects = activeEffects;
    }
    return { char: updatedChar, logs };
}

/**
 * Checks if the character has died and handles the death logic.
 */
async function processDeath(character: Character, userId: string): Promise<{char: Character, log: string | null, didDie: boolean}> {
    if (character.stats.health.current <= 0 && character.status !== 'dead') {
        let updatedChar = structuredClone(character);
        let logMessages = "";

        updatedChar.status = 'dead';
        updatedChar.combat = null;
        updatedChar.currentAction = null;
        updatedChar.mood = 5; // Very sad
        if (updatedChar.activeCryptQuest) {
            updatedChar.activeCryptQuest = null; 
            logMessages += "Смерть в склепе! Дух героя с позором изгнан из древних залов.";
        }
        updatedChar.stats.health.current = 0;
        // Keep permanent effects on death
        updatedChar.effects = updatedChar.effects.filter(e => e.type === 'permanent');
        
        let respawnTime = 10 * 60 * 1000;
        if (updatedChar.level > 15) {
            respawnTime += (Math.floor(Math.random() * 15) + 1) * 60 * 1000;
        }
        updatedChar.deathOccurredAt = Date.now();
        updatedChar.respawnAt = updatedChar.deathOccurredAt + respawnTime;
        
        logMessages += ` Герой пал... Его душа отправляется в Совнгард. Возрождение через ${Math.floor(respawnTime / (60 * 1000))} минут.`;
        await addChronicleEntry(userId, { type: 'death', title: 'Герой пал', description: 'Душа героя отправилась в Совнгард на заслуженный (или не очень) отдых.', icon: 'Skull' });
        
        return { char: updatedChar, log: logMessages.trim(), didDie: true };
    }
    return { char: character, log: null, didDie: false };
}

/**
 * Handles level up logic and auto-allocation of points.
 */
async function processLevelUp(character: Character): Promise<{ char: Character, log: string | null }> {
    if (character.xp.current < character.xp.required) {
        return { char: character, log: null };
    }

    let updatedChar = structuredClone(character);
    let logMessages = "";

    while (updatedChar.xp.current >= updatedChar.xp.required) {
        updatedChar.level += 1;
        const xpOver = updatedChar.xp.current - updatedChar.xp.required;
        updatedChar.xp.required = Math.floor(updatedChar.xp.required * 1.5);
        updatedChar.xp.current = xpOver;
        
        updatedChar.points.attribute += 1;
        updatedChar.points.skill += 5;

        logMessages += ` Уровень повышен! Герой теперь ${updatedChar.level} уровня! Получено 1 очко характеристик и 5 очков навыков.`;
        await addChronicleEntry(updatedChar.id, { type: 'level_up', title: `Достигнут ${updatedChar.level} уровень`, description: 'Опыт, полученный в боях, сделал героя сильнее.', icon: 'Award', data: { level: updatedChar.level } });
    }

    // Auto-allocate points if enabled
    if (updatedChar.preferences?.autoAssignPoints) {
        let autoAllocationLog = "";
        
        // Auto-allocate attribute points
        while (updatedChar.points.attribute > 0) {
            const attributes: (keyof Character['attributes'])[] = ['endurance', 'strength', 'intelligence', 'agility'];
            // Find attribute with lowest value to balance character
            const lowestAttr = attributes.reduce((lowest, current) => 
                updatedChar.attributes[current] < updatedChar.attributes[lowest] ? current : lowest
            );
            updatedChar.attributes[lowestAttr] += 1;
            updatedChar.points.attribute -= 1;
            
            const attrNames = {
                endurance: 'Выносливость',
                strength: 'Силу',
                intelligence: 'Интеллект',
                agility: 'Ловкость'
            };
            autoAllocationLog += ` +1 ${attrNames[lowestAttr]}.`;
        }
        
        // Auto-allocate skill points
        while (updatedChar.points.skill > 0) {
            const skills: (keyof Character['skills'])[] = ['oneHanded', 'block', 'heavyArmor', 'lightArmor', 'persuasion', 'alchemy'];
            // Find skill with lowest value to balance character
            const lowestSkill = skills.reduce((lowest, current) => 
                updatedChar.skills[current] < updatedChar.skills[lowest] ? current : lowest
            );
            updatedChar.skills[lowestSkill] += 1;
            updatedChar.points.skill -= 1;
            
            const skillNames = {
                oneHanded: 'Одноручное оружие',
                block: 'Блокирование',
                heavyArmor: 'Тяжелая броня',
                lightArmor: 'Легкая броня',
                persuasion: 'Красноречие',
                alchemy: 'Алхимия'
            };
            if (updatedChar.points.skill % 5 === 4 || updatedChar.points.skill === 0) {
                autoAllocationLog += ` +1 ${skillNames[lowestSkill]}.`;
            }
        }
        
        if (autoAllocationLog) {
            logMessages += ` Очки распределены автоматически:${autoAllocationLog}`;
        }
    }

    // Update max stats based on new level and attributes
    updatedChar.stats.health.max = 80 + updatedChar.attributes.endurance * 10;
    updatedChar.stats.magicka.max = 80 + updatedChar.attributes.intelligence * 10;
    updatedChar.stats.stamina.max = 80 + (updatedChar.attributes.strength + updatedChar.attributes.endurance) * 5;

    // Full heal on level up
    updatedChar.stats.health.current = updatedChar.stats.health.max;
    updatedChar.stats.magicka.current = updatedChar.stats.magicka.max;
    updatedChar.stats.stamina.current = updatedChar.stats.stamina.max;
    updatedChar.stats.fatigue.current = 0;
    
    const levelUpMoodBoost = 25;
    updatedChar.mood = Math.min(100, updatedChar.mood + levelUpMoodBoost);
    logMessages += ` Характеристики восстановлены и улучшены, а настроение взлетело до небес (+${levelUpMoodBoost})!`;
    
    return { char: updatedChar, log: logMessages.trim() };
}


/**
 * Handles the completion of timed actions like quests, travel, resting, etc.
 */
async function processActionCompletion(character: Character, gameData: GameData, userId: string): Promise<{char: Character, logs: string[]}> {
    const logs: string[] = [];
    let updatedChar = structuredClone(character);
    const { currentAction } = character;

    if (!currentAction || Date.now() < (currentAction.startedAt + currentAction.duration)) {
        return { char: character, logs: [] };
    }

    switch (currentAction.type) {
        case 'rest':
            logs.push(`Отдых в таверне подошел к концу. Герой чувствует себя посвежевшим.`);
            updatedChar.mood = Math.min(100, updatedChar.mood + 5);
            updatedChar.status = 'idle';
            break;
        case 'travel_rest':
            logs.push("Привал окончен. Отдых придал герою сил и бодрости. Он чувствует себя готовым к новым свершениям!");
            updatedChar.status = 'idle';
            updatedChar.stats.stamina.current = updatedChar.stats.stamina.max;
            updatedChar.stats.fatigue.current = 0;
            updatedChar.mood = Math.min(100, updatedChar.mood + 10);
            break;
        case 'jail':
            logs.push("Стража выпустила героя из-под стражи. Свобода сладка, даже если немного стыдно.");
            updatedChar.status = 'idle';
            if (!updatedChar.actionCooldowns) updatedChar.actionCooldowns = {};
            updatedChar.actionCooldowns['exploreCity'] = Date.now();
            break;
        case 'sovngarde_quest':
            const sovngardeQuest = gameData.sovngardeQuests.find(q => q.id === currentAction.sovngardeQuestId);
            if (sovngardeQuest && updatedChar.respawnAt) {
                if (Math.random() < 0.5) {
                    logs.push(`Задание "${sovngardeQuest.title}" провалено! Время искупления не сократилось.`);
                    updatedChar.mood = Math.max(0, updatedChar.mood - 5);
                } else {
                    const timeReductionMs = sovngardeQuest.timeReduction;
                    updatedChar.respawnAt -= timeReductionMs;
                    updatedChar.mood = Math.min(100, updatedChar.mood + 10);
                    logs.push(`Задание "${sovngardeQuest.title}" успешно выполнено! Время до возрождения сократилось на ${(timeReductionMs / (60 * 1000)).toFixed(1)} минут.`);
                }
            }
            updatedChar.activeSovngardeQuest = null;
            updatedChar.status = 'dead';
            break;
        case 'explore':
            logs.push("Закончив прогулку, герой ищет, чем заняться дальше.");
            updatedChar.status = 'idle';
            if (!updatedChar.actionCooldowns) updatedChar.actionCooldowns = {};
            updatedChar.actionCooldowns['exploreCity'] = Date.now();
            break;
        case 'trading':
            let tradeLog = 'Закончив с торговлей, герой выходит из лавки. ';
            const junk = updatedChar.inventory.filter(i => i.type === 'misc');
            if (junk.length > 0) {
                const value = Math.floor(junk.reduce((acc, item) => acc + (item.weight * 5 * item.quantity), 0));
                updatedChar.inventory = updatedChar.inventory.filter(i => i.type !== 'misc');
                const goldItem = updatedChar.inventory.find(i => i.id === 'gold')!;
                goldItem.quantity += value;
                tradeLog += `Он успешно продал всякий хлам за ${value} золота. `;
                updatedChar.mood = Math.min(100, updatedChar.mood + 5);
            }
            const gold = updatedChar.inventory.find(i => i.id === 'gold')!;
            if (gold.quantity > 50 && Math.random() < 0.4) {
                const itemToBuy = gameData.items.find(i => i.id === 'potion_health_weak');
                if (itemToBuy) {
                    gold.quantity -= 50;
                    const { updatedCharacter: charWithItem } = addItemToInventory(updatedChar, itemToBuy, 1);
                    updatedChar = charWithItem;
                    tradeLog += `Заодно он прикупил ${itemToBuy.name}.`;
                }
            } else {
                tradeLog += 'В этот раз ничего не приглянулось.';
            }
            logs.push(tradeLog);
            updatedChar.status = 'idle';
             if (!updatedChar.actionCooldowns) updatedChar.actionCooldowns = {};
            updatedChar.actionCooldowns['exploreCity'] = Date.now();
            break;
        case 'travel':
            updatedChar.location = currentAction.destinationId!;
            const destination = gameData.locations.find(l=>l.id === currentAction.destinationId);
            logs.push(`...После долгого пути, герой наконец прибыл в ${destination?.name || 'новые земли'}.`);
            const hasVisited = updatedChar.visitedLocations?.includes(destination!.id);
            if (destination && destination.type === 'city' && !hasVisited) {
                if (!updatedChar.visitedLocations) updatedChar.visitedLocations = [];
                updatedChar.visitedLocations.push(destination.id);
                updatedChar.mood = Math.min(100, updatedChar.mood + 10);
                updatedChar.xp.current += 100;
                await addChronicleEntry(userId, { type: 'discovery_city', title: `Открыт город: ${destination.name}`, description: `Герой впервые добрался до одного из великих городов Скайрима. Получено 100 опыта.`, icon: 'MapPin' });
            }
            updatedChar.status = 'idle';
            break;
        case 'quest':
            const quest = gameData.quests.find(q => q.id === currentAction.questId);
            if (quest) {
                let logMessage = `Герой достиг успеха в задании "${quest.title}"! Получено ${quest.reward.xp} опыта.`;
                updatedChar.xp.current += quest.reward.xp;
                updatedChar.mood = Math.min(100, updatedChar.mood + 15);
                logMessage += ' Настроение героя улучшилось.';

                const { updatedCharacter: charWithGold, logMessage: goldLog } = addItemToInventory(updatedChar, {id: 'gold', name: 'Золото', weight: 0, type: 'gold'}, quest.reward.gold);
                updatedChar = charWithGold;
                logMessage += ` ${goldLog}`;

                if (!updatedChar.completedQuests) updatedChar.completedQuests = [];
                updatedChar.completedQuests.push(quest.id);

                // Handle guaranteed item rewards
                if (quest.reward.items) {
                    for (const rewardItemInfo of quest.reward.items) {
                        const baseItem = gameData.items.find(i => i.id === rewardItemInfo.id);
                        if (baseItem) {
                            const { updatedCharacter: charWithItem, logMessage: itemLog } = addItemToInventory(updatedChar, baseItem, rewardItemInfo.quantity);
                            updatedChar = charWithItem;
                            logMessage += ` ${itemLog}`;
                         }
                    }
                }
                
                // Handle random item rewards
                if (quest.reward.randomItemRewards) {
                    for (const randomReward of quest.reward.randomItemRewards) {
                        const possibleItems = gameData.items.filter(
                            i => i.rarity === randomReward.rarity && i.type === randomReward.type
                        );
                        if (possibleItems.length > 0) {
                            const chosenItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                            const { updatedCharacter: charWithItem, logMessage: itemLog } = addItemToInventory(updatedChar, chosenItem, randomReward.quantity);
                            updatedChar = charWithItem;
                            logMessage += ` В качестве награды он получает: ${chosenItem.name}.`;
                        }
                    }
                }

                await addChronicleEntry(userId, { type: 'quest_complete', title: `Задание выполнено: ${quest.title}`, description: quest.description, icon: 'BookCheck', data: { questId: quest.id } });
                logs.push(logMessage);
            }
            updatedChar.status = 'idle';
            break;
    }
    
    updatedChar.currentAction = null;
    return { char: updatedChar, logs };
}

/**
 * Handles passive regeneration of stats when the character is idle.
 */
function processPassiveRegen(character: Character): {char: Character, log: string | null} {
    if (character.status !== 'idle') return { char: character, log: null };
    
    let updatedChar = structuredClone(character);
    let logMessage = null;

    const hasShameDebuff = updatedChar.effects.some(e => e.id === 'public_shame');
    const hasRestedBuff = updatedChar.effects.some(e => e.id === 'rested');
    
    if (hasShameDebuff && Math.random() < 0.1) {
        logMessage = "Чувствуя на себе косые взгляды, герой восстанавливает силы медленнее обычного.";
    }
    const regenMultiplier = hasShameDebuff ? 0.5 : 1;
    const staminaRegenMultiplier = hasRestedBuff ? 1.5 : 1;

    if (updatedChar.stats.stamina.current < updatedChar.stats.stamina.max) {
        updatedChar.stats.stamina.current = Math.min(updatedChar.stats.stamina.max, updatedChar.stats.stamina.current + Math.floor(updatedChar.stats.stamina.max * 0.15 * regenMultiplier * staminaRegenMultiplier));
    }
    if (updatedChar.stats.magicka.current < updatedChar.stats.magicka.max) {
         updatedChar.stats.magicka.current = Math.min(updatedChar.stats.magicka.max, updatedChar.stats.magicka.current + Math.floor(updatedChar.stats.magicka.max * 0.05 * regenMultiplier));
    }
    
    return { char: updatedChar, log: logMessage };
}

/**
 * Handles random events during travel.
 */
function processTravelEvents(character: Character, gameData: GameData): { char: Character, logs: string[] } {
    const logs: string[] = [];
    let updatedChar = structuredClone(character);

    if (updatedChar.status !== 'busy' || updatedChar.currentAction?.type !== 'travel') {
        return { char: character, logs };
    }
    
    const allEvents = gameData.events.filter(event => {
        if (event.seasons && !event.seasons.includes(updatedChar.season)) {
            return false;
        }
        return true;
    });

    for (const event of allEvents) {
        if (Math.random() < event.chance) {
            logs.push(event.description);
            switch(event.type) {
                case 'combat':
                    updatedChar.mood = Math.max(0, updatedChar.mood - 10);
                    const baseEnemy = gameData.enemies.find(e => e.id === event.enemyId);
                    if (baseEnemy) {
                        const levelMultiplier = 1 + (updatedChar.level - 1) * 0.15;
                        const enemy = { 
                            name: baseEnemy.name, 
                            health: { current: Math.floor(baseEnemy.health * levelMultiplier), max: Math.floor(baseEnemy.health * levelMultiplier) }, 
                            damage: Math.max(1, Math.floor(baseEnemy.damage * levelMultiplier)), 
                            xp: Math.floor(baseEnemy.xp * levelMultiplier),
                            armor: baseEnemy.armor || (10 + (baseEnemy.level || 1)),
                            appliesEffect: baseEnemy.appliesEffect || null,
                        };
                        
                        const travelAction = updatedChar.currentAction!;
                        const elapsed = Date.now() - travelAction.startedAt;
                        const remaining = travelAction.duration - elapsed;
                        
                        if (remaining > 0) {
                            updatedChar.pendingTravel = { 
                                destinationId: travelAction.destinationId!, 
                                remainingDuration: remaining,
                                originalDuration: travelAction.originalDuration || travelAction.duration,
                            };
                        }

                        updatedChar.currentAction = null; // Interrupt travel
                        updatedChar.status = 'in-combat';
                        updatedChar.combat = { enemyId: baseEnemy.id, enemy, fleeAttempted: false };
                        logs.push(`Путешествие прервано! Герой вступает в бой с ${enemy.name}!`);
                        return { char: updatedChar, logs }; // Exit after one combat event
                    }
                    break;
                case 'item':
                    if (event.itemId && event.itemQuantity) {
                         const baseItem = gameData.items.find(i => i.id === event.itemId);
                         if (baseItem) {
                            const { updatedCharacter: charWithItem, logMessage } = addItemToInventory(updatedChar, baseItem, event.itemQuantity);
                            updatedChar = charWithItem;
                            logs.push(logMessage.replace('Получен предмет:', 'Найден предмет:'));
                            updatedChar.mood = Math.min(100, updatedChar.mood + 5);
                         }
                    }
                    break;
                case 'npc':
                    const npc = gameData.npcs.find(n => n.id === event.npcId);
                    if (npc && npc.dialogue.length > 0) {
                        const randomDialogue = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
                        logs.push(`Он говорит: "${randomDialogue}"`);
                    }
                    break;
                case 'narrative':
                    if (event.id === 'travel_explore_battlefield') {
                        let lootLog = "";
                        // 80% chance for common misc
                        if (Math.random() < 0.8) {
                            const possibleItems = gameData.items.filter(i => i.rarity === 'common' && i.type === 'misc');
                            if (possibleItems.length > 0) {
                                const chosenItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                                const { updatedCharacter: charWithItem } = addItemToInventory(updatedChar, chosenItem, 1);
                                updatedChar = charWithItem;
                                lootLog += ` Он находит ${chosenItem.name}.`;
                            }
                        }
                        // 30% chance for a common weapon
                        if (Math.random() < 0.3) {
                            const possibleItems = gameData.items.filter(i => i.rarity === 'common' && i.type === 'weapon');
                            if (possibleItems.length > 0) {
                                const chosenItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                                const { updatedCharacter: charWithItem } = addItemToInventory(updatedChar, chosenItem, 1);
                                updatedChar = charWithItem;
                                lootLog += ` Среди обломков он находит ${chosenItem.name}.`;
                            }
                        }

                        if (lootLog === "") {
                            lootLog = " Увы, ничего ценного найти не удалось.";
                        } else {
                            updatedChar.mood = Math.min(100, updatedChar.mood + 5);
                        }
                        logs.push(lootLog.trim());
                    }
                    break;
            }
        }
    }
    
    return { char: updatedChar, logs };
}

/**
 * Processes stamina consumption during travel and forces a rest if needed.
 */
function processTravelFatigue(character: Character): { char: Character } {
    let updatedChar = structuredClone(character);

    if (updatedChar.currentAction?.type !== 'travel') {
        return { char: character };
    }

    updatedChar.stats.fatigue.current = Math.min(updatedChar.stats.fatigue.max, updatedChar.stats.fatigue.current + 5);
    
    return { char: updatedChar };
}

/**
 * Processes weather changes.
 */
function processWeather(character: Character): { char: Character, log: string | null } {
    let updatedChar = structuredClone(character);
    let logMessage = null;

    // Small chance to change weather each tick
    if (Math.random() < 0.05) { // 5% chance
        const currentSeason = updatedChar.season;
        let possibleWeathers: Weather[] = [];
        
        switch (currentSeason) {
            case 'Summer':
                possibleWeathers = ['Clear', 'Clear', 'Clear', 'Cloudy', 'Rain'];
                break;
            case 'Autumn':
                possibleWeathers = ['Cloudy', 'Cloudy', 'Rain', 'Fog', 'Clear'];
                break;
            case 'Winter':
                possibleWeathers = ['Snow', 'Snow', 'Cloudy', 'Fog'];
                break;
            case 'Spring':
                possibleWeathers = ['Rain', 'Rain', 'Cloudy', 'Clear', 'Fog'];
                break;
        }

        const newWeather = possibleWeathers[Math.floor(Math.random() * possibleWeathers.length)];
        
        if (newWeather !== updatedChar.weather) {
            updatedChar.weather = newWeather;
            const weatherTranslations: Record<Weather, string> = {
                'Clear': 'погода прояснилась',
                'Cloudy': 'небо затянуло облаками',
                'Rain': 'начался дождь',
                'Snow': 'пошел снег',
                'Fog': 'опустился туман'
            };
            logMessage = `Погода изменилась: ${weatherTranslations[newWeather]}.`;
        }
    }

    return { char: updatedChar, log: logMessage };
}

/**
 * Advances the in-game calendar and handles season changes.
 */
function processTimeAndSeasons(character: Character): { char: Character, log: string | null } {
    let updatedChar = structuredClone(character);
    let logMessage = null;

    // 1 tick = 30 in-game minutes
    const IN_GAME_MINUTES_PER_TICK = 30;
    updatedChar.gameDate += IN_GAME_MINUTES_PER_TICK * 60 * 1000;

    const currentInGameDate = new Date(updatedChar.gameDate);
    const month = currentInGameDate.getMonth(); // 0-11

    let newSeason: Season;
    if (month >= 2 && month <= 4) newSeason = 'Spring';
    else if (month >= 5 && month <= 7) newSeason = 'Summer';
    else if (month >= 8 && month <= 10) newSeason = 'Autumn';
    else newSeason = 'Winter'; // Dec, Jan, Feb

    if (newSeason !== updatedChar.season) {
        updatedChar.season = newSeason;
        const seasonTranslations: Record<Season, string> = {
            'Spring': 'весна',
            'Summer': 'лето',
            'Autumn': 'осень',
            'Winter': 'зима',
        };
        logMessage = `Наступила ${seasonTranslations[newSeason]}.`;
    }

    return { char: updatedChar, log: logMessage };
}

/**
 * Processes character's mood. It drifts towards neutral and is affected by stats.
 */
function processMood(character: Character): {char: Character, logs: string[]} {
    let updatedChar = structuredClone(character);
    const logs: string[] = [];
    let moodChanged = false;

    // Mood drift towards neutral (50)
    if (updatedChar.status !== 'in-combat') {
        if (updatedChar.mood > 51) {
            updatedChar.mood -= 0.2;
            moodChanged = true;
        } else if (updatedChar.mood < 49) {
            updatedChar.mood += 0.5;
            moodChanged = true;
        }
    }
    
    // Penalty for being injured
    if (updatedChar.stats.health.current < updatedChar.stats.health.max * 0.4) {
        updatedChar.mood = Math.max(0, updatedChar.mood - 1);
        if (Math.random() < 0.05) { // small chance to log
            logs.push("Ноющие раны портят герою настроение.");
        }
        moodChanged = true;
    }
    
    // Dibella's Grace keeps mood high
    if (updatedChar.effects.some(e => e.id === 'grace_dibella')) {
        updatedChar.mood = Math.max(70, updatedChar.mood);
    }


    if (moodChanged) {
        updatedChar.mood = Math.round(Math.max(0, Math.min(100, updatedChar.mood)));
    }
    
    return { char: updatedChar, logs };
}

/**
 * Checks for and applies Divine Grace if favor is maxed out.
 */
function processDivineFavor(character: Character): { char: Character, log: string | null } {
    if ((character.divineFavor || 0) < 100) {
        return { char: character, log: null };
    }

    let updatedChar = structuredClone(character);
    const deity = allDivinities.find(d => d.id === updatedChar.patronDeity);
    if (!deity) return { char: character, log: null };

    updatedChar = deity.grace.apply(updatedChar);
    updatedChar.divineFavor = 0; // Reset favor

    const logMessage = `Ваш бог-покровитель ${deity.name} доволен! Герой получает благословение: "${deity.grace.name}".`;

    return { char: updatedChar, log: logMessage };
}

/**
 * Checks for temple completion and awards the final prize.
 */
async function processTempleCompletion(character: Character): Promise<{ char: Character, log: string | null }> {
    const TEMPLE_GOAL = 2000000;
    if (character.templeCompletedFor || (character.templeProgress || 0) < TEMPLE_GOAL) {
        return { char: character, log: null };
    }

    let updatedChar = structuredClone(character);
    const deity = allDivinities.find(d => d.id === updatedChar.patronDeity);
    if (!deity) return { char: character, log: null };
    
    updatedChar.templeCompletedFor = deity.id;

    // Add permanent effect
    const permanentEffect: ActiveEffect = {
        ...deity.finalReward.permanentEffect,
        type: 'permanent',
        expiresAt: Infinity,
    };
    updatedChar.effects.push(permanentEffect);

    // Add artifact to inventory
    const { updatedCharacter: charWithItem, logMessage: itemLog } = addItemToInventory(updatedChar, deity.finalReward.artifact, 1);
    updatedChar = charWithItem;

    const logMessage = `ВЕЛИКОЕ СВЕРШЕНИЕ! Храм в честь ${deity.name} достроен! В благодарность божество дарует герою вечное благословение: "${permanentEffect.name}" и легендарный артефакт: ${deity.finalReward.artifact.name}!`;

    await addChronicleEntry(character.id, {
        type: 'quest_complete',
        title: `Храм ${deity.name} достроен!`,
        description: `Годы пожертвований и молитв принесли свои плоды. Великий храм теперь стоит как вечный памятник вере героя.`,
        icon: 'Castle'
    });
    
    return { char: updatedChar, log: logMessage };
}


async function processEpicPhraseGeneration(character: Character): Promise<{ char: Character, log: string | null }> {
    if (Math.random() > 0.08) { // ~8% chance per tick to even consider this, avoids spamming
        return { char: character, log: null };
    }

    const phrase = getFallbackThought(character);
    if (phrase) {
        let updatedChar = structuredClone(character);
        if (!updatedChar.analytics.epicPhrases) {
            updatedChar.analytics.epicPhrases = [];
        }
        updatedChar.analytics.epicPhrases.push(phrase);
        
        // Limit to last 20 phrases
        if (updatedChar.analytics.epicPhrases.length > 20) {
            updatedChar.analytics.epicPhrases.shift();
        }
        
        return { char: updatedChar, log: `У героя родилась мысль: "${phrase}"` };
    }
    
    return { char: character, log: null };
}


/**
 * The main entry point for processing a single game tick.
 * @param character The current character state.
 * @param gameData The static game data.
 * @returns An object containing the updated character and logs.
 */
export async function processGameTick(
    character: Character, 
    gameData: GameData
): Promise<{ 
    updatedCharacter: Character; 
    adventureLog: string[]; 
    combatLog: string[];
}> {
    
    if (!character || !gameData || !character.id) {
        return { updatedCharacter: character, adventureLog: [], combatLog: [] };
    }

    let updatedChar: Character = structuredClone(character);
    const adventureLog: string[] = [];
    const combatLog: string[] = [];
    const userId = character.id;
    let shouldTakeTurn = true;
    
    // --- 1. RESPAWN LOGIC ---
    const respawnResult = processRespawn(updatedChar);
    if (respawnResult.log) {
        adventureLog.push(respawnResult.log);
        return { updatedCharacter: respawnResult.char, adventureLog, combatLog };
    }
    updatedChar = respawnResult.char;
    
    // --- 2. POWER REGENERATION ---
    if (updatedChar.interventionPower.current < updatedChar.interventionPower.max) {
        updatedChar.interventionPower.current = Math.min(updatedChar.interventionPower.max, updatedChar.interventionPower.current + 1);
    }

    // --- 3. TIME AND SEASON ---
    const timeResult = processTimeAndSeasons(updatedChar);
    updatedChar = timeResult.char;
    if (timeResult.log) adventureLog.push(timeResult.log);

    // --- 4. EFFECT PROCESSING ---
    const effectsResult = processEffects(updatedChar);
    updatedChar = effectsResult.char;
    adventureLog.push(...effectsResult.logs);
    
    // --- 5. DEATH LOGIC ---
    const deathResult = await processDeath(updatedChar, userId);
    if (deathResult.didDie) {
        if(deathResult.log) adventureLog.push(deathResult.log);
        return { updatedCharacter: deathResult.char, adventureLog, combatLog };
    }
    
    // --- 6. DIVINE FAVOR & TEMPLE COMPLETION ---
    const divineFavorResult = processDivineFavor(updatedChar);
    if (divineFavorResult.log) {
        updatedChar = divineFavorResult.char;
        adventureLog.push(divineFavorResult.log);
    }
    
    const templeResult = await processTempleCompletion(updatedChar);
    if (templeResult.log) {
        updatedChar = templeResult.char;
        adventureLog.push(templeResult.log);
    }


    // --- 7. ACTION COMPLETION ---
    if (updatedChar.currentAction) {
        const actionResult = await processActionCompletion(updatedChar, gameData, userId);
        if (actionResult.logs.length > 0) {
            updatedChar = actionResult.char;
            adventureLog.push(...actionResult.logs);
            shouldTakeTurn = !updatedChar.currentAction;
        }
    }
    
    // --- 8. TRAVEL EVENTS & FATIGUE ---
    if (shouldTakeTurn && updatedChar.currentAction?.type === 'travel') {
        const travelEventResult = processTravelEvents(updatedChar, gameData);
        updatedChar = travelEventResult.char;
        adventureLog.push(...travelEventResult.logs);

        if (updatedChar.currentAction?.type === 'travel') {
             const travelFatigueResult = processTravelFatigue(updatedChar);
             updatedChar = travelFatigueResult.char;
        }
    }

    // --- 9. SLEEP COMPLETION ---
    if (updatedChar.status === 'sleeping' && updatedChar.sleepUntil && Date.now() > updatedChar.sleepUntil) {
        updatedChar.status = 'idle';
        updatedChar.stats.health.current = updatedChar.stats.health.max;
        updatedChar.stats.magicka.current = updatedChar.stats.magicka.max;
        updatedChar.stats.stamina.current = updatedChar.stats.stamina.max;
        updatedChar.stats.fatigue.current = 0;
        updatedChar.mood = Math.min(100, updatedChar.mood + 25);
        updatedChar.sleepUntil = null;
        const wellRestedEffect: ActiveEffect = {
            id: 'well_rested', name: 'Хороший отдых', description: 'Герой хорошо выспался и полон сил. Не хочет спать снова в ближайшее время.',
            icon: 'Bed', type: 'buff', expiresAt: Date.now() + 15 * 60 * 1000,
        };
        updatedChar.effects = updatedChar.effects.filter(e => e.id !== 'well_rested' && e.id !== 'rested');
        updatedChar.effects.push(wellRestedEffect);
        adventureLog.push("Герой проснулся отдохнувшим и полным сил. Он чувствует себя хорошо отдохнувшим и пока не хочет снова ложиться спать.");
        shouldTakeTurn = false;
    }
    
    // --- 10. RESUME INTERRUPTED TRAVEL ---
    if (updatedChar.status === 'idle' && updatedChar.pendingTravel) {
        const destinationName = gameData.locations.find(l => l.id === updatedChar.pendingTravel!.destinationId)?.name || 'неизвестное место';
        updatedChar.status = 'busy';
        updatedChar.currentAction = { 
            type: 'travel', 
            name: `Путь в ${destinationName}`, 
            description: `Герой продолжает свое путешествие.`, 
            startedAt: Date.now(), 
            duration: updatedChar.pendingTravel.remainingDuration,
            originalDuration: updatedChar.pendingTravel.originalDuration,
            destinationId: updatedChar.pendingTravel.destinationId 
        };
        adventureLog.push(`Восстановив силы, герой продолжает путь в ${destinationName}.`);
        updatedChar.pendingTravel = null;
        shouldTakeTurn = false;
    }

    // --- 11. LEVEL UP CHECK ---
    const levelUpResult = await processLevelUp(updatedChar);
    if (levelUpResult.log) {
        updatedChar = levelUpResult.char;
        adventureLog.push(levelUpResult.log);
    }

    // --- 12. PASSIVE REGENERATION & OTHER IDLE EFFECTS ---
    if (shouldTakeTurn) {
        const regenResult = processPassiveRegen(updatedChar);
        updatedChar = regenResult.char;
        if(regenResult.log) adventureLog.push(regenResult.log);

        const weatherResult = processWeather(updatedChar);
        updatedChar = weatherResult.char;
        if (weatherResult.log) adventureLog.push(weatherResult.log);
        
        const moodResult = processMood(updatedChar);
        updatedChar = moodResult.char;
        adventureLog.push(...moodResult.logs);
    }
   
    // --- 13. ACTION LOGIC (AI Brain) ---
    if (shouldTakeTurn) {
        try {
            const result = await processCharacterTurn(updatedChar, gameData);
            if (result) {
                updatedChar = result.character;
                const log = result.logMessage;
                if (Array.isArray(log)) {
                    combatLog.push(...log);
                } else if (log) {
                    adventureLog.push(log);
                }
            }
        } catch (error) {
            console.error("Ошибка в игровом цикле:", error);
            adventureLog.push('Произошла критическая ошибка в логике героя. Проверьте консоль.');
        }
    }

     // --- 14. NARRATIVE BRAIN (GenAI) ---
    if (shouldTakeTurn && Math.random() < 0.3) { // Reduced chance to avoid spamming thoughts
        const epicPhraseResult = await processEpicPhraseGeneration(updatedChar);
        if (epicPhraseResult.log) {
            updatedChar = epicPhraseResult.char;
            adventureLog.push(epicPhraseResult.log);
        }
    }

    // --- 15. FINAL STATE UPDATE ---
    if (updatedChar.divineSuggestion && character.divineSuggestion) {
        adventureLog.push(`Прислушавшись к божественному шепоту, герой решает: "${character.divineSuggestion}".`);
        updatedChar.divineSuggestion = null;
    }

    // --- 16. ACHIEVEMENTS EVALUATION ---
    try {
        // Hydrate unlockedAchievements from preferences if missing (worker loads raw DB rows)
        if (!updatedChar.unlockedAchievements && (updatedChar as any).preferences?.unlockedAchievements) {
            updatedChar.unlockedAchievements = (updatedChar as any).preferences.unlockedAchievements;
        }
        const { evaluateAchievements, persistAchievementUnlocks } = await import("@/services/achievementsService");
        const unlocks = evaluateAchievements(updatedChar, gameData);
        if (unlocks.length > 0) {
            await persistAchievementUnlocks(userId, updatedChar, unlocks);
            unlocks.forEach(u => adventureLog.push(`Получено достижение: ${u.name}`));
        }
    } catch (err) {
        console.error('Achievements evaluation failed:', err);
    }

    return { 
        updatedCharacter: updatedChar, 
        adventureLog: adventureLog.filter(Boolean), // Filter out empty messages
        combatLog: combatLog.filter(Boolean),
    };
}
