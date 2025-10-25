## Стек проекта

Короткий обзор используемых технологий (Backend + Frontend) и ключевых модулей.

### Frontend
- **Фреймворк**: Next.js 15 (App Router) + React 18 (`src/app/*`, `next.config.ts`)
- **UI и стили**: Tailwind CSS + `tailwindcss-animate`; Radix UI; шадCN-компоненты (структура `components/*`, `components.json`)
- **Анимации**: Framer Motion
- **Формы и валидация**: React Hook Form + Zod
- **Визуализации и графы**: Recharts, React Flow
- **Realtime-клиент**: `socket.io-client` (WS-ивенты от бэкенда)
- **Маршрутизация API**: Next.js Route Handlers в `src/app/api/*`
- **Прочее**: `clsx`, `class-variance-authority`, `lucide-react`, `react-day-picker`, `react-zoom-pan-pinch`

### Backend
- **Runtime/Язык**: Node.js + TypeScript (строгий режим)  
  Конфигурация в `tsconfig.json`, ESLint включен (игнор ошибок на билде для CI в `next.config.ts`).
- **Web/API**: Next.js API-роуты в `src/app/api/*` (middleware с CSRF и rate limit — `src/middleware.ts`).
- **БД**: PostgreSQL + Drizzle ORM  
  Схема — `shared/schema.ts`; миграции/артефакты — `drizzle/*`; конфиг — `drizzle.config.ts`.
- **Кэш/очереди/стриминг**: Redis (ioredis)  
  Подключение/health — `server/redis.ts`.
- **Очереди задач**: BullMQ v5 + Redis  
  Очереди: `ticks` (`server/queues/tickQueue.ts`) и `digests` (`server/queues/digestQueue.ts`);  
  Продюсеры: `server/producers/*`; Воркеры: `server/workers/*`; раннер — `server/run-worker.ts`.  
  Режимы: legacy-петля (`server/background-worker.ts`) или BullMQ (вкл через `FEATURE_BULLMQ=true`).
- **Realtime (WS)**: Socket.IO сервер `server/realtime.ts` с Redis adapter (`@socket.io/redis-adapter`),
  публикации идут через Redis-канал `ws:tick`.
- **Отправка дайджестов/Telegram**: `server/digest/*`, интеграция через Telegram Bot API,
  ежедневные рассылки планируются продюсером `startDigestProducer`.
- **Трейсинг/логирование**: Легковесный логгер `server/logger.ts`; заглушка OTEL `server/otel.ts`.

### Тесты и качество
- **Тесты**: Vitest (`vitest.config.ts`, `tests/*.test.ts`)
- **Линтинг**: ESLint (конфиг Next), проверки отключены на билде для быстроты CI (`next.config.ts`).

### Конфигурация и окружение
- **ENV**: загрузка из `.env*` через `server/load-env.ts` (`dotenv`)
- **Ключевые переменные**:  
  `DATABASE_URL`, `REDIS_URL`, `WS_PORT`, `WS_URL`, `FEATURE_BULLMQ`,  
  `QUEUE_CONCURRENCY`, `TELEGRAM_ENABLED`, `TELEGRAM_BOT_TOKEN`, `DIGEST_HOUR_UTC`.

### Основные npm-скрипты
- `dev`: Next dev-сервер (порт 5000)
- `worker`: запуск воркера очередей/legacy-петли (`server/run-worker.ts`)
- `realtime`: Socket.IO сервер (`server/realtime.ts`)
- `dev:all` / `start:all`: фронт + воркер + realtime параллельно
- `db:*`: операции Drizzle (`push`, `generate`, `studio`)
- `test`: запуск Vitest

### Файлы/директории для ориентира
- `src/app/*`: страницы, layout, API-роуты
- `src/components/*`: UI-компоненты
- `src/actions/*`: серверные экшены
- `server/*`: фоновые процессы, очереди, realtime, интеграции
- `shared/schema.ts`: схема БД Drizzle
- `drizzle/*`: миграции и сгенерированные артефакты


Комментарий:
Что улучшить в первую очередь (быстрые победы)
Включить проверки на билде: убрать ignoreBuildErrors и eslint.ignoreDuringBuilds; хотя бы на prod-сборке.
Заменить in-memory rate limit на Redis-бакеты; корректно определять IP за прокси.
Усилить CSRF: привязка токена к сессии/пользователю, сквозная валидация только где нужно (не на всех GET/HEAD/OPTIONS ок).
Исправить leader election: хранить токен владельца и продлевать TTL (или использовать готовую библиотеку).
Ограничить CORS для WS: whitelist доменов, при необходимости — auth хэндшейк.
Добавить базовый OTEL/метрики (очереди: длина, задержка, retry; WS: соединения/комнаты/исключения).
Пересмотреть необходимость eval или изолировать использование.
Расширить тесты: критические пути тик-цикла, продюсеры/воркеры, API-ручки, авторизация.
Вкратце: стек современный и хорошо масштабируется по очередям и realtime, но сейчас качество и безопасность страдают из‑за отключённых проверок, нераспределённого rate-limit/CSRF и «мигающего» лидерства. Эти пункты можно быстро закрыть без больших архитектурных переделок.

