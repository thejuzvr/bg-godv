
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
        id: 'oneHanded_fighting_stance',
        name: 'Боевая стойка',
        description: 'Силовые атаки одноручным оружием тратят на 25% меньше выносливости.',
        icon: 'Shield',
        skill: 'oneHanded',
        requiredSkillLevel: 30,
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

    // Light Armor
    {
        id: 'lightArmor_agile_defender_1',
        name: 'Ловкий защитник (1/5)',
        description: 'Увеличивает класс легкой брони на 20%.',
        icon: 'Feather',
        skill: 'lightArmor',
        requiredSkillLevel: 20,
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
