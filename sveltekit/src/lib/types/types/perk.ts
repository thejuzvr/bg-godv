
import type { CharacterSkills } from './character';

export type PerkCategory = 'combat' | 'crafting' | 'magic' | 'social';

export interface Perk {
    id: string;
    name: string;
    description: string;
    icon: string; // lucide icon name
    category: PerkCategory; // Категория перка
    skill: keyof CharacterSkills; // The skill this perk belongs to
    requiredSkillLevel: number;
    maxRank?: number; // Максимальный уровень перка (например, 5 для "Оружейник 1/5")
    currentRank?: number; // Текущий уровень (для отображения)
    nextRankRequirement?: string; // Описание требований для следующего уровня
}
