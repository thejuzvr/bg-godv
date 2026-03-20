'use server';

import * as storage from "../../../server/storage";
import type { Character } from "@/types/character";
import { allFactions } from "@/data/factions";
import { addOfflineEvent } from "@/services/offlineEventsService";
import { getRedis } from "../../../server/redis";
import { performDivineIntervention } from "../../../server/commands/divine-intervention";

const INTERVENTION_COST = 50;

export async function performIntervention(
    userId: string, 
    type: 'bless' | 'punish'
): Promise<{success: boolean; message: string; character?: Character}> {
  if (!userId) {
    return { success: false, message: "Высшие силы не могут найти вашу душу. Попробуйте войти снова." };
  }

  try {
    // Use new command handler with real-time events
    const result = await performDivineIntervention(userId, { type });
    
    if (!result.success) {
      return { success: false, message: result.error || 'Unknown error' };
    }

    // Log offline event for visibility
    await addOfflineEvent(userId, {
      type: 'divine',
      message: result.data!.actionDescription,
    } as any);

    return {
      success: true,
      message: result.data!.message,
      character: result.data!.character,
    };
  } catch (error: any) {
    console.error('[performIntervention] Error:', error);
    return { success: false, message: error.message || "Произошла неведомая ошибка в божественных сферах." };
  }
}

// Legacy implementation (kept for reference, can be removed later)
async function performInterventionLegacy(
    userId: string, 
    type: 'bless' | 'punish'
): Promise<{success: boolean; message: string; character?: Character}> {
  if (!userId) {
    return { success: false, message: "Высшие силы не могут найти вашу душу. Попробуйте войти снова." };
  }

  try {
    const charData = await storage.getCharacterById(userId);
    if (!charData) {
      throw new Error("Герой не найден в анналах истории.");
    }

    const character: Character = charData as any;
    let actionDescription = '';

    if (character.interventionPower.current < INTERVENTION_COST) {
      throw new Error(`Недостаточно силы для вмешательства. Текущая сила: ${character.interventionPower.current}/${character.interventionPower.max}.`);
    }

    character.interventionPower.current -= INTERVENTION_COST;
    
    if (type === 'bless') {
      const blessings = ['full_heal', 'gold_gift', 'strength_buff', 'magicka_gift', 'stamina_gift'];
      const chosenBlessing = blessings[Math.floor(Math.random() * blessings.length)];

      switch (chosenBlessing) {
        case 'full_heal':
          character.stats.health.current = character.stats.health.max;
          actionDescription = 'полностью исцелили';
          break;
        case 'gold_gift':
          const goldAmount = Math.floor(Math.random() * 50) + 50;
          const goldItem = character.inventory.find(i => i.id === 'gold');
          if (goldItem) {
            goldItem.quantity += goldAmount;
          } else {
            character.inventory.push({ id: 'gold', name: 'Золото', type: 'gold', quantity: goldAmount, weight: 0 });
          }
          actionDescription = `подарили ${goldAmount} золота`;
          break;
        case 'strength_buff':
          const newEffect = {
            id: 'divine_strength',
            name: 'Божественная сила',
            description: 'Увеличивает наносимый урон на 25% на 5 минут.',
            icon: 'Sparkles',
            type: 'buff' as const,
            expiresAt: Date.now() + 5 * 60 * 1000,
            value: 1.25,
          };
          character.effects = character.effects.filter(e => e.id !== 'divine_curse');
          if (!character.effects.some(e => e.id === newEffect.id)) {
            character.effects.push(newEffect);
          }
          actionDescription = 'наложили бафф силы';
          break;
        case 'magicka_gift':
          character.stats.magicka.current = character.stats.magicka.max;
          actionDescription = 'восстановили всю магию';
          break;
        case 'stamina_gift':
          character.stats.stamina.current = character.stats.stamina.max;
          actionDescription = 'восстановили весь запас сил';
          break;
      }
    } else { // 'punish'
      const punishments = ['lightning_strike', 'lose_gold', 'curse_weakness', 'fatigue', 'mana_burn'];
      const chosenPunishment = punishments[Math.floor(Math.random() * punishments.length)];

      switch (chosenPunishment) {
        case 'lightning_strike':
          const damage = Math.floor(character.stats.health.max * 0.1);
          character.stats.health.current -= damage;
          actionDescription = `ударили молнией на ${damage} урона`;
          if (character.stats.health.current <= 0) {
            actionDescription += ' (кажется, насмерть)';
          }
          break;
        case 'lose_gold':
          const goldItem = character.inventory.find(i => i.id === 'gold');
          if (goldItem && goldItem.quantity > 0) {
            const lostAmount = Math.min(
              goldItem.quantity,
              Math.floor(Math.random() * 50) + 10
            );
            goldItem.quantity -= lostAmount;
            actionDescription = `отобрали ${lostAmount} золота`;
          } else {
            actionDescription = 'попытались отобрать золото, но карманы пусты';
          }
          break;
        case 'curse_weakness':
          const newEffect = {
            id: 'divine_curse',
            name: 'Проклятие слабости',
            description: 'Снижает наносимый урон на 15% на 5 минут.',
            icon: 'CloudRain',
            type: 'debuff' as const,
            expiresAt: Date.now() + 5 * 60 * 1000,
            value: 0.85,
          };
          character.effects = character.effects.filter(e => e.id !== 'divine_strength');
          if (!character.effects.some(e => e.id === newEffect.id)) {
            character.effects.push(newEffect);
          }
          actionDescription = 'наложили проклятие слабости';
          break;
        case 'fatigue':
          character.stats.stamina.current = Math.max(0, character.stats.stamina.current - 50);
          actionDescription = 'наслали внезапную усталость';
          break;
        case 'mana_burn':
          character.stats.magicka.current = 0;
          actionDescription = 'сожгли всю магию';
          break;
      }
    }

    // Generate comedic reaction (fallback)
    let reactionPhrase = '';
    if (type === 'bless') {
      const blessReactions = [
        `${character.name} чувствует приятное тепло. Кажется, божество в хорошем настроении.`,
        `О, с неба посыпались благословения! ${character.name} надеется, что они не фальшивые.`,
        `Внезапное божественное вмешательство! ${character.name} не против.`,
        `Так, я теперь чувствую себя лучше. Главное — не забыть поблагодарить.`,
        `Побочный эффект божественного вмешательства или я просто съел подозрительный гриб?`,
        // Новые (20)
        `Божество явно одобряет мои усилия по украшению пещер скелетами. Спасибо, Шор!`,
        `${character.name} внезапно вспомнил, где оставил тот сладкий рулет. Слава Талосу!`,
        `Теперь я бегаю быстрее, чем крыса из тюрьмы! Божественный спринт активирован.`,
        `Амулет засветился! Или это просто отражение от меда?.. Нет, точно благословение.`,
        `Герой чувствует себя так, будто выпил бочку эля, но без похмелья. Чудо!`,
        `Кажется, даже грязекрабы теперь смотрят на меня с уважением.`,
        `Боги дали мне силу!.. Хотя, возможно, это просто адреналин от того, что я не умер.`,
        `Теперь я могу поднять ещё один ржавый меч. Благодарю за увеличение инвентаря!`,
        `Сердце поёт, как бард после третьей кружки. Даже Олаф бы одобрил.`,
        `Мои штаны перестали протекать! Это точно божественное вмешательство.`,
        `Я чувствую... удачу! Может, сегодня получится украсть рулет и не попасться?`,
        `Божество шепчет: "Ты молодец". ${character.name} решает верить в это.`,
        `Даже дракон бы подумал дважды, увидев меня сейчас. Или нет. Но приятно думать, что да.`,
        `Теперь я вижу сквозь стены!.. Нет, это просто солнце в глаза. Но всё равно спасибо.`,
        `Мои раны заживают! А может, это просто мед? Всё равно — спасибо, небеса!`,
        `Кажется, я стал на 10% менее глупым. Этого хватит, чтобы не упасть в ручей снова.`,
        `Боги даровали мне... уверенность! Теперь я точно не побоюсь спросить у торговца скидку.`,
        `О, мои руки перестали дрожать! (Теперь дрожат только кошельки врагов.)`,
        `Чувствую себя как Исграмор после третьего тоста — непобедимым и слегка пьяным от благодати.`,
        `Даже мой рюкзак стал легче!.. Или боги просто убрали половину хлама? Не буду спрашивать.`
      ];
      reactionPhrase = blessReactions[Math.floor(Math.random() * blessReactions.length)];
    } else {
      const punishReactions = [
        `${character.name} чувствует, как по спине пробежал холодок. Кажется, божество чем-то недовольно.`,
        `Ауч! За что?! Я же почти не воровал на этой неделе!`,
        `Эй, это были мои кровные! Это был мой капитал на сладкие рулеты!`,
        `Чувствую себя так, будто меня покусал злокрыс. Отличное начало дня.`,
        `Боги суровы сегодня. Может, стоило меньше воровать сыр?`,
        // Новые (20)
        `Опять?! Я только что молился!.. Хотя, возможно, молился не тому богу.`,
        `Теперь я выгляжу так, будто меня три дня держали в тюрьме Виндхельма. Спасибо, "справедливость".`,
        `Мои карманы опустели! Даже крысы отказались их трогать после этого.`,
        `Боги решили, что я слишком счастлив. Теперь у меня зуд в носу и плохое предчувствие.`,
        `Кажется, я случайно оскорбил Шора... или просто чихнул в его храме?`,
        `Теперь каждый шаг звучит как "вор! вор!". Спасибо, божественный позор.`,
        `Мои ботинки протекли. Это символизм или просто кара за украденный сыр?`,
        `Даже воронья кость теперь считает меня недостойным. Это низко.`,
        `Я чувствую себя как после того, как украл рулет при свидетелях. Всё потому что... я украл рулет при свидетелях?`,
        `Боги отобрали удачу. Теперь даже мед в бочке кажется кислым.`,
        `Мои волосы стали седыми. От стресса? Или от божественного недовольства?`,
        `Теперь я спотыкаюсь о воздух. Спасибо, небеса, за урок смирения.`,
        `Кажется, я больше не могу смотреть в глаза коровам. Они всё знают.`,
        `Мои руки дрожат! Не от страха... от божественного штрафа за "слишком много взломов".`,
        `Даже призрачная курица отвернулась от меня. Это конец.`,
        `Теперь я слышу, как шепчутся стражники... хотя их даже нет рядом.`,
        `Боги решили, что я слишком богат. Теперь у меня только одна монета. И она фальшивая.`,
        `Мои штаны внезапно стали на два размера меньше. Это точно кара.`,
        `Я чувствую вину. За что? Не знаю. Но чувствую. Спасибо, божественный газлайтинг.`,
        `Теперь, когда я иду по дороге, даже волки обходят меня стороной... с жалостью.`
      ];
      reactionPhrase = punishReactions[Math.floor(Math.random() * punishReactions.length)];
    }

    // Save character's thought about the intervention to adventure log
    const interventionMessage = `🎭 Мысли героя: "${reactionPhrase}"`;
    await addOfflineEvent(character.id, {
      type: 'system',
      message: interventionMessage,
    });

    await storage.saveCharacter(character);
    return { success: true, message: reactionPhrase, character: character };

  } catch (e: any) {
    return { success: false, message: e.message || "Транзакция не удалась. Силы небесные в смятении." };
  }
}

export async function donateToFaction(userId: string, factionId: string, amount: number): Promise<{success: boolean, message: string}> {
  // Use new command handler with real-time events
  try {
    const { donateToFaction: donateCmd } = await import('../../../server/commands/temple-donation');
    const result = await donateCmd(userId, { factionId, amount });
    
    if (!result.success) {
      return { success: false, message: result.error || 'Unknown error' };
    }

    return {
      success: true,
      message: result.data!.message,
    };
  } catch (error: any) {
    console.error('[donateToFaction] Error:', error);
    return { success: false, message: error.message || "Транзакция не удалась. Силы небесные в смятении." };
  }
}

// Legacy implementation
async function donateToFactionLegacy(userId: string, factionId: string, amount: number): Promise<{success: boolean, message: string}> {
  if (!userId) {
    return { success: false, message: "Высшие силы не могут найти вашу душу. Попробуйте войти снова." };
  }
  if (amount <= 0) {
    return { success: false, message: "Пожертвование должно быть больше нуля." };
  }

  try {
    const charData = await storage.getCharacterById(userId);
    if (!charData) {
      throw new Error("Герой не найден в анналах истории.");
    }

    const character: Character = charData as any;
    const gold = character.inventory.find(i => i.id === 'gold');

    if (!gold || gold.quantity < amount) {
      throw new Error(`Недостаточно золота для пожертвования. Нужно: ${amount}, есть: ${gold?.quantity || 0}.`);
    }
    
    let logMessage = '';
    
    const updatedGold = character.inventory.find(i => i.id === 'gold')!;
    updatedGold.quantity -= amount;
    
    if (factionId.startsWith('deity_')) {
      const deityId = factionId.replace('deity_', '');
      if (character.patronDeity === deityId) {
        character.templeProgress = (character.templeProgress || 0) + amount;
        logMessage = `Герой пожертвовал ${amount} золота на постройку храма для своего покровителя.`;
      } else {
        logMessage = `Герой пожертвовал ${amount} золота... но это не его бог-покровитель. Пожертвование потеряно впустую.`;
      }
    } else {
      if (!character.factions) {
        character.factions = {};
      }
      const factionInfo = allFactions.find(f => f.id === factionId);
      if (!factionInfo) throw new Error("Фракция не найдена.");

      if (!character.factions[factionId]) {
        character.factions[factionId] = { reputation: 0 };
      }
      character.factions[factionId]!.reputation += Math.floor(amount / 10);
      logMessage = `Герой пожертвовал ${amount} золота фракции "${factionInfo.name}", улучшив свою репутацию.`;
    }

    await storage.saveCharacter(character);
    // Push realtime tick so UI updates progress bar without manual refresh
    try {
      const pub = getRedis();
      await pub.publish('ws:tick', JSON.stringify({
        realmId: (character as any).realmId || 'global',
        characterId: userId,
        tickAt: Date.now(),
        updatedAt: Date.now(),
        summary: { status: character.status, location: character.location, hp: character.stats?.health?.current },
      }));
    } catch {}
    return { success: true, message: logMessage };

  } catch (e: any) {
    return { success: false, message: e.message || "Транзакция не удалась. Силы небесные в смятении." };
  }
}

export async function suggestTravel(userId: string, destinationId: string): Promise<{success: boolean, message?: string}> {
  if (!userId) {
    return { success: false, message: "Высшие силы не могут найти вашу душу." };
  }

  try {
    const charData = await storage.getCharacterById(userId);
    if (!charData) {
      throw new Error("Герой не найден.");
    }

    const character: Character = charData as any;
    character.divineSuggestion = "Путешествовать";
    character.divineDestinationId = destinationId;

    await storage.saveCharacter(character);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message || "Не удалось внушить мысль о путешествии." };
  }
}
