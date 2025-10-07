
export type SpellType = 'damage' | 'heal' | 'buff' | 'drain' | 'restore';

export interface Spell {
    id: string;
    name: string;
    description: string;
    type: SpellType;
    manaCost: number;
    value: number; // damage amount, healing amount, or buff multiplier
    icon: string;
    duration?: number; // duration in ms for buffs
}
