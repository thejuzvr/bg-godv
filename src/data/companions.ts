/**
 * Companion Templates and Data
 */

import type { CompanionTemplate, CompanionAbility } from '@/types/companion';

// Common abilities
export const companionAbilities: Record<string, CompanionAbility> = {
  // Warrior abilities
  shield_wall: {
    id: 'shield_wall',
    name: 'Стена Щитов',
    description: 'Компаньон принимает часть урона на себя',
    type: 'combat',
    cooldown: 3 * 60 * 1000, // 3 minutes
    effect: {
      defenseBonus: 5,
      buffDuration: 60 * 1000, // 1 minute
    },
  },
  berserker_rage: {
    id: 'berserker_rage',
    name: 'Ярость Берсерка',
    description: 'Компаньон наносит дополнительный урон',
    type: 'combat',
    cooldown: 5 * 60 * 1000,
    effect: {
      damageBonus: 10,
      buffDuration: 45 * 1000,
    },
  },
  
  // Mage abilities
  arcane_shield: {
    id: 'arcane_shield',
    name: 'Магический Щит',
    description: 'Создаёт защитный барьер',
    type: 'support',
    cooldown: 4 * 60 * 1000,
    effect: {
      defenseBonus: 8,
      buffDuration: 90 * 1000,
    },
  },
  healing_aura: {
    id: 'healing_aura',
    name: 'Аура Исцеления',
    description: 'Постепенно восстанавливает здоровье героя',
    type: 'support',
    cooldown: 10 * 60 * 1000,
    effect: {
      healAmount: 30,
      buffDuration: 120 * 1000,
    },
  },
  
  // Rogue abilities
  sneak_attack: {
    id: 'sneak_attack',
    name: 'Скрытая Атака',
    description: 'Наносит внезапный критический удар',
    type: 'combat',
    cooldown: 4 * 60 * 1000,
    effect: {
      damageBonus: 15,
    },
  },
  lockpicking: {
    id: 'lockpicking',
    name: 'Взлом Замков',
    description: 'Помогает находить дополнительные сокровища',
    type: 'passive',
    effect: {},
  },
  
  // Ranger abilities
  hunters_mark: {
    id: 'hunters_mark',
    name: 'Метка Охотника',
    description: 'Увеличивает урон по помеченной цели',
    type: 'combat',
    cooldown: 3 * 60 * 1000,
    effect: {
      damageBonus: 8,
      buffDuration: 60 * 1000,
    },
  },
  survival_expert: {
    id: 'survival_expert',
    name: 'Эксперт по Выживанию',
    description: 'Снижает усталость во время путешествий',
    type: 'passive',
    effect: {},
  },
  
  // Healer abilities
  greater_heal: {
    id: 'greater_heal',
    name: 'Сильное Исцеление',
    description: 'Восстанавливает много здоровья',
    type: 'support',
    cooldown: 8 * 60 * 1000,
    effect: {
      healAmount: 50,
    },
  },
  blessing: {
    id: 'blessing',
    name: 'Благословение',
    description: 'Повышает эффективность героя',
    type: 'support',
    cooldown: 15 * 60 * 1000,
    effect: {
      damageBonus: 5,
      defenseBonus: 5,
      buffDuration: 180 * 1000,
    },
  },
};

export const companionTemplates: CompanionTemplate[] = [
  {
    id: 'warrior_common',
    namePool: ['Рогнар', 'Ульрик', 'Торвальд', 'Бьорн', 'Харальд'],
    class: 'warrior',
    rarity: 'common',
    baseStats: {
      health: { current: 80, max: 80 },
      damage: 8,
      defense: 5,
    },
    baseSkills: {
      combat: 60,
      survival: 40,
      magic: 10,
      social: 30,
    },
    availableAbilities: [companionAbilities.shield_wall],
    personalityRange: {
      brave: [40, 80],
      friendly: [20, 60],
      greedy: [-20, 40],
    },
    upkeepCost: 20,
    foodConsumption: 2,
    bio: 'Опытный воин, готовый сражаться за золото и славу.',
    dialogueTemplates: {
      onRecruit: [
        'Ты платишь — я сражаюсь. Всё просто.',
        'Надеюсь, ты не трус. Мне нужна настоящая битва.',
      ],
      onCombatWin: [
        'Ха! Они даже не успели понять, что произошло!',
        'Лёгкая победа. Где следующие?',
      ],
      onCombatLoss: [
        'Это был... позорный провал.',
        'Нужно бежать, пока живы!',
      ],
      onLowMood: [
        'Давно не было хорошего боя...',
        'Эта работа становится скучной.',
      ],
      onHighMood: [
        'Вот это я понимаю — приключение!',
        'С тобой не соскучишься!',
      ],
      onLeaving: [
        'Всё, я ухожу. Этого золота мне мало.',
        'Прощай. Мне нужны настоящие битвы.',
      ],
    },
    availableAt: ['whiterun', 'windhelm', 'riften'],
    recruitCost: 100,
  },
  
  {
    id: 'mage_uncommon',
    namePool: ['Фаральда', 'Колетта', 'Дрейвис', 'Фаренгар'],
    class: 'mage',
    rarity: 'uncommon',
    baseStats: {
      health: { current: 50, max: 50 },
      damage: 12,
      defense: 2,
    },
    baseSkills: {
      combat: 40,
      survival: 20,
      magic: 80,
      social: 50,
    },
    availableAbilities: [companionAbilities.arcane_shield, companionAbilities.healing_aura],
    personalityRange: {
      brave: [-10, 30],
      friendly: [40, 80],
      greedy: [-40, 20],
    },
    upkeepCost: 35,
    foodConsumption: 1,
    bio: 'Образованный маг, ищущий новые знания и артефакты.',
    dialogueTemplates: {
      onRecruit: [
        'Магия — это искусство. Я помогу тебе понять это.',
        'Твои приключения кажутся... интригующими.',
      ],
      onCombatWin: [
        'Магия торжествует, как всегда.',
        'Элементарно, мой друг.',
      ],
      onCombatLoss: [
        'Нужно отступить и перегруппироваться!',
        'Это было... неожиданно.',
      ],
      onLowMood: [
        'Мне не хватает времени на исследования...',
        'Это путешествие утомляет.',
      ],
      onHighMood: [
        'Какое восхитительное приключение!',
        'Я узнаю столько нового!',
      ],
      onLeaving: [
        'Моя работа здесь окончена.',
        'Мне пора вернуться к учёбе.',
      ],
    },
    availableAt: ['winterhold', 'solitude'],
    recruitCost: 200,
  },
  
  {
    id: 'rogue_rare',
    namePool: ['Векс', 'Бриньольф', 'Сапфир', 'Делвин'],
    class: 'rogue',
    rarity: 'rare',
    baseStats: {
      health: { current: 60, max: 60 },
      damage: 15,
      defense: 3,
    },
    baseSkills: {
      combat: 70,
      survival: 60,
      magic: 20,
      social: 70,
    },
    availableAbilities: [companionAbilities.sneak_attack, companionAbilities.lockpicking],
    personalityRange: {
      brave: [20, 60],
      friendly: [-20, 40],
      greedy: [40, 80],
    },
    upkeepCost: 50,
    foodConsumption: 1,
    bio: 'Ловкий вор с сомнительным прошлым, но полезными навыками.',
    dialogueTemplates: {
      onRecruit: [
        'Ты платишь хорошо. Я работаю хорошо.',
        'Надеюсь, ты готов к... нестандартным методам.',
      ],
      onCombatWin: [
        'Даже не вспотел.',
        'Слишком легко. Где настоящая добыча?',
      ],
      onCombatLoss: [
        'Пора сваливать!',
        'Это было близко...',
      ],
      onLowMood: [
        'Где обещанное золото?',
        'Мне скучно.',
      ],
      onHighMood: [
        'Вот это я понимаю — дело!',
        'Неплохая добыча!',
      ],
      onLeaving: [
        'Извини, но есть дела поприбыльнее.',
        'Мне пора скрываться.',
      ],
    },
    availableAt: ['riften'],
    recruitCost: 350,
  },
];

/**
 * Generate a random companion from a template
 */
export function generateCompanionFromTemplate(template: CompanionTemplate): any {
  const name = template.namePool[Math.floor(Math.random() * template.namePool.length)];
  
  const personality = {
    brave: Math.floor(Math.random() * (template.personalityRange.brave[1] - template.personalityRange.brave[0]) + template.personalityRange.brave[0]),
    friendly: Math.floor(Math.random() * (template.personalityRange.friendly[1] - template.personalityRange.friendly[0]) + template.personalityRange.friendly[0]),
    greedy: Math.floor(Math.random() * (template.personalityRange.greedy[1] - template.personalityRange.greedy[0]) + template.personalityRange.greedy[0]),
    loyal: 50, // Starts at neutral
  };
  
  const onRecruitDialogue = template.dialogueTemplates.onRecruit[Math.floor(Math.random() * template.dialogueTemplates.onRecruit.length)];
  
  return {
    id: `${template.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name,
    class: template.class,
    rarity: template.rarity,
    level: 1,
    stats: { ...template.baseStats },
    skills: { ...template.baseSkills },
    personality,
    abilities: [...template.availableAbilities],
    loyalty: 50,
    mood: 60,
    upkeepCost: template.upkeepCost,
    foodConsumption: template.foodConsumption,
    lastFed: Date.now(),
    lastPaid: Date.now(),
    acquiredAt: Date.now(),
    acquiredLocation: '', // Set by caller
    isActive: false,
    isInjured: false,
    bio: template.bio,
    dialogues: {
      onRecruit: onRecruitDialogue,
      onCombatWin: [...template.dialogueTemplates.onCombatWin],
      onCombatLoss: [...template.dialogueTemplates.onCombatLoss],
      onLowMood: [...template.dialogueTemplates.onLowMood],
      onHighMood: [...template.dialogueTemplates.onHighMood],
      onLeaving: template.dialogueTemplates.onLeaving[Math.floor(Math.random() * template.dialogueTemplates.onLeaving.length)],
    },
  };
}

