# ⚡ Quick Start Checklist

**Проверьте это перед первым запуском!**

---

## ✅ Pre-launch Checklist

### 1. Установить зависимости SvelteKit (если не установлены)
```bash
cd /workspace/sveltekit
npm install
```

### 2. Создать .env файлы

**Backend** (`/workspace/.env`):
```bash
cd /workspace
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:password@localhost:5432/skyrim_game
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
EOF
```

**Frontend** (`/workspace/sveltekit/.env`):
```bash
cd /workspace/sveltekit
cat > .env << 'EOF'
PUBLIC_API_URL=http://localhost:5000
PUBLIC_WS_URL=http://localhost:5000
EOF
```

### 3. Проверить PostgreSQL
```bash
psql -U postgres -c "SELECT 1"
```

Если не работает:
```bash
sudo service postgresql start
# или
pg_ctl -D /path/to/data start
```

### 4. Redis (опционально - запустится автоматически)
```bash
redis-cli ping
```

---

## 🚀 Запуск

### Вариант 1: Всё в одной команде (рекомендуется)
```bash
cd /workspace
npm run dev:all
```

Это запустит:
- ✅ Backend API (Next.js) на порту 5000
- ✅ Worker процесс
- ✅ Realtime WebSocket server
- ✅ Frontend (SvelteKit) на порту 5173

### Вариант 2: Раздельно (для дебага)
```bash
# Terminal 1: Backend
cd /workspace
npm run dev:backend

# Terminal 2: Frontend
cd /workspace
npm run dev:frontend
```

---

## 🌐 Открыть в браузере

```
http://localhost:5173
```

---

## 🧪 Первый тест

1. ✅ Зарегистрироваться
2. ✅ Войти
3. ✅ Создать персонажа (4 шага)
4. ✅ Увидеть Dashboard
5. ✅ Проверить WebSocket (должны приходить события)

---

## 🔧 Если что-то не работает

### Frontend не загружается
```bash
# Проверить, что backend запущен
curl http://localhost:5000/api/health

# Проверить консоль браузера (F12)
```

### Backend не запускается
```bash
# Проверить PostgreSQL
psql -U postgres -c "SELECT 1"

# Проверить логи
cd /workspace
npm run dev
```

### CORS ошибки
Проверить, что в `src/middleware.ts` есть:
```typescript
if (origin === 'http://localhost:5173') {
  // Allow CORS
}
```

### WebSocket не подключается
```bash
# Проверить, что Realtime server запущен
# Должен быть в выводе npm run dev:all
```

---

## 📊 Должно быть запущено

После `npm run dev:all`:

```
✅ Next.js API       http://localhost:5000
✅ Worker process    (в фоне)
✅ Realtime WS       (в фоне)
✅ SvelteKit        http://localhost:5173
✅ PostgreSQL        localhost:5432
✅ Redis             localhost:6379
```

---

## 🎯 Что тестировать

### Страницы
- `/` - Home
- `/register` - Регистрация
- `/login` - Вход
- `/create-character` - Создание персонажа
- `/dashboard` - Главная
- `/dashboard/character` - Характеристики
- `/dashboard/inventory` - Инвентарь
- `/dashboard/quests` - Квесты
- `/dashboard/map` - Карта (Leaflet)
- `/dashboard/market` - Рынок
- `/dashboard/crafting` - Крафт
- `/dashboard/factions` - Фракции
- `/dashboard/society` - Общество
- `/admin` - Админ панель

### Функции
- ✅ Real-time events (WebSocket)
- ✅ Divine intervention
- ✅ Character progression
- ✅ Inventory management
- ✅ Quest tracking
- ✅ Map navigation
- ✅ Market trading
- ✅ Crafting items
- ✅ Faction reputation

---

## 📚 Документация

- [FINAL_README.md](FINAL_README.md) - Полное руководство
- [FINAL_ANALYSIS.md](FINAL_ANALYSIS.md) - Анализ и проблемы
- [MIGRATION_100_COMPLETE.md](MIGRATION_100_COMPLETE.md) - Обзор миграции

---

## 🎊 Готово!

Если всё работает - поздравляю! 🎉

Система полностью готова к использованию!

---

**Дата**: 2025-10-30  
**Версия**: Quick Start v1.0  
**Статус**: ✅ Ready!
