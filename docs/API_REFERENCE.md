# API Reference для SvelteKit Frontend

## Общая информация

**Base URL**: `http://localhost:5000` (development)  
**Realtime WebSocket**: `ws://localhost:5050`

### Аутентификация

Все защищенные endpoints требуют cookie `session_token` или header `Authorization: Bearer <token>`.

### CSRF Protection

Для всех POST/PUT/DELETE запросов требуется:
- Cookie `csrf_token`
- Header `x-csrf-token` с тем же значением

### Rate Limiting

60 запросов в минуту на IP адрес.

---

## REST API Endpoints

### 🏥 Health Check

#### GET `/api/health`
Проверка состояния сервера.

**Response**:
```json
{
  "status": "ok",
  "time": 1234567890
}
```

---

### 👤 Characters

#### GET `/api/characters/[id]/quests`
Получить квесты персонажа.

**Query Params**: Нет

**Response**:
```json
{
  "ok": true,
  "quests": [...]
}
```

#### POST `/api/characters/[id]/message`
Отправить сообщение персонажу (реакция).

**Body**:
```json
{
  "text": "Привет, герой!"
}
```

#### POST `/api/characters/[id]/react`
Добавить реакцию на профиль персонажа.

**Body**:
```json
{
  "source": "profile-view",
  "payload": {}
}
```

---

### 📜 Quests

#### GET `/api/quests?characterId=xxx`
Получить все квесты персонажа.

**Response**:
```json
{
  "ok": true,
  "quests": [
    {
      "id": "quest-1",
      "title": "Название квеста",
      "description": "Описание",
      "type": "main|side|bounty|urgent",
      "status": "in-progress",
      "progress": 50,
      "rewards": {
        "gold": 100,
        "xp": 50
      }
    }
  ]
}
```

#### GET `/api/quests/active?characterId=xxx`
Получить активный квест.

#### POST `/api/quests/set-active`
Установить активный квест.

**Body**:
```json
{
  "characterId": "xxx",
  "questId": "quest-1"
}
```

#### GET `/api/quests/[id]`
Получить детали квеста.

---

### 🛒 Market

#### GET `/api/market/list?characterId=xxx`
Получить список товаров на глобальном рынке.

**Response**:
```json
{
  "ok": true,
  "items": [
    {
      "itemId": "item-1",
      "price": 10.5,
      "supply": 100,
      "demand": 50
    }
  ]
}
```

#### POST `/api/market/trade`
Купить/продать на рынке.

**Body**:
```json
{
  "characterId": "xxx",
  "itemId": "item-1",
  "quantity": 10,
  "action": "buy|sell"
}
```

---

### 🛍️ Shop (Player Shop)

#### POST `/api/shop/list-item`
Выставить предмет на продажу.

**Body**:
```json
{
  "characterId": "xxx",
  "itemId": "item-1",
  "quantity": 5,
  "price": 20
}
```

#### POST `/api/shop/remove-item`
Убрать предмет с продажи.

#### POST `/api/shop/purchase`
Купить предмет у другого игрока.

---

### ⚒️ Crafting

#### GET `/api/crafting/recipes?characterId=xxx`
Получить доступные рецепты.

#### POST `/api/crafting/perform`
Создать предмет.

**Body**:
```json
{
  "characterId": "xxx",
  "recipeId": "recipe-1",
  "quantity": 1
}
```

#### POST `/api/crafting/unlock`
Разблокировать рецепт за crafting points.

#### GET `/api/crafting/inventory?characterId=xxx`
Получить крафтовый инвентарь.

---

### 🌲 Gathering (Resource Nodes)

#### POST `/api/gathering/start`
Начать сбор ресурсов.

**Body**:
```json
{
  "characterId": "xxx",
  "nodeId": "node-iron-ore"
}
```

---

### 💬 Divine Messages

#### POST `/api/divine/message`
Отправить божественное сообщение герою.

**Body**:
```json
{
  "characterId": "xxx",
  "text": "Иди на север!"
}
```

---

### 📢 Shouts

#### GET `/api/shouts`
Получить все доступные крики (shouts).

#### GET `/api/shouts/known?characterId=xxx`
Получить известные крики персонажа.

---

### 🤖 AI System

#### GET `/api/ai/profile?characterId=xxx`
Получить AI профиль персонажа.

#### POST `/api/ai/modifiers`
Добавить временные модификаторы AI.

#### GET `/api/ai/priority?characterId=xxx`
Получить приоритеты действий AI.

#### POST `/api/ai/simulate`
Симулировать выбор действия AI.

#### GET `/api/ai/diagnostics?characterId=xxx`
Диагностика AI состояния.

#### GET `/api/ai/consciousness?characterId=xxx`
Получить "сознание" AI (мысли, контекст).

#### GET `/api/ai/inspect?characterId=xxx`
Детальная инспекция AI решений.

---

### 🔮 AI Graphs (Modular AI)

#### GET `/api/ai-graphs/templates`
Получить шаблоны AI графов.

#### POST `/api/ai-graphs/templates`
Создать новый шаблон.

#### GET `/api/ai-graphs/templates/[id]`
Получить конкретный шаблон.

#### GET `/api/ai-graphs/instances?characterId=xxx`
Получить AI граф инстансы персонажа.

#### POST `/api/ai-graphs/instances`
Создать новый инстанс для персонажа.

#### GET `/api/ai-graphs/stream/[characterId]`
**SSE Stream** - реал-тайм поток выполнения AI графа.

#### GET `/api/ai-graphs/runtime/[characterId]`
Получить текущее runtime состояние AI графа.

#### POST `/api/ai-graphs/actions`
Выполнить действие в AI графе.

---

### 📊 Combat Analytics

#### GET `/api/combat-analytics?characterId=xxx`
Получить статистику боёв.

**Response**:
```json
{
  "ok": true,
  "battles": [
    {
      "id": "battle-1",
      "timestamp": 1234567890,
      "enemyName": "Бандит",
      "victory": true,
      "damageDealt": 150,
      "damageTaken": 50
    }
  ]
}
```

---

### ⚡ Urgent Events

#### GET `/api/urgent/dyatlovo?characterId=xxx`
Специальное событие (пример).

---

### 📱 Telegram Integration

#### POST `/api/telegram/link`
Создать токен для привязки Telegram аккаунта.

#### GET `/api/telegram/status?userId=xxx`
Проверить статус подписки.

#### POST `/api/telegram/webhook`
Webhook для Telegram бота (внутренний).

---

## Server Actions (для Next.js, нужно переделать в API)

Эти функции сейчас работают как Server Actions в Next.js. Для SvelteKit нужно создать соответствующие API endpoints.

### Divine Interventions

**Function**: `performIntervention(userId, type)`

- `type`: 'bless' | 'punish'
- Стоимость: 50 intervention power

**Нужен endpoint**: `POST /api/divine/intervention`

### Temple Donations

**Function**: `donateToFaction(userId, factionId, amount)`

**Нужен endpoint**: `POST /api/factions/donate`

**Body**:
```json
{
  "characterId": "xxx",
  "factionId": "companions",
  "amount": 100
}
```

### Travel Suggestions

**Function**: `suggestTravel(userId, destinationId)`

**Нужен endpoint**: `POST /api/divine/suggest-travel`

### Character Actions (из dashboard)

Нужно создать endpoints для:
- `POST /api/character/equip` - надеть предмет
- `POST /api/character/unequip` - снять предмет
- `POST /api/character/use-item` - использовать предмет
- `POST /api/character/drop-item` - выбросить предмет
- `POST /api/character/assign-points` - распределить очки
- `POST /api/character/unlock-perk` - разблокировать перк
- `POST /api/character/rest` - отдохнуть
- `POST /api/character/travel` - путешествовать

---

## WebSocket (Realtime) Events

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:5050', {
  query: {
    realmId: 'global',
    characterId: 'xxx' // опционально
  }
});
```

### Events to Listen

#### `connected`
```json
{
  "realmId": "global",
  "characterId": "xxx"
}
```

#### `tick:update` (Legacy)
Обновление тика персонажа.

```json
{
  "realmId": "global",
  "characterId": "xxx",
  "tickAt": 1234567890,
  "updatedAt": 1234567890,
  "summary": {
    "status": "exploring",
    "location": "whiterun",
    "hp": 100
  }
}
```

#### `game:event` (New System)
Универсальное игровое событие.

```json
{
  "type": "character:level_up",
  "data": {
    "characterId": "xxx",
    "newLevel": 5
  },
  "timestamp": 1234567890
}
```

**Event Types**:
- `character:*` - события персонажа
- `market:*` - рыночные события
- `divine:*` - божественные вмешательства
- `companion:*` - события компаньонов
- `quest:*` - события квестов
- `combat:*` - боевые события

#### Specific Event Types
Можно слушать конкретные типы событий:

```javascript
socket.on('character:level_up', (data) => {
  console.log('Level up!', data);
});
```

### Events to Emit

#### `subscribe`
```javascript
socket.emit('subscribe', 'character:level_up');
```

#### `unsubscribe`
```javascript
socket.emit('unsubscribe', 'character:level_up');
```

---

## Типы данных (TypeScript)

### Character

```typescript
interface Character {
  id: string;
  userId: string;
  realmId: string;
  name: string;
  gender: string;
  race: string;
  backstory: string;
  patronDeity: string;
  level: number;
  xp: { current: number; required: number };
  stats: {
    health: { current: number; max: number };
    magicka: { current: number; max: number };
    stamina: { current: number; max: number };
    fatigue: { current: number; max: number };
  };
  attributes: {
    strength: number;
    agility: number;
    intelligence: number;
    endurance: number;
  };
  skills: {
    oneHanded: number;
    block: number;
    heavyArmor: number;
    lightArmor: number;
    persuasion: number;
    alchemy: number;
  };
  location: string;
  status: string;
  inventory: Item[];
  equippedItems: Record<string, string>;
  factions: Record<string, { reputation: number }>;
  companions: string[];
  activeCompanion?: string;
  // ... и множество других полей (см. schema.ts)
}
```

### Quest

```typescript
interface Quest {
  id: string;
  characterId: string;
  title: string;
  description: string;
  location: string;
  type: 'main' | 'side' | 'bounty' | 'urgent';
  status: 'available' | 'in-progress' | 'completed' | 'failed';
  rewards: {
    gold?: number;
    xp?: number;
    items?: Array<{ id: string; quantity: number }>;
  };
  progress: number; // 0-100
  priority: number; // 0-100
  isActive: boolean;
  tasks?: QuestTask[];
}
```

### Item

```typescript
interface Item {
  id: string;
  name: string;
  type: string;
  quantity: number;
  weight: number;
  rarity?: string;
  damage?: number;
  armor?: number;
  // ... другие поля
}
```

---

## Миграция с Next.js на SvelteKit

### Что нужно сделать:

1. ✅ **Backend готов** - API endpoints уже есть, нужно только добавить недостающие
2. ✅ **Realtime готов** - Socket.IO работает независимо от frontend фреймворка
3. 🔄 **Нужно создать**: 
   - Недостающие API endpoints вместо Server Actions
   - CORS настройки для dev режима
   - SvelteKit проект с routing

### Новые endpoints для создания:

```
POST /api/divine/intervention
POST /api/factions/donate
POST /api/divine/suggest-travel
POST /api/character/equip
POST /api/character/unequip
POST /api/character/use-item
POST /api/character/drop-item
POST /api/character/assign-points
POST /api/character/unlock-perk
POST /api/character/rest
POST /api/character/travel
```

### CORS Setup

Для development нужно добавить CORS в middleware:

```typescript
// В middleware.ts добавить для SvelteKit dev server (порт 5173)
const allowedOrigins = [
  'http://localhost:5173', // SvelteKit dev
  'http://localhost:5000', // Next.js (временно)
];
```

---

## Примеры использования в SvelteKit

### Load Data (SSR)

```typescript
// src/routes/dashboard/+page.server.ts
export async function load({ cookies }) {
  const sessionToken = cookies.get('session_token');
  
  const res = await fetch('http://localhost:5000/api/quests?characterId=xxx', {
    headers: {
      'Cookie': `session_token=${sessionToken}`
    }
  });
  
  const data = await res.json();
  return { quests: data.quests };
}
```

### Client-side API Call

```typescript
// src/lib/api.ts
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`http://localhost:5000${endpoint}`, {
    ...options,
    credentials: 'include', // Для cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText}`);
  }
  
  return res.json();
}
```

### WebSocket в Svelte

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';
  
  let socket;
  let updates = [];
  
  onMount(() => {
    socket = io('ws://localhost:5050', {
      query: {
        realmId: 'global',
        characterId: $characterStore.id
      }
    });
    
    socket.on('game:event', (event) => {
      updates = [...updates, event];
    });
    
    socket.on('character:level_up', (data) => {
      console.log('Level up!', data);
    });
  });
  
  onDestroy(() => {
    socket?.disconnect();
  });
</script>

{#each updates as update}
  <div>{update.type}: {JSON.stringify(update.data)}</div>
{/each}
```

---

## Checklist для миграции

- [ ] Создать базовую структуру SvelteKit проекта
- [ ] Настроить i18n (svelte-i18n)
- [ ] Создать API client (fetch wrapper)
- [ ] Создать WebSocket service
- [ ] Добавить недостающие API endpoints
- [ ] Настроить CORS в backend
- [ ] Мигрировать компоненты поэтапно:
  - [ ] Login/Register
  - [ ] Character Creation
  - [ ] Dashboard (главная)
  - [ ] Character page
  - [ ] Inventory
  - [ ] Quests
  - [ ] Map (с Leaflet)
  - [ ] Market
  - [ ] Crafting
  - [ ] Factions
  - [ ] Society
  - [ ] Admin panel
- [ ] Настроить DaisyUI + TailwindCSS
- [ ] Добавить Tabler Icons
- [ ] Тестирование
