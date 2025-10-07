"use server";

import { initialQuests } from "@/data/quests";
import { initialSovngardeQuests } from "@/data/sovngarde";
import { initialEvents } from "@/data/events";
import { initialCityEvents } from "@/data/cityEvents";

import type { Quest } from "@/types/quest";
import type { Location } from "@/types/location";
import type { Enemy } from "@/types/enemy";
import type { CharacterInventoryItem } from "@/types/character";
import type { SovngardeQuest } from "@/types/sovngarde";
import type { NPC } from "@/types/npc";
import type { GameEvent, CityEvent } from "@/types/event";

import { gameDataService } from '../../server/game-data-service';

export type BaseItem = Omit<CharacterInventoryItem, 'quantity'>;

export interface GameData {
    quests: Quest[];
    locations: Location[];
    enemies: Enemy[];
    items: BaseItem[];
    sovngardeQuests: SovngardeQuest[];
    npcs: NPC[];
    events: GameEvent[];
    cityEvents: CityEvent[];
}

export async function fetchGameData(): Promise<GameData> {
    // Locations, items, NPCs, and enemies loaded from PostgreSQL
    // Other game data still loaded from static files
    const [locations, items, npcs, enemies] = await Promise.all([
        gameDataService.getAllLocations(),
        gameDataService.getAllItems(),
        gameDataService.getAllNpcs(),
        gameDataService.getAllEnemies(),
    ]);

    return {
        quests: initialQuests,
        locations,
        enemies,
        items: items as BaseItem[],
        sovngardeQuests: initialSovngardeQuests,
        npcs,
        events: initialEvents,
        cityEvents: initialCityEvents,
    };
}
