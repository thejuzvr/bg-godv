# ElderScrollsIdle: Idle RPG

## Overview

ElderScrollsIdle is an idle RPG set in The Elder Scrolls universe where players observe rather than directly control their character. The game features an AI-driven character that makes autonomous decisions based on a weighted-random decision system, creating an emergent narrative experience. Players watch their hero explore Skyrim, complete quests, engage in combat, and make life choices while they build reputation with factions, worship deities, and progress through an RPG skill system.

**НОВОЕ: Offline Mode** - Персонажи продолжают жить и развиваться, даже когда пользователь не в сети, как в Godville.net! ✅ **РЕАЛИЗОВАНО**

**Статус Миграции:**
- ✅ Полная миграция с Firebase на PostgreSQL завершена (октябрь 2025)
- ✅ Firebase полностью удален из проекта
- ✅ Собственная система аутентификации с bcrypt password hashing
- ✅ Offline mode реализован через background worker
- ✅ Автоматическое создание пользователей в БД при регистрации
- ✅ Система оффлайн событий для показа активности персонажа

**Недавные Улучшения (октябрь 2025):**
- ✅ Базовая броня персонажа увеличена с 0 до 5 для лучшей выживаемости
- ✅ Исправлены проблемы с layout - карта и другие страницы корректно отображаются без скроллбаров
- ✅ Добавлена роль администратора через поле is_admin в БД (вместо проверки email)
- ✅ AI улучшения: action history tracking, динамические веса, улучшенная боевая тактика
- ✅ **Godville-Style Update Phase 2: NPC Social System**
  - 27 уникальных NPC с персональностями (торговцы, стражники, компаньоны, мемные персонажи)
  - Система отношений (relationships) с NPC через JSONB в БД
  - AI персонаж самостоятельно общается и торгует с NPC
  - Server actions: interactWithNPC, tradeWithNPC, giftToNPC, getNPCsByLocation
  - Интеграция в AI brain - персонаж покупает зелья когда их мало
  - UI: /dashboard/society страница с фильтрами, поиском, модальными окнами диалога
  - 5-уровневая система отношений (Незнакомец → Лучший друг)
- ✅ **Godville-Style Update Phase 4: Massive Content Expansion (50/50 Serious/Meme)**
  - **140+ предметов** (было ~80): Glass/Ebony/Daedric оружие, Dragon armor, Nightingale/DB gear
  - **Мемные предметы**: Sweetroll (legendary!), Arrow in Knee, Bucket/Basket (головные уборы!), Cheese Wheel, Skooma, М'Айк's books
  - **~46 квестов** (было ~16): серьезные (драконы, вампиры, даэдра) + мемные ("Стрела в колено", "Облачный квартал", "Томас Паровозик-дракон")
  - **80+ epic thoughts** (было ~40): мысли о сладких булочках, Назиме, курицах, сыре, М'Айке Лжеце
- ✅ **October 6, 2025: Auto-Allocation & AI Priority Fixes**
  - Автораспределение очков при level up - processLevelUp автоматически распределяет все очки характеристик и навыков
  - Использует стратегию балансировки (самый низкий атрибут/навык получает приоритет)
  - Работает только если включен autoAssignPoints в preferences персонажа
  - AI приоритеты квестов повышены - takeQuestAction теперь HIGH для здоровых персонажей
  - Система антиспама путешествий - travelAction отключается после 3+ последних путешествий

**Core Technologies:**
- Next.js 15 (App Router) with TypeScript
- React 18 for UI rendering
- PostgreSQL (Drizzle ORM) - единственная база данных для всех данных (персонажи, пользователи, аутентификация)
- Custom Authentication - bcrypt для хеширования паролей, сессии в cookies
- Genkit for AI-generated narrative content
- ShadCN UI component library with Tailwind CSS

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Client-Server Architecture

The application follows a strict separation between client and server logic:

**Server-Side (`'use server'` functions):**
- Game loop processing (`src/ai/game-engine.ts`)
- AI decision making (`src/ai/brain.ts`)
- All game state mutations
- Database operations (character saves, chronicle entries)
- AI flows for narrative generation (Genkit)

**Client-Side:**
- UI rendering and state display
- Real-time game loop orchestration (`src/hooks/use-game-loop.ts`)
- User interactions (dashboard, inventory management, map)
- Local state management (adventure logs stored in localStorage)

### Game Loop & AI System

**Game Loop (`use-game-loop.ts`):**
- Runs every 3 seconds on the client
- Calls server-side `processGameTick()` to compute next state
- Handles automatic saving every 30 seconds
- Manages adventure log and combat log display

**Game Engine (`game-engine.ts`):**
- Processes completed actions (quests, travel, rest)
- Handles stat regeneration (health, magicka, stamina)
- Checks for level-ups and applies them
- Processes active effects (poisons, buffs, debuffs)
- Triggers weather and seasonal changes
- Calls the AI brain for next decision

**AI Brain (`brain.ts`):**
- Weighted-random decision system (not neural network)
- Analyzes dozens of state parameters (health, location, inventory, mood, etc.)
- Assigns weights to available actions based on current context
- Makes probabilistic choices that feel logical but unpredictable
- Adapts based on character state (e.g., book reading grants temporary combat inspiration)

**Action Types:**
- Combat: Engage enemies, flee, use items/spells
- Quest: Accept and complete quests from various locations
- Explore: Discover new areas, crypts with multi-stage exploration
- Travel: Move between cities and locations
- Rest: Sleep to restore stats and pass time
- Learn: Read books to gain skills and inspiration
- Social: Interact with NPCs, join factions
- Misc: Donate to factions, pray at temples, manage inventory

### Data Architecture

**PostgreSQL Database (shared/schema.ts):**
- `users`: User accounts with email and timestamps
- `characters`: Complete character state (linked to users table)
  - Stores stats, inventory, location, active actions, equipment, factions, etc.
  - Uses JSONB columns for complex nested data structures
  - Includes `isActive` flag and `lastProcessedAt` for offline mode
- `chronicle`: Character history and achievements (linked to characters)
- `offline_events`: Events that happened while user was offline (linked to characters)
  - Allows users to catch up on what their character did while away

**Static Game Data (src/data/):**
- Items, quests, enemies, locations, spells, perks, factions
- NPCs, events, city events, Sovngarde quests
- Imported directly in code (not stored in database)

**Character Schema:**
- Core stats: health, magicka, stamina (current/max)
- Attributes: strength, agility, intelligence, endurance
- Skills: oneHanded, block, heavyArmor, lightArmor, persuasion, alchemy
- RPG systems: level, XP, skill points, perk points
- State: status, location, currentAction, combatState
- Inventory: items with quantity and weight
- Equipment: items equipped by slot
- Factions: reputation levels with guilds
- Divine systems: patronDeity, divineFavor, templeProgress
- Mood and weather tracking

**Repository Pattern:**
The application uses a repository pattern (`characterService.ts`) that abstracts data persistence. Currently using PostgreSQL implementation (`characterRepository.postgres.ts`). All repository methods require userId parameter for security and multi-user support. Firebase implementation removed after successful migration.

**Background Worker:**
- Runs continuously in separate process (`server/background-worker.ts`)
- Processes game ticks for ALL active characters every 3 seconds
- Characters continue to adventure, fight, and level up even when users are offline
- Events are stored in `offline_events` table and shown to users when they log back in

### Character Thoughts & Reactions

**Epic Phrase Generation:**
- Uses predefined contextual, comedic character thoughts from `/src/data/thoughts.ts`
- Selects appropriate thoughts based on character state, mood, health, location, weather
- ~80+ unique thoughts with Elder Scrolls memes and references
- 8% chance per game tick to generate a thought

**Divine Intervention Reactions:**
- Predefined comedic reactions to player-triggered blessings/punishments
- Contextual responses based on intervention type (heal, gold, buff, etc.)
- Multiple random variations for each intervention type

### Frontend Architecture

**Next.js App Router Structure:**
- `/` - Authentication (login/register)
- `/create-character` - Multi-step character creation wizard
- `/dashboard` - Main game view with live updates
- `/dashboard/[feature]` - Character sheet, map, inventory, quests, analytics, etc.
- `/profile` - User profile and achievements
- `/admin` - Database seeding tools

**Component Organization:**
- `src/components/ui/` - ShadCN base components
- `src/components/dashboard/` - Game-specific feature panels
- `src/components/icons.tsx` - Custom SVG icons
- Extensive use of Lucide React icons via dynamic import

**Styling System:**
- Tailwind CSS with custom color scheme (pale gold, dark grey, deep red)
- CSS variables for theming in `globals.css`
- Custom fonts: Literata (headlines), Inter (body)
- Dark mode by default

### State Management

**No global state library** - relies on:
- React hooks for local state
- Server actions for mutations
- Props drilling for shared state
- localStorage for non-critical data (adventure logs)

### Real-time Updates

The game achieves "real-time" feel through:
- Client-side interval calling server functions
- Optimistic UI updates
- Progress bars with local countdown timers
- Toast notifications for important events

### Type Safety

Comprehensive TypeScript types in `src/types/`:
- `character.ts` - Character state and related types
- `quest.ts`, `enemy.ts`, `location.ts`, `spell.ts`, `perk.ts`, etc.
- Strong typing throughout codebase with `strict: true`

## External Dependencies

### ~~Firebase Services~~ (REMOVED - October 2025)
- Firebase has been completely removed from the project
- All data is now stored in PostgreSQL
- Authentication is implemented using custom bcrypt-based system

### ~~Google AI (Genkit)~~ (REMOVED - October 2025)
- Genkit and Google AI dependencies have been fully removed
- All narrative content (character thoughts, reactions) now uses predefined fallback content
- No external AI API calls - fully self-contained game logic

### UI Libraries
- **Radix UI**: Headless component primitives (via ShadCN)
- **Lucide React**: Icon library with 1000+ icons
- **ShadCN UI**: Pre-built accessible components
- **Tailwind CSS**: Utility-first styling
- **date-fns**: Date formatting and manipulation

### Forms & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation (for AI flows and forms)
- **@hookform/resolvers**: Zod integration for forms

### Development Tools
- **TypeScript**: Type safety across codebase
- **ESLint**: Linting (disabled during builds for flexibility)
- **Next.js Turbopack**: Fast development builds
- Build errors ignored (`ignoreBuildErrors: true`) to maintain development velocity

### Chart Library
- **Recharts**: Data visualization for analytics dashboard

### Additional Notes
- Uses patch-package for potential dependency modifications
- Configured for Russian language (game text in Russian)
- SVG-based world map from UESP (Elder Scrolls wiki)
- Custom middleware for server/client boundary enforcement