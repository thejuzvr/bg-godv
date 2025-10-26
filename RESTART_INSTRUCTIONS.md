# 🔄 Инструкции по перезапуску

## ✅ .env исправлен!

Изменения:
```diff
- NEXT_PUBLIC_WS_URL=http://localhost:5050
+ NEXT_PUBLIC_WS_ENABLED=true
+ NEXT_PUBLIC_WS_URL=ws://localhost:5050
```

## 🚀 Как перезапустить

### Вариант 1: Все сразу (Рекомендуется)

1. **Остановите все процессы** (Ctrl+C во всех терминалах)
2. **Запустите заново**:
```bash
npm run dev:all
```

### Вариант 2: По отдельности

**Terminal 1: Next.js**
```bash
# Остановите (Ctrl+C)
npm run dev
```

**Terminal 2: Background Worker**
```bash
# Остановите (Ctrl+C)
npm run worker
```

**Terminal 3: WebSocket Server**
```bash
# Остановите (Ctrl+C)
npm run realtime
```

## ✅ Проверка после перезапуска

### 1. Проверьте логи WebSocket сервера:
```
[Realtime] Socket.IO server listening on :5050
[Realtime] Real-time event broadcasting enabled
[Realtime] Subscribed to game:events:all
[Realtime] Subscribed to game:events:realm:global
...
```

### 2. Откройте Dashboard

**Должны увидеть:**
```
🟢 Real-time подключён
```

**Если всё ещё "⚪ Polling mode":**
1. Откройте консоль браузера (F12)
2. Проверьте Network tab → WS (WebSocket connections)
3. Должно быть подключение к `ws://localhost:5050`

**Если в консоли ошибка:**
```javascript
WebSocket connection to 'ws://localhost:5050' failed
```
→ Убедитесь что `npm run realtime` запущен!

### 3. Проверьте консоль браузера

**Должно быть:**
```
✅ [RealtimeState] Connected to WebSocket
✅ [RealtimeState] WebSocket handshake complete: {realmId: 'global', characterId: '...'}
```

### 4. Тест Divine Intervention

1. Нажмите "Благословить"
2. **Проверьте**:
   - ✅ Энергия изменилась **мгновенно**
   - ✅ **БЕЗ откатов**
   - ✅ Toast notification появился
   - ✅ В консоли: `[RealtimeState] Received event: divine:intervention:performed`

### 5. Тест Temple Donation

1. Перейдите в Factions
2. Сделайте donation 100 gold
3. **Вернитесь в Dashboard**
4. **Проверьте**:
   - ✅ Temple progress обновился **instant**
   - ✅ Gold изменился **без откатов**
   - ✅ В консоли: `[RealtimeState] Received event: character:stats:updated`

## 🎯 Ожидаемый результат

После перезапуска:
- ✅ Dashboard показывает "🟢 Real-time подключён"
- ✅ Консоль браузера: `[RealtimeState] Connected to WebSocket`
- ✅ Divine intervention работает без откатов
- ✅ Temple donations обновляются instant
- ✅ Все events в консоли: `[RealtimeState] Received event: ...`

## ❌ Если не помогло

### Проблема: WebSocket сервер не запускается

**Проверьте Redis:**
```bash
redis-cli ping
```

Должно вернуть: `PONG`

Если нет - запустите Redis или проверьте `REDIS_URL` в .env

### Проблема: "⚪ Polling mode" всё ещё

**Проверьте .env после изменений:**
```bash
# PowerShell:
Get-Content .env | Select-String -Pattern "NEXT_PUBLIC_WS"

# Должно показать:
# NEXT_PUBLIC_WS_ENABLED=true
# NEXT_PUBLIC_WS_URL=ws://localhost:5050
```

**Hard refresh браузера:**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Проблема: Console ошибки WebSocket

**Проверьте что порт 5050 свободен:**
```bash
netstat -an | findstr 5050
```

Должна быть строка с `LISTENING`

## 🆘 Быстрая диагностика

```bash
# 1. Redis работает?
redis-cli ping
# → PONG

# 2. WebSocket сервер слушает на 5050?
netstat -an | findstr 5050
# → Должно быть LISTENING

# 3. .env корректный?
Get-Content .env | Select-String -Pattern "WS"
# → NEXT_PUBLIC_WS_ENABLED=true
# → NEXT_PUBLIC_WS_URL=ws://localhost:5050
```

Если всё ✅ - перезапустите `npm run dev:all` и должно заработать!

---

## 📞 Дальше

После перезапуска:
1. Откройте Dashboard
2. Проверьте "🟢 Real-time подключён"
3. Сделайте Divine Intervention
4. Проверьте что энергия **без откатов**

**Если всё работает - система готова! 🎉**

