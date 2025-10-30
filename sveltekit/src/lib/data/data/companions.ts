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
  // === COMMON COMPANIONS ===
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
    id: 'ranger_common',
    namePool: ['Аэла', 'Зорья', 'Йенссен', 'Кай'],
    class: 'ranger',
    rarity: 'common',
    baseStats: {
      health: { current: 70, max: 70 },
      damage: 10,
      defense: 3,
    },
    baseSkills: {
      combat: 55,
      survival: 70,
      magic: 15,
      social: 35,
    },
    availableAbilities: [companionAbilities.hunters_mark],
    personalityRange: {
      brave: [30, 70],
      friendly: [20, 60],
      greedy: [-30, 30],
    },
    upkeepCost: 18,
    foodConsumption: 1,
    bio: 'Опытный охотник и следопыт, знающий дикую природу.',
    dialogueTemplates: {
      onRecruit: [
        'Природа - мой дом. Я научу тебя выживать.',
        'Хорошо. Но мы идём моим маршрутом.',
      ],
      onCombatWin: [
        'Охота удалась.',
        'Природа на нашей стороне.',
      ],
      onCombatLoss: [
        'Отступаем в лес!',
        'Мы недооценили их.',
      ],
      onLowMood: [
        'Слишком много времени в городе...',
        'Я скучаю по лесу.',
      ],
      onHighMood: [
        'Отличная погода для приключений!',
        'Наконец-то на свежем воздухе!',
      ],
      onLeaving: [
        'Мне пора вернуться в лес.',
        'Городская жизнь - не для меня.',
      ],
    },
    availableAt: ['whiterun', 'falkreath', 'riverwood'],
    recruitCost: 90,
  },

  // === UNCOMMON COMPANIONS ===
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
    id: 'healer_uncommon',
    namePool: ['Дайна', 'Эранда', 'Флоренций', 'Арктур'],
    class: 'healer',
    rarity: 'uncommon',
    baseStats: {
      health: { current: 55, max: 55 },
      damage: 6,
      defense: 4,
    },
    baseSkills: {
      combat: 30,
      survival: 40,
      magic: 75,
      social: 60,
    },
    availableAbilities: [companionAbilities.greater_heal, companionAbilities.blessing],
    personalityRange: {
      brave: [10, 50],
      friendly: [60, 100],
      greedy: [-60, -10],
    },
    upkeepCost: 30,
    foodConsumption: 1,
    bio: 'Преданный целитель, спасающий жизни там, где другие опускают руки.',
    dialogueTemplates: {
      onRecruit: [
        'Я помогу тебе остаться в живых.',
        'Не дай себе умереть - я буду очень расстроен.',
      ],
      onCombatWin: [
        'Благодарение Божествам, все живы.',
        'Никаких серьезных ранений. Хорошо.',
      ],
      onCombatLoss: [
        'Берегите себя! Отступаем!',
        'Мне нужно время, чтобы всех исцелить!',
      ],
      onLowMood: [
        'Так много ранений...',
        'Я устал от всей этой боли.',
      ],
      onHighMood: [
        'Приятно видеть всех здоровыми!',
        'Сегодня хороший день!',
      ],
      onLeaving: [
        'Мне нужно вернуться в храм.',
        'Другие нуждаются в моей помощи.',
      ],
    },
    availableAt: ['whiterun', 'solitude', 'markarth'],
    recruitCost: 180,
  },

  {
    id: 'warrior_berserker',
    namePool: ['Фарнир', 'Гролод', 'Ингунн', 'Волунд'],
    class: 'warrior',
    rarity: 'uncommon',
    baseStats: {
      health: { current: 95, max: 95 },
      damage: 12,
      defense: 4,
    },
    baseSkills: {
      combat: 75,
      survival: 50,
      magic: 5,
      social: 25,
    },
    availableAbilities: [companionAbilities.berserker_rage, companionAbilities.shield_wall],
    personalityRange: {
      brave: [70, 100],
      friendly: [10, 50],
      greedy: [0, 50],
    },
    upkeepCost: 40,
    foodConsumption: 3,
    bio: 'Свирепый берсерк, чья ярость в бою не знает границ.',
    dialogueTemplates: {
      onRecruit: [
        'КРОВЬ И СЛАВА!',
        'Наконец-то достойный противник!',
      ],
      onCombatWin: [
        'ЭТО БЫЛО ВЕЛИКОЛЕПНО!',
        'Где ещё враги?!',
      ],
      onCombatLoss: [
        'НЕТ! Я ещё могу драться!',
        'Проклятье!',
      ],
      onLowMood: [
        'Мне нужна битва...',
        'Где враги?',
      ],
      onHighMood: [
        'ХА-ХА! ВПЕРЕД К СЛАВЕ!',
        'Кровь кипит!',
      ],
      onLeaving: [
        'Прощай. Битвы зовут.',
        'Мне нужны достойные противники.',
      ],
    },
    availableAt: ['windhelm', 'riften'],
    recruitCost: 250,
  },

  // === RARE COMPANIONS ===
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

  {
    id: 'mage_battlemage',
    namePool: ['Сибилла', 'Арондил', 'Вирания', 'Орнольф'],
    class: 'mage',
    rarity: 'rare',
    baseStats: {
      health: { current: 70, max: 70 },
      damage: 18,
      defense: 5,
    },
    baseSkills: {
      combat: 65,
      survival: 30,
      magic: 85,
      social: 45,
    },
    availableAbilities: [companionAbilities.arcane_shield, companionAbilities.healing_aura],
    personalityRange: {
      brave: [40, 80],
      friendly: [20, 60],
      greedy: [-20, 40],
    },
    upkeepCost: 60,
    foodConsumption: 1,
    bio: 'Боевой маг, сочетающий магию разрушения с защитными заклинаниями.',
    dialogueTemplates: {
      onRecruit: [
        'Магия и сталь - идеальное сочетание.',
        'Посмотрим, достоин ли ты моих услуг.',
      ],
      onCombatWin: [
        'Огонь и молнии - вот моё оружие.',
        'Впечатляющая работа.',
      ],
      onCombatLoss: [
        'Отступаем! Нужно восстановить ману!',
        'Это было... унизительно.',
      ],
      onLowMood: [
        'Моя магия требует отдыха...',
        'Эта рутина утомляет.',
      ],
      onHighMood: [
        'Чувствую силу Магов Коллегии!',
        'Отличное приключение!',
      ],
      onLeaving: [
        'Мне нужно вернуться к исследованиям.',
        'Прощай. Было... познавательно.',
      ],
    },
    availableAt: ['winterhold'],
    recruitCost: 450,
  },

  {
    id: 'ranger_tracker',
    namePool: ['Анги', 'Торим', 'Скьор', 'Эрлинг'],
    class: 'ranger',
    rarity: 'rare',
    baseStats: {
      health: { current: 75, max: 75 },
      damage: 16,
      defense: 4,
    },
    baseSkills: {
      combat: 75,
      survival: 85,
      magic: 20,
      social: 40,
    },
    availableAbilities: [companionAbilities.hunters_mark, companionAbilities.survival_expert],
    personalityRange: {
      brave: [50, 90],
      friendly: [10, 50],
      greedy: [-40, 20],
    },
    upkeepCost: 45,
    foodConsumption: 1,
    bio: 'Легендарный следопыт, способный выследить любую цель.',
    dialogueTemplates: {
      onRecruit: [
        'Я выслежу кого угодно. За правильную цену.',
        'Дикие земли - мой дом.',
      ],
      onCombatWin: [
        'Цель поражена.',
        'Как на охоте.',
      ],
      onCombatLoss: [
        'Отступаем в лес!',
        'Нужно сменить позицию!',
      ],
      onLowMood: [
        'Слишком много народа вокруг...',
        'Город душит меня.',
      ],
      onHighMood: [
        'Отличный день для охоты!',
        'Ветер благоприятный.',
      ],
      onLeaving: [
        'Дикая природа зовёт.',
        'Пора в одиночку.',
      ],
    },
    availableAt: ['falkreath', 'morthal'],
    recruitCost: 400,
  },

  // === LEGENDARY COMPANIONS ===
  {
    id: 'warrior_legendary',
    namePool: ['Вилькас', 'Фаркас', 'Атис', 'Нъяда'],
    class: 'warrior',
    rarity: 'legendary',
    baseStats: {
      health: { current: 120, max: 120 },
      damage: 20,
      defense: 10,
    },
    baseSkills: {
      combat: 95,
      survival: 70,
      magic: 15,
      social: 50,
    },
    availableAbilities: [companionAbilities.shield_wall, companionAbilities.berserker_rage],
    personalityRange: {
      brave: [80, 100],
      friendly: [30, 70],
      greedy: [-10, 50],
    },
    upkeepCost: 100,
    foodConsumption: 3,
    bio: 'Легендарный воин, чьё имя известно по всему Скайриму.',
    dialogueTemplates: {
      onRecruit: [
        'Ты заслужил моё уважение. Пойдём вместе.',
        'Настоящий воин знает, когда нужна помощь.',
      ],
      onCombatWin: [
        'Достойная битва!',
        'Наши враги пали!',
      ],
      onCombatLoss: [
        'Это был достойный противник...',
        'Мы вернемся сильнее!',
      ],
      onLowMood: [
        'Нужны достойные вызовы...',
        'Слишком легко.',
      ],
      onHighMood: [
        'Вот это настоящая битва!',
        'Слава нас ждёт!',
      ],
      onLeaving: [
        'Мой путь лежит в другом направлении.',
        'Береги себя, друг.',
      ],
    },
    availableAt: ['whiterun'],
    recruitCost: 800,
  },

  {
    id: 'mage_legendary',
    namePool: ['Саворак', 'Мирабелла', 'Серана', 'Телдрин'],
    class: 'mage',
    rarity: 'legendary',
    baseStats: {
      health: { current: 80, max: 80 },
      damage: 25,
      defense: 6,
    },
    baseSkills: {
      combat: 70,
      survival: 40,
      magic: 100,
      social: 65,
    },
    availableAbilities: [companionAbilities.arcane_shield, companionAbilities.healing_aura],
    personalityRange: {
      brave: [40, 80],
      friendly: [40, 80],
      greedy: [-50, 30],
    },
    upkeepCost: 120,
    foodConsumption: 1,
    bio: 'Архимаг с невероятной властью над магией, редкий и бесценный союзник.',
    dialogueTemplates: {
      onRecruit: [
        'Твоё дело заинтересовало меня.',
        'Магия объединяет нас.',
      ],
      onCombatWin: [
        'Элементы повинуются мне.',
        'Их магия была слабой.',
      ],
      onCombatLoss: [
        'Даже мои силы имеют пределы...',
        'Нужно отступить и восстановиться.',
      ],
      onLowMood: [
        'Мои исследования требуют внимания...',
        'Это отвлекает от важных дел.',
      ],
      onHighMood: [
        'Какое увлекательное путешествие!',
        'Магия процветает в приключениях!',
      ],
      onLeaving: [
        'Мой долг зовёт меня обратно.',
        'Было честью. Прощай.',
      ],
    },
    availableAt: ['winterhold', 'solitude'],
    recruitCost: 1000,
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

