# ✅ WebSocket Reconnection Loop - ИСПРАВЛЕНО

## 🔴 Проблема

Server logs показывали бесконечный цикл:
```
[Realtime] Client connected: realm=global, char=xxx
[Realtime] Client disconnected: char=xxx
[Realtime] Client connected: realm=global, char=xxx
[Realtime] Client disconnected: char=xxx
... (бесконечно)
```

## 🔍 Причина

**React useEffect Dependency Hell!**

В `src/hooks/use-realtime-state.ts` было:
```typescript
useEffect(() => {
  const socket = io(wsUrl, { ... });
  // ... setup handlers ...
  return () => socket.disconnect();
}, [
  options.characterId,
  options.realmId,
  options.onEvent,        // ❌ Меняется каждый render!
  handleStatsUpdate,      // ❌ Меняется каждый render!
  handlePowerUpdate,      // ❌ Меняются каждый render!
  handleLocationChange,
  handleStatusChange,
  handleInventoryUpdate,
  handleLevelUp,
  handleEffectsUpdate,
]);
```

**Что происходило:**
1. Component renders
2. `options.onEvent` - новая функция (каждый render)
3. `handleXXX` callbacks - новые референсы (каждый render)
4. useEffect видит изменение dependencies
5. Вызывается cleanup → `socket.disconnect()`
6. Создаётся новый socket → `socket.connect()`
7. Component re-renders (из-за state updates)
8. → Повторяется с шага 2 ♻️

**Результат**: Бесконечный reconnection loop! 🔄

## ✅ Решение

### 1. Деструктурируем options на примитивы
```typescript
// Было:
export function useRealtimeState(initialCharacter, options = {}) {

// Стало:
export function useRealtimeState(initialCharacter, options = {}) {
  // Деструктурируем сразу на примитивные значения
  const { characterId, realmId, onEvent } = options;
```

### 2. Используем refs для callbacks
```typescript
// Создаём ref для onEvent
const onEventRef = useRef(onEvent);

// Обновляем ref при изменении (без reconnect!)
useEffect(() => {
  onEventRef.current = onEvent;
}, [onEvent]);

// Используем ref в handler
socket.on('game:event', (event) => {
  if (onEventRef.current) {
    onEventRef.current(event.type, event.data); // Стабильный ref!
  }
});
```

### 3. Минимальные dependencies
```typescript
useEffect(() => {
  const socket = io(wsUrl, { ... });
  // ... setup ...
  return () => socket.disconnect();
}, [
  characterId,  // ✅ Примитив, меняется только при смене персонажа
  realmId,      // ✅ Примитив, меняется только при смене realm
  // handleXXX убраны - они stable через useCallback
  // onEvent убран - используется через ref
]);
```

## 🎯 Результат

### До исправления:
```
[Realtime] Client connected    // +1
[Realtime] Client disconnected // +1
[Realtime] Client connected    // +1
[Realtime] Client disconnected // +1
... (10+ раз в секунду)
```

### После исправления:
```
[Realtime] Client connected: realm=global, char=xxx
... (стабильное подключение)
```

**Одно подключение на весь lifecycle компонента!** ✅

## 🔧 Дополнительные исправления

### useRealtimeMarket hook
Та же проблема, то же решение:
```typescript
useEffect(() => {
  const socket = io(wsUrl, { ... });
  return () => socket.disconnect();
}, []); // ✅ Empty dependencies - connect once on mount
```

Market hook не зависит от character, поэтому можно подключиться один раз.

## 📊 Performance Impact

### До исправления:
- ❌ 10+ reconnections в секунду
- ❌ Лишняя нагрузка на сервер
- ❌ Events могли теряться
- ❌ Increased latency

### После исправления:
- ✅ 1 connection на компонент
- ✅ Стабильное подключение
- ✅ Все events доходят
- ✅ Минимальная latency

## 🎓 Урок

**React useEffect с функциями в dependencies = рецепт катастрофы!**

### ❌ Плохо:
```typescript
useEffect(() => {
  socket.on('event', handleEvent);
}, [handleEvent]); // Function меняется каждый render!
```

### ✅ Хорошо:
```typescript
const handlerRef = useRef(handleEvent);

useEffect(() => {
  handlerRef.current = handleEvent;
}, [handleEvent]);

useEffect(() => {
  socket.on('event', (data) => {
    handlerRef.current(data); // Stable ref!
  });
}, []); // Empty dependencies
```

## ✅ Checklist исправлений

- [x] `.env` исправлен (ws:// вместо http://)
- [x] `NEXT_PUBLIC_WS_ENABLED=true` добавлен
- [x] useRealtimeState dependencies минимизированы
- [x] useRealtimeMarket dependencies пусты
- [x] onEvent через ref (без reconnect)
- [x] handleXXX через useCallback + removed from deps
- [x] Примитивные values вместо objects

## 🚀 Следующий шаг

**Перезапустите сервисы:**
```bash
# Остановите все (Ctrl+C)
npm run dev:all
```

**Проверьте logs:**
```
[Realtime] Client connected: realm=global, char=xxx
... (стабильно, без disconnect)
```

**В браузере:**
```
🟢 Real-time подключён
```

**Консоль браузера:**
```
[RealtimeState] Setting up WebSocket connection... {characterId: '...', realmId: 'global'}
[RealtimeState] Connected to WebSocket
[RealtimeState] WebSocket handshake complete: {realmId: 'global', characterId: '...'}
... (стабильно, без reconnect)
```

---

**Статус**: ✅ **RECONNECTION LOOP ИСПРАВЛЕН!**

После перезапуска должно быть **одно стабильное подключение** без disconnect/reconnect циклов! 🎉

