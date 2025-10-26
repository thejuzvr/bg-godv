'use server';

import { db } from '../../server/storage';
import * as schema from '../../shared/schema';
import { getActiveCompanion } from './companionService';

/**
 * Добавить событие компаньона в журнал приключений
 */
export async function addCompanionEvent(
  characterId: string,
  type: 'combat' | 'travel' | 'social' | 'companion' | 'misc',
  message: string,
  data?: Record<string, any>
) {
  try {
    await db.insert(schema.offlineEvents).values({
      characterId,
      realmId: 'global',
      timestamp: Date.now(),
      type,
      message,
      data: data || {},
      isRead: false,
    });
  } catch (error) {
    console.error('Error adding companion event:', error);
  }
}

/**
 * Генерация событий компаньона для различных ситуаций
 */

// Компаньон помогает в бою
export async function companionCombatEvent(
  characterId: string,
  companionName: string,
  enemyName: string,
  damage: number
) {
  const messages = [
    `${companionName} яростно атаковал ${enemyName}, нанеся ${damage} урона!`,
    `${companionName} прикрыл героя и нанёс ${damage} урона ${enemyName}.`,
    `${companionName} с боевым кличем атаковал ${enemyName} (${damage} урона).`,
    `${companionName} искусно поразил ${enemyName}, нанеся ${damage} урона.`,
  ];
  
  const message = messages[Math.floor(Math.random() * messages.length)];
  await addCompanionEvent(characterId, 'combat', message, {
    companionName,
    enemyName,
    damage,
  });
}

// Компаньон говорит в путешествии
export async function companionTravelDialogue(
  characterId: string,
  companionName: string,
  dialogue: string
) {
  const message = `${companionName}: "${dialogue}"`;
  await addCompanionEvent(characterId, 'travel', message, {
    companionName,
    dialogue,
  });
}

// Компаньон помогает в социальном взаимодействии
export async function companionSocialEvent(
  characterId: string,
  companionName: string,
  npcName: string,
  success: boolean
) {
  const messages = success ? [
    `${companionName} помог убедить ${npcName}, улучшив отношения.`,
    `Благодаря ${companionName}, ${npcName} стал более дружелюбным.`,
    `${companionName} очаровал ${npcName} своими словами.`,
  ] : [
    `${companionName} попытался помочь, но ${npcName} остался равнодушен.`,
    `Несмотря на усилия ${companionName}, ${npcName} не впечатлён.`,
  ];
  
  const message = messages[Math.floor(Math.random() * messages.length)];
  await addCompanionEvent(characterId, 'social', message, {
    companionName,
    npcName,
    success,
  });
}

// Компаньон нанят
export async function companionHiredEvent(
  characterId: string,
  companionName: string,
  location: string,
  cost: number
) {
  const message = `Нанят новый спутник: ${companionName} за ${cost} золота в ${location}.`;
  await addCompanionEvent(characterId, 'companion', message, {
    companionName,
    location,
    cost,
  });
}

// Компаньон покинул отряд
export async function companionLeftEvent(
  characterId: string,
  companionName: string,
  reason: string
) {
  const message = `${companionName} покинул отряд. Причина: ${reason}`;
  await addCompanionEvent(characterId, 'companion', message, {
    companionName,
    reason,
  });
}

// Компаньон повышает настроение
export async function companionMoodBoostEvent(
  characterId: string,
  companionName: string,
  dialogue: string
) {
  const message = `${companionName} поднял настроение: "${dialogue}"`;
  await addCompanionEvent(characterId, 'companion', message, {
    companionName,
    dialogue,
  });
}

// Компаньон помогает избежать боя
export async function companionAvoidCombatEvent(
  characterId: string,
  companionName: string,
  enemyType: string
) {
  const messages = [
    `${companionName} заметил опасность и помог избежать встречи с ${enemyType}.`,
    `Благодаря внимательности ${companionName}, удалось обойти ${enemyType}.`,
    `${companionName} нашёл обходной путь, избежав ${enemyType}.`,
  ];
  
  const message = messages[Math.floor(Math.random() * messages.length)];
  await addCompanionEvent(characterId, 'travel', message, {
    companionName,
    enemyType,
  });
}

// Компаньон находит сокровище
export async function companionFindTreasureEvent(
  characterId: string,
  companionName: string,
  itemName: string
) {
  const messages = [
    `${companionName} нашёл ${itemName} во время путешествия!`,
    `${companionName}: "Смотри, что я нашёл!" — ${itemName}.`,
    `${companionName} обнаружил спрятанный ${itemName}.`,
  ];
  
  const message = messages[Math.floor(Math.random() * messages.length)];
  await addCompanionEvent(characterId, 'companion', message, {
    companionName,
    itemName,
  });
}

/**
 * Хелпер для интеграции в игровой loop
 * Возвращает случайную реплику компаньона в зависимости от ситуации
 */
export async function getRandomCompanionDialogue(
  companionId: string,
  situation: 'idle' | 'combat_win' | 'combat_loss' | 'travel' | 'social'
): Promise<string | null> {
  const companion = await db.query.characterCompanions.findFirst({
    where: (companions, { eq }) => eq(companions.id, companionId),
  });
  
  if (!companion) return null;
  
  // Здесь можно добавить логику выбора диалога на основе personality и mood
  // Но так как dialogues сейчас не сохраняются в БД, вернём null
  // TODO: Добавить dialogues в БД или загружать из шаблонов
  
  return null;
}

/**
 * Интеграция в background worker - пример использования
 */
export async function processCompanionRandomEvents(characterId: string) {
  const companion = await getActiveCompanion(characterId);
  if (!companion) return;
  
  // 5% шанс случайной реплики компаньона каждый тик
  if (Math.random() < 0.05) {
    const randomDialogues = [
      "Хорошая погода для приключений!",
      "Интересно, что нас ждёт впереди?",
      "Я чувствую, что сегодня будет удачный день.",
      "Держись ближе, тут может быть опасно.",
      "А помнишь ту таверну в прошлом городе?",
    ];
    
    const dialogue = randomDialogues[Math.floor(Math.random() * randomDialogues.length)];
    await companionTravelDialogue(characterId, companion.name, dialogue);
  }
}
