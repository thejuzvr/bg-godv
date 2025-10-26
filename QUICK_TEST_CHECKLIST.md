# ⚡ Quick Test Checklist - Real-time System

## 🚀 Быстрая проверка (5 минут)

### 1. Запуск (1 мин)
```bash
npm run dev:all
```

Должны увидеть:
```
[1] [Realtime] Socket.IO server listening on :5050
[2] [Background Worker] Starting background worker...
[0] Ready in XXXms
```

### 2. Открыть Dashboard (10 сек)

Правый верхний угол:
- ✅ Видите "🟢 Real-time подключён"? → **ОК!**
- ❌ Видите "⚪ Polling mode"? → **Проверьте .env**

### 3. Консоль браузера (10 сек)

Нажмите F12 → Console, должно быть:
```
✅ [RealtimeState] Connected to WebSocket
✅ [RealtimeState] WebSocket handshake complete
```

Если нет - проверьте что `npm run realtime` запущен.

### 4. Тест Divine Intervention (30 сек)

1. Запомните текущую энергию (например, 50/100)
2. Нажмите "Благословить"
3. **Проверьте**:
   - ✅ Энергия моментально стала 0/100 (или меньше)
   - ✅ Никакого отката обратно!
   - ✅ Stats (HP/MP) изменились мгновенно
   - ✅ Toast notification появился

**Консоль должна показать:**
```
✅ [RealtimeState] Received event: divine:intervention:performed
✅ [RealtimeState] Received event: character:power:updated
✅ [RealtimeState] Received event: character:stats:updated
```

### 5. Тест Temple Donation (30 сек)

1. Перейдите в Factions
2. Запомните temple progress (например, 0.0050%)
3. Сделайте donation 100 gold
4. **Вернитесь в Dashboard** (или обновите страницу)
5. **Проверьте**:
   - ✅ Temple progress увеличился (например, 0.0051%)
   - ✅ Gold уменьшился на 100
   - ✅ Никаких откатов!

**Консоль должна показать:**
```
✅ [RealtimeState] Received event: character:inventory:updated
✅ [RealtimeState] Received event: character:stats:updated
```

### 6. Тест Multiple Windows (1 мин)

1. Откройте Dashboard в двух окнах браузера
2. В **первом окне** сделайте Divine Intervention
3. **Во втором окне** (НЕ обновляя страницу):
   - ✅ Энергия обновилась мгновенно
   - ✅ Stats обновились
   - ✅ Оба окна показывают одинаковое состояние

**Если работает - система полностью real-time! 🎉**

### 7. Тест AI Tick (30 сек)

1. Просто подождите 15-40 секунд
2. **Проверьте**:
   - ✅ Adventure log добавилось новое событие
   - ✅ Stats могли измениться (regen)
   - ✅ Возможно изменился location
   - ✅ Toast может появиться (если level up)

**Консоль покажет:**
```
✅ [RealtimeState] Received event: character:stats:updated
```

## ✅ Все тесты пройдены?

**Поздравляю! Real-time система работает на 100%! 🎊**

## ❌ Что-то не работает?

### "⚪ Polling mode" вместо "🟢 Real-time"

**Fix:**
1. Остановите все процессы (Ctrl+C)
2. Проверьте `.env`:
```env
NEXT_PUBLIC_WS_ENABLED=true
NEXT_PUBLIC_WS_URL=ws://localhost:5050
```
3. Перезапустите: `npm run dev:all`

### Консоль не показывает "[RealtimeState] Connected"

**Fix:**
1. Проверьте что WebSocket сервер запущен:
```bash
npm run realtime
```

2. Проверьте что Redis работает:
```bash
redis-cli ping
# Должно вернуть: PONG
```

3. Проверьте Network tab в DevTools - должен быть WebSocket connection

### События в консоли есть, но UI не обновляется

**Fix:**
1. Проверьте что Dashboard использует `useRealtimeState`
2. Проверьте что `isConnected=true`
3. Hard refresh (Ctrl+Shift+R) браузера
4. Проверьте что `characterId` совпадает

### Состояние откатывается назад

**Причина:** Concurrent updates или неправильный priority

**Fix:**
Убедитесь что используется:
```typescript
const character = isConnected && realtimeChar ? realtimeChar : gameLoopChar;
```

При `isConnected=true`, real-time имеет приоритет!

## 📞 Быстрая диагностика

```bash
# 1. Redis работает?
redis-cli ping

# 2. WebSocket сервер запущен?
curl http://localhost:5050
# Или проверьте процессы:
ps aux | grep realtime

# 3. Все сервисы запущены?
# Должно быть 3 процесса:
# - Next.js dev server (port 5000)
# - Background worker
# - WebSocket server (port 5050)
```

## 🎯 Expected Behavior

### Divine Intervention:
```
Click "Благословить" →
  Energy: 100 → 50 (instant, no rollback)
  HP: 80 → 150 (instant)
  Toast: "⚡ Божественное вмешательство"
  Console: 3x "[RealtimeState] Received event"
```

### Temple Donation:
```
Donate 100 gold →
  Gold: 1000 → 900 (instant, no rollback)
  Temple: 0.005% → 0.010% (instant)
  Console: 2x "[RealtimeState] Received event"
```

### NPC Trade:
```
Buy 1x Potion →
  Gold: 1000 → 950 (instant, no rollback)
  Inventory: +1 Potion (instant)
  Console: 1x "[RealtimeState] Received event"
```

## ✅ Success Criteria

Если **ВСЕ** тесты выше прошли успешно:

- ✅ Real-time system работает полностью
- ✅ Откаты исправлены
- ✅ Temple donations работают
- ✅ События доходят до клиента
- ✅ Multiple windows синхронизированы
- ✅ AI ticks broadcast события

**СИСТЕМА ГОТОВА! 🎉**

---

**Время тестирования**: ~5 минут  
**Результат**: Production Ready 🚀

