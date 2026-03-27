/**
 * Divine Reactions - Godville-style hero responses to divine messages
 * These are categorized by hero's current situation and mood
 */

export interface DivineReaction {
  /** Introduction/attribution to divine source */
  attribution: string;
  /** Hero's reaction/comment */
  reaction: string;
}

/**
 * Generic reactions for any situation
 */
export const genericReactions: DivineReaction[] = [
  {
    attribution: "Белка, скачущая по ясеню, пропищала",
    reaction: "Герой почесал затылок и решил, что это знак свыше."
  },
  {
    attribution: "Ворон каркнул прямо в ухо",
    reaction: "Герой вздрогнул, но решил прислушаться к совету."
  },
  {
    attribution: "Облака на небе сложились в слова",
    reaction: "Герой прищурился и кивнул: «Понял, понял...»"
  },
  {
    attribution: "Из таверны донеслось пьяное бормотание",
    reaction: "Странно, но герой уловил в этом божественный смысл."
  },
  {
    attribution: "Ветер прошелестел в кронах деревьев",
    reaction: "Герой остановился, будто услышал важное послание."
  },
  {
    attribution: "Пролетающая птица нагадила на плечо",
    reaction: "Герой воспринял это как божественный знак... наверное."
  },
  {
    attribution: "Придорожный камень вдруг показался говорящим",
    reaction: "Герой на всякий случай записал это в блокнот."
  },
  {
    attribution: "Эхо в горах донесло",
    reaction: "Герой кивнул эху в знак понимания."
  },
  {
    attribution: "Кот, пробегавший мимо, мяукнул",
    reaction: "Герой почему-то понял, что это значит."
  },
  {
    attribution: "Луч солнца пробился сквозь тучи",
    reaction: "Герой воспринял это как одобрение свыше."
  },
  {
    attribution: "Древний дух материализовался на мгновение и прошептал",
    reaction: "Герой едва не подпрыгнул от неожиданности, но внял совету."
  },
  {
    attribution: "Надпись на стене таверны гласила",
    reaction: "Герой задумался: «А ведь это про меня!»"
  },
  {
    attribution: "Пьяный бард пропел в песне",
    reaction: "Герой подумал, что совпадений не бывает."
  },
  {
    attribution: "Огонь в костре вспыхнул ярче и как бы произнёс",
    reaction: "Герой кивнул пламени и почесал подбородок."
  },
  {
    attribution: "Старуха на рынке буркнула себе под нос",
    reaction: "Герой уверен — это был знак."
  },
];

/**
 * Sarcastic/skeptical reactions
 */
export const sarcasticReactions: DivineReaction[] = [
  {
    attribution: "Голос с небес прогремел",
    reaction: "Герой закатил глаза: «Да-да, я уже иду!»"
  },
  {
    attribution: "Божественный луч света указал направление",
    reaction: "Герой проворчал: «Ага, сейчас брошу всё и побегу...»"
  },
  {
    attribution: "Ангел прошептал на ухо",
    reaction: "Герой хмыкнул: «Если это божественный план, то он очень... творческий.»"
  },
  {
    attribution: "Святое знамение явилось в облаках",
    reaction: "Герой вздохнул: «Заметил знак. Сделаю вид, что это был мой план.»"
  },
  {
    attribution: "Мистический голос изрёк",
    reaction: "«Слушаю и повинуюсь. Но сначала — сладкий рулет», — пробормотал герой."
  },
];

/**
 * Confused reactions
 */
export const confusedReactions: DivineReaction[] = [
  {
    attribution: "Непонятный шёпот донёсся откуда-то сверху",
    reaction: "Герой почесал голову: «Что-что?»"
  },
  {
    attribution: "Загадочное послание проявилось в луже",
    reaction: "Герой наклонился пониже, но так и не понял."
  },
  {
    attribution: "Таинственный знак мелькнул в тумане",
    reaction: "Герой прищурился, но разобрать не смог. Сделал вид, что понял."
  },
];

/**
 * Enthusiastic reactions (when mood is high)
 */
export const enthusiasticReactions: DivineReaction[] = [
  {
    attribution: "Божественный свет озарил путь",
    reaction: "Герой воодушевлённо кивнул: «Вот это я понимаю!»"
  },
  {
    attribution: "Небесный хор пропел",
    reaction: "Герой улыбнулся и воскликнул: «Отличная идея!»"
  },
  {
    attribution: "Святой дух снизошёл",
    reaction: "Герой с энтузиазмом вскинул кулак: «Так и сделаю!»"
  },
  {
    attribution: "Золотые письмена вспыхнули в воздухе",
    reaction: "Герой потёр руки: «Вот теперь дело пошло!»"
  },
];

/**
 * Tired/grumpy reactions (when fatigue is high)
 */
export const tiredReactions: DivineReaction[] = [
  {
    attribution: "Голос свыше произнёс",
    reaction: "Герой зевнул: «Угу, потом... Сначала отдохну.»"
  },
  {
    attribution: "Божественное знамение указало путь",
    reaction: "Герой тяжело вздохнул: «Дайте хотя бы вздремнуть...»"
  },
  {
    attribution: "Священный символ проявился в небе",
    reaction: "«Видел-видел. Ноги болят», — проворчал герой."
  },
];

/**
 * Combat-related reactions
 */
export const combatReactions: DivineReaction[] = [
  {
    attribution: "Боевой клич эхом прокатился по полю битвы",
    reaction: "Герой сжал оружие крепче: «За победу!»"
  },
  {
    attribution: "Дух предков шепнул тактический совет",
    reaction: "Герой кивнул и приготовился к атаке."
  },
  {
    attribution: "Валькирия пролетела над головой, крикнув",
    reaction: "Герой воодушевился и с новой силой ринулся в бой."
  },
];

/**
 * Select appropriate reaction based on character state
 */
export function selectDivineReaction(character: {
  mood: number;
  status: string;
  stats: { fatigue: { current: number; max: number } };
}): DivineReaction {
  const fatigueRatio = character.stats.fatigue.current / character.stats.fatigue.max;
  const isInCombat = character.status === 'in-combat';
  const mood = character.mood;

  // Combat reactions
  if (isInCombat && Math.random() < 0.4) {
    return combatReactions[Math.floor(Math.random() * combatReactions.length)];
  }

  // Tired reactions (high fatigue)
  if (fatigueRatio > 0.7 && Math.random() < 0.5) {
    return tiredReactions[Math.floor(Math.random() * tiredReactions.length)];
  }

  // Enthusiastic reactions (high mood)
  if (mood > 70 && Math.random() < 0.3) {
    return enthusiasticReactions[Math.floor(Math.random() * enthusiasticReactions.length)];
  }

  // Sarcastic reactions (low mood)
  if (mood < 30 && Math.random() < 0.4) {
    return sarcasticReactions[Math.floor(Math.random() * sarcasticReactions.length)];
  }

  // Confused reactions (random)
  if (Math.random() < 0.1) {
    return confusedReactions[Math.floor(Math.random() * confusedReactions.length)];
  }

  // Default: generic reactions
  return genericReactions[Math.floor(Math.random() * genericReactions.length)];
}

