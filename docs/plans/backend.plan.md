# Backend plan: quests, crafting, reactions, urgent events

## Scope and priorities

- Backend-first only: data models, services, AI/engine integration, REST endpoints. Minimal/no UI.
- Player can message their character from profile; backend reacts and influences AI mildly.
- Upgrade quest generation (short/long-term), add crafting (Alchemy, Smithing, Enchanting, Cooking, Tanning, Smelting), and implement an urgent multi-stage event "Тайна перевала Дятлова" with branching outcomes.

## Key files to touch/add

- Data model: `shared/schema.ts`, new drizzle migrations in `drizzle/`.
- AI/engine: `src/ai/goal-manager.ts`, `src/ai/priority-engine.ts`, `src/ai/game-engine.ts`, `src/ai/generators/`, `src/ai/brain.ts`.
- Services: `src/services/` (new `questService.ts`, `craftingService.ts`, `eventService.ts`, `reactionService.ts`).
- API routes: `src/app/api/quests/`, `src/app/api/crafting/`, `src/app/api/characters/[id]/react/`, `src/app/api/characters/[id]/message/`.
- Workers: `server/workers/tickWorker.ts`, `server/producers/tickProducer.ts`.
- Data: `src/data/dialogues.ts`, `src/data/events.ts` (event templates), `src/data/items.ts` (craft outputs), `src/data/thoughts.ts` (dynamic seeding refs).
- Tests: `tests/` for generator, crafting, reactions, event flow.

## Architecture decisions

- Quests as instances from templates with tasks/subtasks and progress; AI requests/receives quests, and workers backfill when lacking.
- Crafting discipline-agnostic engine with recipes, skills, stations; XP and outcomes; probabilistic success (configurable per discipline).
- Reactions as lightweight character-interaction events generating thoughts and small priority modifiers; rate-limited and auditable.
- Urgent events as timeboxed quest-like instances with scripted steps, dice-based branching, and rewards.

## Notable schemas (concise shapes)

- Quest: `{ id, characterId, templateId, status, tasks[ {id, type, progress} ], rewards }`
- Recipe: `{ id, discipline, inputs[], outputs[], station, skillReq, xp }`
- Reaction: `{ id, characterId, source: 'profile-view'|'player-message', payload, effect }`
- UrgentEvent: `{ id, key, characterId, steps[], currentStep, expiresAt }`

## Integration points

- Tick: on each character tick, ensure min quest supply; ingest reaction signals; advance urgent events.
- Priority engine: incorporate small weighted nudges from reactions; respect personality/policy caps.
- Logging and metrics via `server/logger.ts`.

## Deliverables

- Stable backend APIs, migrations, services, and AI integration with unit tests for each feature.
- Seeded sample data for crafting recipes and the Dyatlov event dialogues.
- Docs: short how-to in `docs/blueprint.md`.