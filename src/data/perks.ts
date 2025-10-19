
import type { Perk } from '@/types/perk';

export const allPerks: Perk[] = [
    // One Handed
    {
        id: 'oneHanded_armsman_1',
        name: 'Оружейник (1/5)',
        description: 'Одноручное оружие наносит на 20% больше урона.',
        icon: 'Sword',
        skill: 'oneHanded',
        requiredSkillLevel: 20,
    },
    {
        id: 'oneHanded_armsman_2',
        name: 'Оружейник (2/5)',
        description: 'Одноручное оружие наносит на 35% больше урона.',
        icon: 'Sword',
        skill: 'oneHanded',
        requiredSkillLevel: 40,
    },
    {
        id: 'oneHanded_fighting_stance',
        name: 'Боевая стойка',
        description: 'Силовые атаки одноручным оружием тратят на 25% меньше выносливости.',
        icon: 'Shield',
        skill: 'oneHanded',
        requiredSkillLevel: 30,
    },

    // Smithing (Crafting)
    {
        id: 'smithing_steel_smithing',
        name: 'Стальная ковка',
        description: 'Позволяет создавать стальное оружие и броню. Увеличивает шанс успеха ковки.',
        icon: 'Hammer',
        skill: 'oneHanded',
        requiredSkillLevel: 20,
    },
    {
        id: 'smithing_dwarven_smithing',
        name: 'Двемерская ковка',
        description: 'Позволяет создавать двемерское снаряжение. Повышает эффективность перековки.',
        icon: 'Cog',
        skill: 'oneHanded',
        requiredSkillLevel: 30,
    },
    {
        id: 'smithing_orcish_smithing',
        name: 'Орочья ковка',
        description: 'Позволяет создавать орочье снаряжение и улучшать его лучше.',
        icon: 'Axe',
        skill: 'oneHanded',
        requiredSkillLevel: 40,
    },
    {
        id: 'smithing_elven_smithing',
        name: 'Эльфийская ковка',
        description: 'Позволяет создавать эльфийское снаряжение и улучшать его лучше.',
        icon: 'Leaf',
        skill: 'oneHanded',
        requiredSkillLevel: 50,
    },

    // Enchanting (Crafting)
    {
        id: 'enchanting_enchanter_1',
        name: 'Чародей (1/5)',
        description: 'Зачарования на 20% сильнее.',
        icon: 'Sparkles',
        skill: 'alchemy',
        requiredSkillLevel: 20,
    },
    {
        id: 'enchanting_insight',
        name: 'Озарение чародея',
        description: 'Реже портит предмет при зачаровании, повышая шанс успеха.',
        icon: 'Sparkles',
        skill: 'alchemy',
        requiredSkillLevel: 35,
    },

    // Tanning / Leatherworking (map to Light Armor)
    {
        id: 'tanning_basic',
        name: 'Кожевничество',
        description: 'Улучшает создание кожаных полос и простой кожаной брони.',
        icon: 'Scissors',
        skill: 'lightArmor',
        requiredSkillLevel: 20,
    },
    {
        id: 'tanning_master',
        name: 'Мастер кожевничества',
        description: 'Позволяет создавать улучшенные кожаные элементы и усиливает перековку.',
        icon: 'Shield',
        skill: 'lightArmor',
        requiredSkillLevel: 40,
    },

    // Cooking (map to Alchemy)
    {
        id: 'cooking_hearty_meals',
        name: 'Сытные блюда',
        description: 'Приготовленные блюда дают более сильные и долгие эффекты.',
        icon: 'ChefHat',
        skill: 'alchemy',
        requiredSkillLevel: 25,
    },
    {
        id: 'cooking_gourmet',
        name: 'Гурман',
        description: 'Открывает редкие рецепты и повышает шанс успеха готовки.',
        icon: 'Utensils',
        skill: 'alchemy',
        requiredSkillLevel: 40,
    },

    // Smelting (map to Heavy Armor)
    {
        id: 'smelting_efficiency',
        name: 'Эффективная выплавка',
        description: 'Даёт шанс получить +1 слиток при выплавке руды.',
        icon: 'Flame',
        skill: 'heavyArmor',
        requiredSkillLevel: 25,
    },
    {
        id: 'smelting_master',
        name: 'Мастер выплавки',
        description: 'Снижает требования к качеству руды для высоких сплавов.',
        icon: 'Factory',
        skill: 'heavyArmor',
        requiredSkillLevel: 45,
    },

    // Block
    {
        id: 'block_shield_wall_1',
        name: 'Стенобой (1/5)',
        description: 'Блокирование становится на 20% эффективнее.',
        icon: 'ShieldCheck',
        skill: 'block',
        requiredSkillLevel: 20,
    },
    {
        id: 'block_quick_reflexes',
        name: 'Быстрые рефлексы',
        description: 'Врагу сложнее попасть по вам при защите.',
        icon: 'Zap',
        skill: 'block',
        requiredSkillLevel: 40,
    },
    {
        id: 'block_deflect_arrows',
        name: 'Отклонение стрел',
        description: 'Позволяет блокировать урон от стрел щитом.',
        icon: 'Target',
        skill: 'block',
        requiredSkillLevel: 30,
    },

    // Heavy Armor
    {
        id: 'heavyArmor_juggernaut_1',
        name: 'Джаггернаут (1/5)',
        description: 'Увеличивает класс тяжелой брони на 20%.',
        icon: 'UserCheck',
        skill: 'heavyArmor',
        requiredSkillLevel: 20,
    },
    {
        id: 'heavyArmor_conditioning',
        name: 'Выносливость в броне',
        description: 'Защита тратит на 20% меньше выносливости.',
        icon: 'ShieldHalf',
        skill: 'heavyArmor',
        requiredSkillLevel: 40,
    },

    // Light Armor
    {
        id: 'lightArmor_agile_defender_1',
        name: 'Ловкий защитник (1/5)',
        description: 'Увеличивает класс легкой брони на 20%.',
        icon: 'Feather',
        skill: 'lightArmor',
        requiredSkillLevel: 20,
    },
    {
        id: 'lightArmor_windwalker',
        name: 'Странник ветров',
        description: 'Восстановление запаса сил в бою увеличено.',
        icon: 'Wind',
        skill: 'lightArmor',
        requiredSkillLevel: 50,
    },

    // Persuasion
    {
        id: 'persuasion_alluring',
        name: 'Очарование',
        description: 'Скидка 10% у торговцев противоположного пола.',
        icon: 'Heart',
        skill: 'persuasion',
        requiredSkillLevel: 30,
    },

    // Alchemy
    {
        id: 'alchemy_physician',
        name: 'Врач',
        description: 'Зелья, восстанавливающие здоровье, магию или запас сил, на 25% эффективнее.',
        icon: 'HeartPulse',
        skill: 'alchemy',
        requiredSkillLevel: 20,
    },
    {
        id: 'alchemy_benefactor',
        name: 'Благодетель',
        description: 'Зелья с положительными эффектами на 25% сильнее.',
        icon: 'PlusCircle',
        skill: 'alchemy',
        requiredSkillLevel: 30,
    },
    
    // Faction Perks
    {
        id: 'perk_companions_valor',
        name: 'Доблесть Соратника',
        description: 'Когда здоровье падает ниже 50%, вы наносите на 10% больше урона.',
        icon: 'HeartHandshake',
        skill: 'oneHanded',
        requiredSkillLevel: 1, // Requirement is reputation, not skill level
    },
    {
        id: 'perk_mages_attunement',
        name: 'Магическая гармония',
        description: 'Заклинания тратят на 10% меньше магии.',
        icon: 'BrainCircuit',
        skill: 'alchemy', 
        requiredSkillLevel: 1,
    },
    {
        id: 'perk_thieves_shadow',
        name: 'Покров тени',
        description: 'Увеличивает шанс успешного побега из боя.',
        icon: 'Footprints',
        skill: 'lightArmor',
        requiredSkillLevel: 1,
    }
];
