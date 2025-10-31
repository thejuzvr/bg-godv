
import type { CharacterInventoryItem, ItemType } from "./character";
import type { Rarity } from "./item";

export type QuestStatus = "available" | "in-progress" | "completed" | "failed";

export interface QuestRewardItem {
    id: string;
    quantity: number;
}

export interface QuestRandomItemReward {
    rarity: Rarity;
    type: ItemType;
    quantity: number;
}


export interface Quest {
  id: string;
  title: string;
  description: string;
  location: string; // e.g., 'whiterun', 'riften'
  status: QuestStatus;
  type: 'main' | 'side' | 'bounty';
  reward: {
    gold: number;
    xp: number;
    items?: QuestRewardItem[];
    randomItemRewards?: QuestRandomItemReward[];
  };
  requiredLevel: number;
  duration: number; // Duration in minutes
  narrative: string; // Text to display during the quest
  targetEnemyId?: string; // For bounty quests, the ID of the target enemy
  combatChance?: number; // For side quests, a 0-1 chance of a combat encounter
  requiredFaction?: {
    id: string;
    reputation: number;
  };
}
