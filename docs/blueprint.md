# **App Name**: ElderScrollsIdle

## Core Features:

- User Authentication: Login/Register page for new users.
- Character Creation: Character creation with race selection (including traits, skills and initial stats), backstory selection (starting location and items), name input, and gender selection.
- Dashboard: Dashboard with key UI elements, including an adventure log (recent hero actions and thoughts).
- World Map: Interactive world map (using https://images.uesp.net/3/3b/SR-map-Skyrim_DE.svg) with SVG points to show the hero's location and path.
- Inventory: Inventory management with a capacity limit.  Implement slow movement penalties if the limit is exceeded, with UI notifications, and a manual "clear inventory" button.
- Factions: Faction system for joining guilds and completing quests, with backstory-based restrictions on joining certain factions.

## Style Guidelines:

- Primary color: Pale gold (#BCAB77) to reflect the lore and ancient history of Tamriel.
- Background color: Dark grey (#33302A) for a somber and mysterious mood.
- Accent color: Deep red (#9A261B) for highlights and important actions, suggestive of rubies or dragon blood.
- Headline font: 'Literata', serif, for a fantasy, vintage feel.
- Body font: 'Inter', sans-serif, to ensure readability in adventure logs.
- Icons: Use icons resembling medieval symbols, simplified for clarity.
- Layout: Use a layout resembling a parchment or map for the main content area.

## Backend extensions (Quests, Crafting, Reactions, Urgent Events)

### Quests
- Data: `shared/schema.ts` tables `quests`, `quest_tasks`
- Service: `src/services/questService.ts`
- API:
  - GET/POST `src/app/api/characters/[id]/quests/route.ts`
  - GET/PATCH `src/app/api/quests/[id]/route.ts`
- Engine integration: quest instance creation in `src/ai/brain.ts`; backfill in `server/workers/tickWorker.ts`.

### Crafting
- Data: `crafting_stations`, `crafting_recipes`, `character_crafting_skills`
- Service: `src/services/craftingService.ts`; seed `src/scripts/seed-crafting.ts`
- API:
  - GET `src/app/api/crafting/recipes/route.ts`
  - POST `src/app/api/crafting/perform/route.ts` { characterId, recipeId }
- AI action: `Скрафтить предмет` added in `src/ai/brain.ts`.

### Reactions (player → character)
- Data: `character_interactions`
- Service: `src/services/reactionService.ts` (rate limit + basic moderation)
- API:
  - POST `src/app/api/characters/[id]/react/route.ts` (profile view)
  - POST `src/app/api/characters/[id]/message/route.ts` { text, fromUserId? }
- AI nudges via `ai_modifiers` consumed in `brain` and `priority-engine`.

### Urgent events: Dyatlov Mystery
- Data: `urgent_events`, `urgent_event_steps`
- Service: `src/services/urgentEventService.ts` (trigger/advance), dice utils `src/lib/dice.ts`
- API: POST `src/app/api/urgent/dyatlovo/route.ts` { characterId }
- Tick integration: advance step each tick in `server/workers/tickWorker.ts`.

### Rewards
- Centralized payout: `src/services/rewardsService.ts`

### Notes
- Migrations: `drizzle/0012_quests_and_tasks.sql`, `0013_crafting.sql`, `0014_reactions.sql`, `0015_urgent_events.sql`
- Tests added under `tests/` for templates, crafting, dice.