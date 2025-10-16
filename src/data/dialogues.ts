export type DialogueCategory = 'event_narrative' | 'npc_encounter' | 'dungeon_discovery';

export interface Dialogue {
  id: string;
  category: DialogueCategory;
  lines: string[];
  // optional filter context
  locationId?: string;
}

export const dialogues: Dialogue[] = [
  {
    id: 'dyatlov_bards',
    category: 'event_narrative',
    locationId: 'bleak_falls_barrow',
    lines: [
      '— Почему мы, барды, в склепе?.. — Потому что акустика, Гуннар! Акустика!',
      '— В таком морозе только драугры поют. — И всё равно чище, чем хор в Вайтране.',
      '— Запиши: новая баллада — "Кому кости, а кому — ноты".'
    ],
  },
];

