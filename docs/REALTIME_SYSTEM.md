
# Real-time Event-Driven System Documentation

## Overview

Реализована event-driven архитектура с мгновенными WebSocket broadcasts для всех изменений состояния игры. Клиент стал чистым view layer, автоматически получающим обновления через WebSocket события.

## Что уже реализовано

### ✅ Фаза 1: Базовая инфраструктура

1. **Event Bus** (`server/events/event-bus.ts`)
   - Централизованная система публикации событий через Redis pub/sub
   - Поддержка batch публикаций для оптимизации
   - Rate limiting (100 событий/сек на категорию)
   - Публикация в multiple channels для гибкой маршрутизации

2. **Event Types** (`server/events/event-types.ts`)
   - Типизированные события для всех категорий:
     - Character events (stats, location, status, inventory, level, power, effects)
     - Market events (price updates, trades, supply changes)
     - Divine events (intervention, messages, grace)
     - Companion events (hired, activated, dismissed, stats updates)
     - Quest events (accepted, progress, completed, tasks)

3. **Command Handler** (`server/commands/command-handler.ts`)
   - Базовый handler с автоматической публикацией событий
   - Валидация и rate limiting
   - Атомарность: если команда провалилась, события не публикуются

4. **WebSocket Server** (`server/realtime.ts`)
   - Расширен для broadcast событий по комнатам:
     - `realm:{realmId}` - для игроков одного realm
     - `char:{characterId}` - для персональных обновлений
     - `market:global` - для глобального рынка
   - Поддержка legacy `tick:update` для обратной совместимости
   - Клиенты могут подписываться на specific event types

### ✅ Фаза 2: Core Systems

5. **Divine Intervention Commands** (`server/commands/divine-intervention.ts`)
   - Божественное вмешательство (bless/punish)
   - Божественные сообщения
   - Real-time broadcast энергии и stats изменений
   - Интеграция в `src/app/dashboard/actions.ts` и `src/app/api/divine/message/route.ts`

### ✅ Фаза 3: Market System

6. **NPC Trade Commands** (`server/commands/npc-trade.ts`)
   - Торговля с NPC (buy/sell)
   - Real-time broadcast изменений inventory
   - Событие `market:trade:completed` для аналитики
   - Интеграция в `src/actions/npc-actions.ts`

7. **Market Price Updates** (`src/services/economy.service.ts`)
   - Автоматическая публикация `market:price:updated` при изменении цен >1%
   - Broadcast для всех клиентов в `market:global` комнате

### ✅ Client-side Integration

8. **Real-time State Hook** (`src/hooks/use-realtime-state.ts`)
   - `useRealtimeState()` - автообновление character state
   - `useRealtimeMarket()` - отслеживание цен рынка
   - Автоматическая обработка всех character events
   - Fallback на legacy `tick:update`

## Как использовать

### Server-side: Создание команд

```typescript
// server/commands/my-command.ts
import { executeCommand, type CommandContext, type CommandResult } from './command-handler';

export async function myCommand(
  userId: string,
  input: MyInput
): Promise<CommandResult<MyOutput>> {
  // Validation
  const validationError = validateRequired(input, ['field1', 'field2']);
  if (validationError) return validationError;

  const character = await storage.getCharacterById(userId);
  const ownershipError = validateCharacterOwnership(character, userId);
  if (ownershipError) return ownershipError;

  const context: CommandContext = {
    userId,
    characterId: userId,
    realmId: character.realmId || 'global',
    timestamp: Date.now(),
  };

  return executeCommand(
    async (input, ctx) => {
      // Your logic here
      const updatedChar = ...;
      
      await storage.saveCharacter(updatedChar);

      // Prepare events
      const events = [
        {
          type: 'character:stats:updated',
          payload: {
            characterId: ctx.characterId,
            stats: updatedChar.stats,
          },
        },
      ];

      return {
        success: true,
        data: { character: updatedChar },
        events,
      };
    },
    input,
    context
  );
}
```

### Client-side: Использование real-time hooks

```typescript
// In your component
import { useRealtimeState } from '@/hooks/use-realtime-state';

export function MyComponent() {
  const { character, isConnected, lastEvent } = useRealtimeState(
    initialCharacter,
    {
      characterId: user.id,
      realmId: 'global',
      onEvent: (type, data) => {
        // Custom event handling
        console.log('Received event:', type, data);
        
        if (type === 'character:level:up') {
          toast.success(`Level up! New level: ${data.newLevel}`);
        }
      },
    }
  );

  return (
    <div>
      <div>Connection: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      <div>HP: {character?.stats.health.current}/{character?.stats.health.max}</div>
      <div>Power: {character?.interventionPower.current}/{character?.interventionPower.max}</div>
    </div>
  );
}
```

### Публикация событий вручную

```typescript
// Anywhere in server code
import { eventBus } from '@/../server/events/event-bus';

await eventBus.publish(
  'character:stats:updated',
  {
    characterId: 'user-123',
    stats: {
      health: { current: 100, max: 100 },
    },
  },
  'global', // realmId
  'user-123' // characterId
);
```

### Batch публикация

```typescript
await eventBus.publishBatch([
  {
    type: 'character:stats:updated',
    payload: { characterId: 'user1', stats: {...} },
    realmId: 'global',
    characterId: 'user1',
  },
  {
    type: 'character:inventory:updated',
    payload: { characterId: 'user1', changes: [...] },
    realmId: 'global',
    characterId: 'user1',
  },
]);
```

## Что осталось сделать

### Фаза 4: Companions & Quests

- [ ] Создать `server/commands/companion.ts` для команд компаньонов
- [ ] Создать `server/commands/quest.ts` для команд квестов
- [ ] Мигрировать `src/actions/companion-actions.ts` на команды
- [ ] Мигрировать quest API routes на команды

### Фаза 5: Character Actions

- [ ] Добавить broadcast для перемещения персонажа
- [ ] Добавить broadcast для изменения статуса
- [ ] Добавить broadcast для изменений inventory (уже частично есть)

### Фаза 6: Integration

- [ ] Интегрировать Background Worker с Event Bus
  - AI тики должны публиковать события через eventBus
  - Разделить AI actions (тики) и player actions (instant)
- [ ] Добавить delta updates оптимизацию
  - Отправлять только изменённые поля, не полные объекты
- [ ] Настроить rate limiting и batching для оптимизации
  - Throttle broadcast частоты (max 10/sec per room)

## Архитектурные решения

### Разделение AI и Player Actions

**AI Tick (15-40s):**
```
Background Worker → processGameTick() → saves to DB → emits events → WS broadcast
```

**Player Action (instant):**
```
Client → API Route → Command Handler → saves to DB → emits events → WS broadcast
```

Оба потока используют один event bus, что обеспечивает консистентность.

### Event Routing

События публикуются в multiple channels:
- `game:events:all` - все события (для админов/мониторинга)
- `game:events:realm:{realmId}` - события realm
- `game:events:char:{characterId}` - персональные события
- `game:events:category:{category}` - события категории (market, divine, etc)

WebSocket сервер подписывается на все каналы и маршрутизирует в Socket.IO rooms.

### Rate Limiting

- Event Bus: 100 событий/сек на категорию
- API routes: custom per endpoint (через Redis)
- Предотвращает spam и защищает от DDoS

### Backward Compatibility

- Legacy `tick:update` события сохранены
- Старые Server Actions работают (будут мигрированы постепенно)
- Client может использовать polling fallback если WS недоступен

## Performance Considerations

### Для 100-1000 игроков:

1. **Room-based broadcasts** - события отправляются только в релевантные rooms
2. **Delta updates** - планируется отправлять только изменения
3. **Redis pub/sub** - горизонтальное масштабирование ready out of the box
4. **Rate limiting** - защита от перегрузки
5. **Batch publishing** - объединение events для эффективности

### Мониторинг:

Логи в консоли:
- `[EventBus] Published {type} to {n} channels` - успешная публикация
- `[Realtime] Broadcasted {type} to {n} rooms` - broadcast клиентам
- `[RealtimeState] Received event: {type}` - получение на клиенте

## Troubleshooting

### WebSocket не подключается

1. Проверьте `NEXT_PUBLIC_WS_ENABLED=true` в `.env`
2. Проверьте `NEXT_PUBLIC_WS_URL` указывает на WebSocket сервер
3. Запущен ли `npm run realtime`?
4. Redis доступен?

### События не доходят до клиента

1. Проверьте консоль браузера на `[RealtimeState] Connected`
2. Проверьте server logs на `[EventBus] Published`
3. Проверьте правильность `characterId` и `realmId`
4. Проверьте что клиент в правильной room

### События публикуются, но state не обновляется

1. Проверьте `useRealtimeState` используется в компоненте
2. Проверьте event handlers в hook
3. Проверьте `characterId` совпадает в payload и в character

## Migration Guide

### Миграция Server Action на Command

1. Создайте command в `server/commands/`
2. Перенесите бизнес-логику в command handler
3. Добавьте events в return value
4. Обновите Server Action чтобы вызывал command
5. Протестируйте что события публикуются

### Миграция компонента на Real-time

1. Import `useRealtimeState` hook
2. Замените `useState(initialCharacter)` на `useRealtimeState(initialCharacter, options)`
3. Удалите manual refetch calls (state updates автоматически)
4. Добавьте UI индикатор connection status
5. Опционально: добавьте toast notifications для событий

## Examples

См. уже мигрированные системы:
- Divine intervention: `server/commands/divine-intervention.ts` + `src/app/dashboard/actions.ts`
- NPC trade: `server/commands/npc-trade.ts` + `src/actions/npc-actions.ts`
- Market prices: `src/services/economy.service.ts`

## Support

При возникновении проблем:
1. Проверьте консоли browser и server на ошибки
2. Проверьте Redis connection
3. Проверьте WebSocket connection status
4. Создайте issue с логами

