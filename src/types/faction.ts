
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

export interface FactionBonus {
    type: 'discount' | 'ability' | 'access';
    name: string;
    description: string;
    value?: number; // For discounts (0-100%)
    requiredRank: number; // Minimum reputation level
}

export interface FactionShopItem {
    itemId: string;
    requiredRank: number; // Minimum reputation to purchase
    priceModifier?: number; // Price multiplier (e.g., 0.8 for 20% discount)
}

export interface FactionInfo {
    id: string;
    name: string;
    description: string;
    joinRestrictions?: string[];
    reputationTiers: ReputationTier[];
    passiveBonuses?: FactionBonus[];
    shopItems?: FactionShopItem[];
}
