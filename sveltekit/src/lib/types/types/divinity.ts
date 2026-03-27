
import type { Character, ActiveEffect } from './character';
import type { BaseItem } from '@/data/items';

export type DivinityId = 
    | 'akatosh' 
    | 'arkay' 
    | 'dibella' 
    | 'julianos' 
    | 'kynareth' 
    | 'mara' 
    | 'stendarr' 
    | 'talos' 
    | 'zenithar';

export interface DivinityGrace {
    id: string; // e.g. grace_akatosh
    name: string; // e.g. "Милость Акатоша"
    description: string;
    apply: (character: Character) => Character;
}

export interface DivinityFinalReward {
    permanentEffect: {
        id: string;
        name: string;
        description: string;
        icon: string;
    };
    artifact: BaseItem;
}

export interface Divinity {
    id: DivinityId;
    name: string;
    description: string;
    domain: string;
    icon: string; // Lucide icon name
    passiveEffect: {
        description: string;
        apply: (character: Character) => Character;
    };
    grace: DivinityGrace;
    finalReward: DivinityFinalReward;
}
