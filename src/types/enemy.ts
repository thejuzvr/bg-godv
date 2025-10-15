

export interface LootEntry {
    id: string;
    quantity: number;
    chance: number; // 0 to 1
}

export interface LootTable {
    common: LootEntry[];
    uncommon: LootEntry[];
    rare: LootEntry[];
    legendary: LootEntry[];
    goldChance: number; // 0 to 1
    goldMin: number;
    goldMax: number;
}

export interface Enemy {
    id: string;
    name: string;
    health: number; // base health
    damage: number; // base damage
    xp: number;     // base xp
    minLevel?: number; // Minimum hero level to encounter this enemy
    isUnique?: boolean; // For quest bosses
    level?: number;
    armor?: number; // Armor class for defense rolls
    guaranteedDrop?: { id: string, quantity: number }[];
    lootTable?: LootTable; // New loot system
    appliesEffect?: {
        id:string;
        name: string;
        description: string;
        icon: string; // lucide-react icon name
        type: 'debuff';
        chance: number; // 0 to 1
        duration: number; // in milliseconds
        value?: number; // e.g., damage per tick for poison
    };
}
