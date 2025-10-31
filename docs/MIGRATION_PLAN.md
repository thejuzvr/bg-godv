# План миграции с Next.js на SvelteKit

## Статус: Backend готов ✅

### Что сделано:

1. ✅ **Создана документация API** (`docs/API_REFERENCE.md`)
2. ✅ **Добавлены недостающие API endpoints**:
   - `POST /api/divine/intervention` - божественное вмешательство
   - `POST /api/divine/suggest-travel` - предложение путешествия
   - `POST /api/factions/donate` - пожертвование фракции/храму
   - `POST /api/character/equip` - экипировать предмет
   - `POST /api/character/unequip` - снять предмет
   - `POST /api/character/use-item` - использовать предмет
   - `POST /api/character/drop-item` - выбросить предмет
   - `POST /api/character/assign-points` - распределить очки
   - `POST /api/character/unlock-perk` - разблокировать перк
   - `POST /api/character/rest` - отдых
   - `POST /api/character/travel` - путешествие

3. ✅ **Настроен CORS** в middleware для SvelteKit dev server (порт 5173)
4. ✅ **Realtime система** (Socket.IO) готова к работе с SvelteKit

---

## Фазы миграции

### Фаза 0: Подготовка (✅ ЗАВЕРШЕНА)
- [x] Анализ текущей структуры
- [x] Создание документации API
- [x] Добавление недостающих endpoints
- [x] Настройка CORS

### Фаза 1: Создание SvelteKit проекта
- [ ] Инициализация SvelteKit проекта
- [ ] Настройка TailwindCSS + DaisyUI
- [ ] Настройка i18n (svelte-i18n)
- [ ] Установка зависимостей:
  - `@tabler/icons-svelte` - иконки
  - `socket.io-client` - WebSockets
  - `svelte-i18n` - интернационализация
  - `leaflet` + `svelte-leaflet` - карта
  - `daisyui` - UI компоненты

### Фаза 2: Core инфраструктура
- [ ] Создать API client (`$lib/api.ts`)
- [ ] Создать WebSocket service (`$lib/realtime.ts`)
- [ ] Создать stores для состояния:
  - `characterStore` - данные персонажа
  - `authStore` - аутентификация
  - `gameEventsStore` - игровые события
  - `realtimeStore` - realtime обновления
- [ ] Создать типы TypeScript (скопировать из `src/types/`)
- [ ] Создать layout с навигацией

### Фаза 3: Аутентификация и создание персонажа
- [ ] Страница Login (`/login`)
- [ ] Страница Register (`/register`)
- [ ] Страница Character Creation (`/create-character`)
- [ ] Тестирование аутентификации
- [ ] **Удалить соответствующие Next.js компоненты**

### Фаза 4: Dashboard (главная страница)
- [ ] Layout для dashboard
- [ ] Главная страница Dashboard (`/dashboard`)
  - [ ] Журнал приключений (adventure log)
  - [ ] Текущий статус персонажа
  - [ ] Быстрые действия
  - [ ] Прогресс квеста
- [ ] Интеграция WebSocket для реал-тайм обновлений
- [ ] Тестирование
- [ ] **Удалить Next.js dashboard компоненты**

### Фаза 5: Страница персонажа
- [ ] Страница Character (`/dashboard/character`)
  - [ ] Характеристики и навыки
  - [ ] Система перков (с категориями)
  - [ ] Распределение очков
  - [ ] Визуализация прогресса
- [ ] Тестирование
- [ ] **Удалить Next.js character компоненты**

### Фаза 6: Инвентарь
- [ ] Страница Inventory (`/dashboard/inventory`)
  - [ ] Список предметов
  - [ ] Экипировка
  - [ ] Использование предметов
  - [ ] Управление весом
- [ ] Тестирование
- [ ] **Удалить Next.js inventory компоненты**

### Фаза 7: Квесты
- [ ] Страница Quests (`/dashboard/quests`)
  - [ ] Список квестов
  - [ ] Детали квеста
  - [ ] Прогресс задач
  - [ ] Активация квеста
  - [ ] Божественное направление
- [ ] Тестирование
- [ ] **Удалить Next.js quests компоненты**

### Фаза 8: Карта
- [ ] Страница Map (`/dashboard/map`)
  - [ ] Интеграция Leaflet
  - [ ] Кастомные тайлы Tamriel (или canvas)
  - [ ] Маркеры локаций
  - [ ] Быстрое перемещение
  - [ ] Система открытия локаций
  - [ ] HUD погоды и условий
  - [ ] Fullscreen режим
  - [ ] Zoom и pan
- [ ] Тестирование
- [ ] **Удалить Next.js map компоненты**

### Фаза 9: Рынок и крафт
- [ ] Страница Market (`/dashboard/market`)
  - [ ] Глобальный рынок
  - [ ] Покупка/продажа
  - [ ] Динамические цены
- [ ] Страница Crafting (`/dashboard/crafting`)
  - [ ] Список рецептов
  - [ ] Создание предметов
  - [ ] Разблокировка рецептов
  - [ ] Крафтовые навыки
- [ ] Страница Gathering (`/dashboard/gathering`)
  - [ ] Сбор ресурсов
- [ ] Тестирование
- [ ] **Удалить Next.js market/crafting компоненты**

### Фаза 10: Фракции и социальная система
- [ ] Страница Factions (`/dashboard/factions`)
  - [ ] Список фракций
  - [ ] Прогресс репутации
  - [ ] Награды за ранги
  - [ ] Пожертвования храмам
  - [ ] Уникальные функции фракций
- [ ] Страница Society (`/dashboard/society`)
  - [ ] Компаньоны
  - [ ] Своя лавка (player shop)
  - [ ] NPC взаимодействия
- [ ] Тестирование
- [ ] **Удалить Next.js factions/society компоненты**

### Фаза 11: Дополнительные страницы
- [ ] Страница Chronicle (`/dashboard/chronicle`)
- [ ] Страница Analytics (`/dashboard/analytics`)
- [ ] Страница Arena (`/dashboard/arena`)
- [ ] Страница Mind (AI diagnostics) (`/dashboard/mind`)
- [ ] Тестирование
- [ ] **Удалить соответствующие Next.js компоненты**

### Фаза 12: Admin Panel
- [ ] Страницы admin панели (`/admin/*`)
  - [ ] Data Manager
  - [ ] Drizzle Studio integration
  - [ ] Telegram integration
  - [ ] Test Utils
- [ ] Тестирование
- [ ] **Удалить Next.js admin компоненты**

### Фаза 13: Оптимизация и финализация
- [ ] Оптимизация производительности
- [ ] Тестирование всех функций
- [ ] Проверка i18n (русский/английский)
- [ ] Проверка responsive дизайна
- [ ] Удаление всего Next.js кода
- [ ] Обновление README и документации
- [ ] Обновление package.json scripts

---

## Структура SvelteKit проекта

```
sveltekit/
├── src/
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── realtime.ts         # WebSocket service
│   │   ├── i18n/
│   │   │   ├── en.json
│   │   │   └── ru.json
│   │   ├── stores/
│   │   │   ├── auth.ts
│   │   │   ├── character.ts
│   │   │   ├── gameEvents.ts
│   │   │   └── realtime.ts
│   │   ├── types/             # TypeScript types (скопировать из src/types/)
│   │   ├── data/              # Game data (скопировать из src/data/)
│   │   └── components/        # Shared components
│   │       ├── ui/            # DaisyUI components
│   │       ├── character/
│   │       ├── inventory/
│   │       └── map/
│   │
│   └── routes/
│       ├── +layout.svelte           # Root layout
│       ├── +layout.server.ts        # Server-side auth check
│       ├── +page.svelte             # Home page
│       ├── login/
│       │   └── +page.svelte
│       ├── register/
│       │   └── +page.svelte
│       ├── create-character/
│       │   └── +page.svelte
│       └── dashboard/
│           ├── +layout.svelte       # Dashboard layout
│           ├── +layout.server.ts    # Load character data
│           ├── +page.svelte         # Dashboard home
│           ├── character/
│           │   └── +page.svelte
│           ├── inventory/
│           │   └── +page.svelte
│           ├── quests/
│           │   └── +page.svelte
│           ├── map/
│           │   └── +page.svelte
│           ├── market/
│           │   └── +page.svelte
│           ├── crafting/
│           │   └── +page.svelte
│           ├── factions/
│           │   └── +page.svelte
│           └── society/
│               └── +page.svelte
│
├── static/                    # Static assets (скопировать из public/)
├── tailwind.config.js
├── svelte.config.js
├── vite.config.js
└── package.json
```

---

## Конфигурация

### `tailwind.config.js`
```javascript
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['dark', 'cupcake'], // или кастомная тема Elder Scrolls
  },
};
```

### `svelte.config.js`
```javascript
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $lib: './src/lib',
      $components: './src/lib/components',
    },
  },
};
```

---

## Примеры кода

### API Client (`$lib/api.ts`)
```typescript
import { browser } from '$app/environment';

const API_BASE = 'http://localhost:5000';

interface FetchOptions extends RequestInit {
  csrf?: boolean;
}

export async function fetchAPI<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { csrf = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add CSRF token for mutations
  if (browser && csrf && fetchOptions.method && fetchOptions.method !== 'GET') {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1];
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// Example API functions
export const api = {
  // Characters
  getCharacter: (id: string) => fetchAPI(`/api/characters/${id}`),
  getQuests: (characterId: string) => fetchAPI(`/api/quests?characterId=${characterId}`),
  
  // Actions
  equipItem: (characterId: string, itemId: string) =>
    fetchAPI('/api/character/equip', {
      method: 'POST',
      body: JSON.stringify({ characterId, itemId }),
    }),
  
  performIntervention: (characterId: string, type: 'bless' | 'punish') =>
    fetchAPI('/api/divine/intervention', {
      method: 'POST',
      body: JSON.stringify({ characterId, type }),
    }),
  
  // ... other API methods
};
```

### WebSocket Service (`$lib/realtime.ts`)
```typescript
import { io, Socket } from 'socket.io-client';
import { writable } from 'svelte/store';
import type { GameEvent } from '$lib/types/events';

const WS_URL = 'ws://localhost:5050';

export const realtimeEvents = writable<GameEvent[]>([]);
export const isConnected = writable(false);

class RealtimeService {
  private socket: Socket | null = null;

  connect(realmId: string, characterId?: string) {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      query: { realmId, characterId },
    });

    this.socket.on('connected', (data) => {
      console.log('[Realtime] Connected:', data);
      isConnected.set(true);
    });

    this.socket.on('game:event', (event: GameEvent) => {
      realtimeEvents.update(events => [...events, event]);
    });

    this.socket.on('disconnect', () => {
      isConnected.set(false);
    });
  }

  subscribe(eventType: string) {
    this.socket?.emit('subscribe', eventType);
  }

  unsubscribe(eventType: string) {
    this.socket?.emit('unsubscribe', eventType);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const realtime = new RealtimeService();
```

### Character Store (`$lib/stores/character.ts`)
```typescript
import { writable, derived } from 'svelte/store';
import type { Character } from '$lib/types/character';

function createCharacterStore() {
  const { subscribe, set, update } = writable<Character | null>(null);

  return {
    subscribe,
    set,
    update,
    
    // Computed properties
    isAlive: derived({ subscribe }, ($char) => 
      $char ? $char.stats.health.current > 0 : false
    ),
    
    isTraveling: derived({ subscribe }, ($char) => 
      $char?.status === 'traveling'
    ),
  };
}

export const character = createCharacterStore();
```

### Layout с WebSocket (`/dashboard/+layout.svelte`)
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { realtime } from '$lib/realtime';
  import { character } from '$lib/stores/character';
  import { page } from '$app/stores';
  
  export let data; // From +layout.server.ts
  
  $: character.set(data.character);
  
  onMount(() => {
    if ($character) {
      realtime.connect('global', $character.id);
    }
  });
  
  onDestroy(() => {
    realtime.disconnect();
  });
</script>

<div class="dashboard-layout">
  <nav class="navbar">
    <!-- Navigation -->
  </nav>
  
  <main>
    <slot />
  </main>
</div>
```

---

## Чеклист перед удалением Next.js компонентов

Перед удалением каждого блока Next.js компонентов, убедитесь:

1. ✅ SvelteKit компонент полностью работает
2. ✅ Все API calls работают корректно
3. ✅ WebSocket обновления приходят
4. ✅ UI соответствует дизайну
5. ✅ i18n переведены все строки
6. ✅ Нет ошибок в консоли
7. ✅ Тестирование на мобильных устройствах

---

## Команды для запуска

### Development (параллельно Next.js и SvelteKit)
```bash
# Terminal 1: Backend (Next.js API)
npm run dev

# Terminal 2: Worker
npm run worker

# Terminal 3: Realtime WebSocket
npm run realtime

# Terminal 4: SvelteKit frontend (после создания)
cd sveltekit && npm run dev
```

### После полной миграции
```bash
# Можно будет убрать Next.js и запускать только:
npm run start:backend  # Backend API + Worker + Realtime
cd sveltekit && npm run dev  # SvelteKit frontend
```

---

## Риски и митигация

### Риск: Потеря функциональности
**Митигация**: Тщательное тестирование каждого блока перед удалением Next.js кода

### Риск: Проблемы с WebSocket
**Митигация**: WebSocket сервер независим от frontend фреймворка, должен работать без изменений

### Риск: CORS проблемы
**Митигация**: CORS уже настроен в middleware для SvelteKit dev server

### Риск: Session/Auth проблемы
**Митигация**: Cookies будут работать с `credentials: 'include'` в fetch

---

## Следующий шаг

**Создать базовую структуру SvelteKit проекта** и начать с Фазы 1.

Команды:
```bash
npm create svelte@latest sveltekit
cd sveltekit
npm install
npm install -D tailwindcss daisyui @sveltejs/adapter-node
npm install socket.io-client svelte-i18n
npm install -D @tabler/icons-svelte
```
