# Elder Scrolls Game - SvelteKit Frontend

Новый frontend для игры на SvelteKit с поддержкой реал-тайм обновлений через WebSockets.

## Стек технологий

- **SvelteKit** - фреймворк
- **TailwindCSS + DaisyUI** - стилизация
- **Socket.IO** - реал-тайм события
- **svelte-i18n** - интернационализация (ru/en)
- **Tabler Icons** - иконки
- **TypeScript** - типизация

## Установка

```bash
npm install
```

## Запуск

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## Конфигурация

Создайте файл `.env`:

```
VITE_API_BASE=http://localhost:5000
VITE_WS_URL=ws://localhost:5050
```

## Структура проекта

```
src/
├── lib/
│   ├── api.ts              # API client
│   ├── realtime.ts         # WebSocket service
│   ├── i18n/               # Переводы
│   ├── stores/             # Svelte stores
│   ├── types/              # TypeScript types
│   ├── data/               # Game data
│   └── components/         # Shared components
└── routes/                 # Страницы приложения
```

## Миграция с Next.js

См. `/docs/MIGRATION_PLAN.md` для детального плана миграции.

## API Documentation

См. `/docs/API_REFERENCE.md` для полной документации API.
