import type { GameEvent } from "@/types/event";

/**
 * Events that can occur during travel to undiscovered locations
 * These have higher danger and encounter rates
 */
export const travelEncounterEvents: GameEvent[] = [
    {
        id: 'travel_encounter_bandits_ambush',
        type: 'combat',
        description: "Из-за деревьев внезапно выскакивает группа бандитов! Засада!",
        chance: 0.35,
        combatTrigger: {
            enemyIds: ['bandit'],
            count: { min: 1, max: 2 }
        }
    },
    {
        id: 'travel_encounter_wolves_pack',
        type: 'combat',
        description: "Стая голодных волков окружает героя, оскалив клыки.",
        chance: 0.3,
        combatTrigger: {
            enemyIds: ['wolf'],
            count: { min: 2, max: 3 }
        }
    },
    {
        id: 'travel_encounter_wild_bear',
        type: 'combat',
        description: "Огромный медведь поднимается на задние лапы и грозно рычит!",
        chance: 0.25,
        combatTrigger: {
            enemyIds: ['bear'],
            count: { min: 1, max: 1 }
        }
    },
    {
        id: 'travel_encounter_skeleton_patrol',
        type: 'combat',
        description: "Из руин поднимаются древние скелеты, преграждая путь.",
        chance: 0.2,
        combatTrigger: {
            enemyIds: ['skeleton'],
            count: { min: 1, max: 2 }
        }
    },
    {
        id: 'travel_discovery_treasure_stash',
        type: 'discovery',
        description: "Среди камней герой замечает старый тайник с припасами!",
        chance: 0.15,
        rewards: {
            gold: { min: 30, max: 80 },
            items: [{ pool: ['healing_potion', 'bread', 'cheese'], chance: 0.6 }]
        }
    },
    {
        id: 'travel_discovery_ancient_shrine',
        type: 'discovery',
        description: "Древнее святилище дает временное благословение путнику.",
        chance: 0.1,
        effects: [
            { type: 'buff', stat: 'health', amount: 15, duration: 120000 }
        ]
    },
    {
        id: 'travel_hazard_trap',
        type: 'hazard',
        description: "Герой наступает на старую ловушку! Острые шипы ранят ногу.",
        chance: 0.2,
        damage: { min: 10, max: 25 }
    },
    {
        id: 'travel_hazard_poisonous_plant',
        type: 'hazard',
        description: "Неосторожно прикоснувшись к растению, герой получает лёгкое отравление.",
        chance: 0.15,
        damage: { min: 5, max: 15 },
        effects: [
            { type: 'debuff', stat: 'stamina', amount: -10, duration: 60000 }
        ]
    },
    {
        id: 'travel_narrative_mysterious_ruins',
        type: 'narrative',
        description: "Вдали виднеются таинственные руины. Возможно, стоит вернуться сюда позже?",
        chance: 0.2
    },
    {
        id: 'travel_narrative_strange_tracks',
        type: 'narrative',
        description: "На земле заметны странные следы. Что-то крупное прошло здесь недавно...",
        chance: 0.18
    },
    {
        id: 'travel_narrative_lost_path',
        type: 'narrative',
        description: "Тропа теряется в густом лесу. Герой вынужден прокладывать новый путь.",
        chance: 0.25
    },
    {
        id: 'travel_narrative_beautiful_vista',
        type: 'narrative',
        description: "Открывается захватывающий вид на горы. Герой делает короткую передышку.",
        chance: 0.15
    },
    {
        id: 'travel_encounter_friendly_traveler',
        type: 'social',
        description: "Встреча с дружелюбным путником. Он делится новостями и советами.",
        chance: 0.12,
        rewards: {
            gold: { min: 10, max: 30 }
        }
    }
];

/**
 * Safe travel events for discovered/known locations
 */
export const safeTravelEvents: GameEvent[] = [
    {
        id: 'safe_travel_good_weather',
        type: 'narrative',
        description: "Погода благоприятствует путешествию. Дорога проходит легко.",
        chance: 0.3
    },
    {
        id: 'safe_travel_merchant_caravan',
        type: 'social',
        description: "По дороге движется торговый караван. Можно идти вместе для безопасности.",
        chance: 0.15
    },
    {
        id: 'safe_travel_roadside_inn',
        type: 'discovery',
        description: "Придорожная таверна! Самое время передохнуть.",
        chance: 0.1
    }
];

