
import type { CharacterSkills } from './character';

export interface Perk {
    id: string;
    name: string;
    description: string;
    icon: string; // lucide icon name
    skill: keyof CharacterSkills; // The skill this perk belongs to
    requiredSkillLevel: number;
}
