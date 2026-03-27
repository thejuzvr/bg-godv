
export type GameEventType = 'combat' | 'item' | 'npc' | 'narrative';

export interface GameEvent {
    id: string;
    type: GameEventType;
    description: string; // "You meet a traveling merchant on the road."
    chance: number; // 0-1 chance to occur on a travel leg
    seasons?: ('Summer' | 'Autumn' | 'Winter' | 'Spring')[]; // Optional seasons when this can happen
    
    // Specific data based on type
    enemyId?: string;
    itemId?: string;
    itemQuantity?: number;
    npcId?: string;
}

export interface CityEvent {
    id: string;
    description: string; // Narrative description of the event
    locationIds?: string[]; // If not provided, can happen in any city
}
