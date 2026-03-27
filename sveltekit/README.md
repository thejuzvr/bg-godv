# 🎮 Elder Scrolls Game - SvelteKit Frontend

> Новый реактивный frontend для игры в стиле Godville, вдохновленной миром The Elder Scrolls

[![SvelteKit](https://img.shields.io/badge/SvelteKit-5.2-FF3E00?style=flat&logo=svelte)](https://kit.svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-4.12-5A0EF8?style=flat)](https://daisyui.com)

---

## 📋 Содержание

- [О проекте](#о-проекте)
- [Технологии](#технологии)
- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [Разработка](#разработка)
- [API Integration](#api-integration)
- [Realtime Events](#realtime-events)
- [Интернационализация](#интернационализация)
- [Стилизация](#стилизация)
- [Deployment](#deployment)

---

## 🎯 О проекте

Этот проект - полная переработка frontend части игры с Next.js на SvelteKit для достижения:

- **Легкости и производительности** - меньший bundle size, быстрая загрузка
- **Реактивности** - встроенная реактивность Svelte с `$:` и runes
- **Простоты** - меньше boilerplate, чище код
- **WebSocket интеграции** - seamless realtime обновления
- **Лучшего DX** - hot module replacement, быстрый dev server

### Особенности игры

- 🎲 **AI-driven gameplay** - персонаж действует автономно
- 🌍 **Open world** - исследование мира Tamriel
- ⚔️ **Combat system** - пошаговые бои с врагами
- 📜 **Quest system** - динамические квесты с AI
- 🛠️ **Crafting** - создание предметов и зелий
- 👥 **Factions** - репутация и ранги в фракциях
- 🤝 **Companions** - компаньоны с уникальными способностями
- 💬 **Divine intervention** - игрок может влиять на героя
- 🔴 **Realtime updates** - WebSocket для живых обновлений

---

## 🛠 Технологии

### Core
- **[SvelteKit](https://kit.svelte.dev)** `^2.5.0` - Full-stack framework
- **[Svelte](https://svelte.dev)** `^5.2.9` - Reactive UI library (with runes)
- **[TypeScript](https://www.typescriptlang.org/)** `^5.6.3` - Type safety
- **[Vite](https://vitejs.dev/)** `^6.0.3` - Build tool

### Styling
- **[TailwindCSS](https://tailwindcss.com/)** `^3.4.17` - Utility-first CSS
- **[DaisyUI](https://daisyui.com/)** `^4.12.14` - Component library
- **Custom Elder Scrolls theme** - Immersive styling

### Realtime & API
- **[Socket.IO Client](https://socket.io/)** `^4.7.5` - WebSocket connection
- **Fetch API** - REST API calls with CSRF protection

### Internationalization
- **[svelte-i18n](https://github.com/kaisermann/svelte-i18n)** `^4.1.0` - i18n support (ru/en)

### Icons
- **[@tabler/icons-svelte](https://tabler-icons.io/)** `^3.29.0` - Icon library

---

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Backend** должен быть запущен (см. root README)

### 1. Установка

```bash
# Перейти в директорию SvelteKit
cd sveltekit

# Установить зависимости
npm install
```

### 2. Настройка Environment Variables

```bash
# Скопировать example файл
cp .env.example .env
```

Содержимое `.env`:
```env
VITE_API_BASE=http://localhost:5000
VITE_WS_URL=ws://localhost:5050
```

### 3. Запуск Development Server

```bash
npm run dev
```

Откроется на **http://localhost:5173**

### 4. Запуск Backend (в другом терминале)

```bash
cd ..
npm run dev:all
```

Это запустит:
- Backend API на порту **5000**
- Worker для обработки тиков
- WebSocket server на порту **5050**

---

## 📁 Структура проекта

```
sveltekit/
├── src/
│   ├── app.css                      # Global styles + TailwindCSS
│   ├── app.html                     # HTML template
│   │
│   ├── lib/                         # Shared libraries
│   │   ├── api.ts                   # API client (fetch wrapper)
│   │   ├── realtime.ts              # WebSocket service
│   │   │
│   │   ├── stores/                  # Svelte stores
│   │   │   ├── auth.ts              # Authentication state
│   │   │   ├── character.ts         # Character state + derived
│   │   │   └── gameEvents.ts        # Adventure log entries
│   │   │
│   │   ├── types/                   # TypeScript type definitions
│   │   │   ├── character.ts
│   │   │   ├── item.ts
│   │   │   ├── quest.ts
│   │   │   └── ...
│   │   │
│   │   ├── data/                    # Static game data
│   │   │   ├── items.ts
│   │   │   ├── locations.ts
│   │   │   ├── npcs.ts
│   │   │   └── ...
│   │   │
│   │   ├── i18n/                    # Internationalization
│   │   │   ├── index.ts             # i18n setup
│   │   │   ├── ru.json              # Russian translations
│   │   │   └── en.json              # English translations
│   │   │
│   │   └── components/              # Shared components
│   │       ├── ui/                  # Base UI components
│   │       ├── character/           # Character-related
│   │       ├── inventory/           # Inventory components
│   │       └── map/                 # Map components
│   │
│   └── routes/                      # Application pages
│       ├── +layout.svelte           # Root layout
│       ├── +page.svelte             # Home page
│       │
│       ├── login/                   # Login page
│       ├── register/                # Registration page
│       ├── create-character/        # Character creation
│       │
│       └── dashboard/               # Main game interface
│           ├── +layout.svelte       # Dashboard layout (with nav)
│           ├── +layout.server.ts    # Load character data (SSR)
│           ├── +page.svelte         # Dashboard home (adventure log)
│           │
│           ├── character/           # Character sheet
│           ├── inventory/           # Inventory management
│           ├── quests/              # Quest journal
│           ├── map/                 # World map
│           ├── market/              # Global market
│           ├── crafting/            # Crafting interface
│           ├── factions/            # Faction reputation
│           ├── society/             # Social features
│           └── admin/               # Admin panel
│
├── static/                          # Static assets
│   ├── images/                      # Game images
│   └── favicon.png                  # Favicon
│
├── package.json                     # Dependencies
├── svelte.config.js                 # SvelteKit config
├── vite.config.ts                   # Vite config
├── tailwind.config.js               # TailwindCSS config
├── tsconfig.json                    # TypeScript config
└── README.md                        # This file
```

---

## 💻 Разработка

### Команды

```bash
# Запустить dev server (HMR включен)
npm run dev

# Build для production
npm run build

# Preview production build локально
npm run preview

# Type checking
npm run check

# Type checking в watch режиме
npm run check:watch
```

### Создание новой страницы

```bash
# Создать директорию для новой страницы
mkdir -p src/routes/new-page

# Создать +page.svelte
touch src/routes/new-page/+page.svelte
```

Пример `+page.svelte`:
```svelte
<script lang="ts">
  import { _ } from 'svelte-i18n';
  
  let count = $state(0);
</script>

<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold">{$_('newPage.title')}</h1>
  <button class="skyrim-btn" onclick={() => count++}>
    Count: {count}
  </button>
</div>
```

### Server-side Data Loading

Создайте `+page.server.ts` для SSR:

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
  const sessionToken = cookies.get('session_token');
  
  const response = await fetch('http://localhost:5000/api/data', {
    headers: { Cookie: `session_token=${sessionToken}` }
  });
  
  const data = await response.json();
  
  return { data };
};
```

---

## 🔌 API Integration

### API Client

Используйте встроенный API client из `$lib/api.ts`:

```typescript
import { api } from '$lib/api';

// Get character quests
const quests = await api.getQuests(characterId);

// Equip item
await api.equipItem(characterId, itemId);

// Perform divine intervention
await api.performIntervention(characterId, 'bless');
```

### Custom API Call

```typescript
import { fetchAPI } from '$lib/api';

const data = await fetchAPI('/api/custom-endpoint', {
  method: 'POST',
  body: JSON.stringify({ param: 'value' })
});
```

### CSRF Protection

CSRF токены обрабатываются автоматически API client'ом:
- Cookie `csrf_token` получается от backend
- Header `x-csrf-token` добавляется автоматически для POST/PUT/DELETE

---

## 🌐 Realtime Events

### WebSocket Connection

```typescript
import { realtime, isConnected, realtimeEvents } from '$lib/realtime';
import { onMount, onDestroy } from 'svelte';

onMount(() => {
  // Подключиться к WebSocket
  realtime.connect('global', characterId);
  
  // Подписаться на specific event type
  realtime.subscribe('character:level_up');
});

onDestroy(() => {
  realtime.disconnect();
});
```

### Listen to Events

```svelte
<script lang="ts">
  import { realtimeEvents, isConnected } from '$lib/realtime';
  
  $effect(() => {
    const lastEvent = $realtimeEvents[$realtimeEvents.length - 1];
    if (lastEvent?.type === 'character:level_up') {
      console.log('Level up!', lastEvent.data);
    }
  });
</script>

{#if $isConnected}
  <div class="badge badge-success">Online</div>
{:else}
  <div class="badge badge-error">Offline</div>
{/if}

{#each $realtimeEvents.slice(-10) as event}
  <div class="event">{event.type}</div>
{/each}
```

### Available Events

- `tick:update` - Character tick update (legacy)
- `game:event` - Generic game event
- `character:*` - Character events (level_up, death, etc.)
- `quest:*` - Quest events (started, completed, etc.)
- `combat:*` - Combat events
- `market:*` - Market price updates
- `divine:*` - Divine interventions

---

## 🌍 Интернационализация

### Поддерживаемые языки

- 🇷🇺 Русский (по умолчанию)
- 🇬🇧 English

### Использование переводов

```svelte
<script lang="ts">
  import { _ } from 'svelte-i18n';
</script>

<h1>{$_('dashboard.title')}</h1>
<p>{$_('character.health')}: {health}</p>
```

### Добавление новых переводов

Редактируйте файлы:
- `src/lib/i18n/ru.json`
- `src/lib/i18n/en.json`

```json
{
  "newFeature": {
    "title": "Новая функция",
    "description": "Описание функции"
  }
}
```

### Смена языка

```typescript
import { locale } from 'svelte-i18n';

// Изменить язык
$locale = 'en';
```

---

## 🎨 Стилизация

### Elder Scrolls Theme

Проект использует кастомную тему в стиле Elder Scrolls:

```css
/* Colors */
skyrim-blue: #2C5F9F    /* Primary */
skyrim-gold: #D4AF37    /* Secondary/Accent */
skyrim-dark: #1a1a1a    /* Background */
skyrim-gray: #3a3a3a    /* Secondary BG */
```

### Custom Components

```html
<!-- Skyrim-styled card -->
<div class="skyrim-card">
  <h2 class="text-skyrim-gold">Title</h2>
  <p>Content</p>
</div>

<!-- Skyrim-styled button -->
<button class="skyrim-btn">Action</button>

<!-- Skyrim-styled badge -->
<span class="skyrim-badge">Level 5</span>
```

### DaisyUI Components

Используйте все компоненты [DaisyUI](https://daisyui.com/components/):

```html
<button class="btn btn-primary">Primary</button>
<div class="card bg-base-200">Card content</div>
<div class="badge badge-success">Success</div>
<progress class="progress progress-primary" value="70" max="100"></progress>
```

### TailwindCSS Utilities

```html
<div class="flex items-center justify-between p-4 rounded-lg bg-base-200">
  <span class="text-lg font-bold">Text</span>
</div>
```

---

## 📦 State Management

### Stores

Используйте Svelte stores для глобального состояния:

```typescript
// Import store
import { character } from '$stores/character';

// Read store value (reactive)
$character.name

// Update store
character.update(char => ({
  ...char,
  level: char.level + 1
}));
```

### Derived Stores

```typescript
import { isAlive, healthPercent } from '$stores/character';

// Auto-updates when character changes
console.log($isAlive);        // true/false
console.log($healthPercent);  // 0-100
```

### Custom Store

```typescript
import { writable } from 'svelte/store';

export const myStore = writable(initialValue);

// Subscribe
const unsubscribe = myStore.subscribe(value => {
  console.log(value);
});

// Update
myStore.set(newValue);
myStore.update(v => v + 1);
```

---

## 🚢 Deployment

### Build для Production

```bash
npm run build
```

Результат в `.svelte-kit/output/` (с adapter-node).

### Environment Variables для Production

Создайте `.env.production`:

```env
VITE_API_BASE=https://api.yourdomain.com
VITE_WS_URL=wss://ws.yourdomain.com
```

### Запуск Production Build

```bash
npm run preview
```

Или с Node.js:

```bash
node .svelte-kit/output/server/index.js
```

### Docker (опционально)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .svelte-kit/output ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/index.js"]
```

---

## 🔧 Configuration

### Svelte Config

`svelte.config.js`:
```javascript
import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter(),
    alias: {
      $lib: './src/lib',
      $stores: './src/lib/stores',
      // ... custom aliases
    }
  }
};
```

### Vite Config

`vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
});
```

### Tailwind Config

`tailwind.config.js`:
```javascript
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['skyrim'] // Custom theme
  }
};
```

---

## 🧪 Testing (TODO)

```bash
# Unit tests with Vitest
npm run test

# E2E tests with Playwright
npm run test:e2e
```

---

## 📚 Полезные ссылки

### Документация
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [DaisyUI Components](https://daisyui.com/components/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Tabler Icons](https://tabler-icons.io/)

### Проект
- [API Reference](/docs/API_REFERENCE.md)
- [Migration Plan](/docs/MIGRATION_PLAN.md)
- [Backend Docs](../README.md)

---

## 🐛 Troubleshooting

### "Failed to fetch" ошибки

1. Проверьте, что backend запущен:
   ```bash
   curl http://localhost:5000/api/health
   ```

2. Проверьте `.env` файл

3. Проверьте CORS headers в Network tab браузера

### WebSocket не подключается

1. Проверьте realtime server:
   ```bash
   # Должен слушать на порту 5050
   lsof -i :5050
   ```

2. Проверьте Redis:
   ```bash
   redis-cli ping
   ```

3. Проверьте консоль браузера на ошибки

### CSRF token errors

1. Убедитесь, что `credentials: 'include'` используется
2. Проверьте, что CSRF cookie установлен
3. Проверьте backend middleware

### TypeScript errors

```bash
# Пересоздать .svelte-kit для обновления types
rm -rf .svelte-kit
npm run dev
```

---

## 🤝 Contributing

1. Fork проект
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

---

## 📄 License

Этот проект для внутреннего использования.

---

## 👥 Authors

- **AI Assistant** - Initial setup and migration
- **Your Team** - Feature development

---

## 🎮 Enjoy the game!

Погрузитесь в мир The Elder Scrolls с нашей Godville-inspired игрой! 🗡️🛡️⚔️

---

**Версия**: 1.0.0  
**Последнее обновление**: 2025-10-30
