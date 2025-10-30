

export interface NPC {
    id: string;
    name: string;
    description: string;
    location: string; // The location where they are usually found, or 'on_road' for travelers
    dialogue: string[]; // Simple dialogue options
    inventory?: Array<{
        itemId: string;
        stock: number; // Use Infinity for unlimited stock
        priceModifier?: number; // e.g., 1.2 for 20% markup, 0.8 for 20% discount
    }>;
    isCompanion?: boolean;
    hireCost?: number; // Cost in gold to hire
    factionId?: string; // Faction requirement to hire
    companionDetails?: {
        combatStyle: 'Воин (ближний бой)' | 'Лучник (дальний бой)' | 'Маг (заклинания)';
        primarySkill: string; // e.g. "Одноручное оружие"
    };
    // Optional teaching capabilities
    teaches?: Array<{
        skill: 'oneHanded' | 'block' | 'heavyArmor' | 'lightArmor' | 'persuasion' | 'alchemy';
        price: number; // base price per lesson
    }>;
}
