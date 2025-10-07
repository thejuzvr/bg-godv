
export interface FactionReward {
    type: 'item' | 'perk' | 'title';
    id: string; // item id or perk id, or just a descriptive id for titles
    name: string;
    description: string;
    icon: string; // Lucide icon name
}

export interface ReputationTier {
    level: number;
    title: string;
    rewards: FactionReward[];
}

export interface FactionInfo {
    id: string;
    name: string;
    description: string;
    joinRestrictions?: string[];
    reputationTiers: ReputationTier[];
}
