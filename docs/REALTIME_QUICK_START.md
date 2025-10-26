# Real-time System - Quick Start Guide

## Быстрый старт за 5 минут

### 1. Запуск системы

```bash
# Убедитесь что Redis запущен
# В .env должно быть:
# REDIS_URL=redis://localhost:6379
# NEXT_PUBLIC_WS_ENABLED=true
# NEXT_PUBLIC_WS_URL=ws://localhost:5050

# Запустите все сервисы одной командой:
npm run dev:all

# Или по отдельности:
# Terminal 1:
npm run dev

# Terminal 2:
npm run worker

# Terminal 3:
npm run realtime
```

### 2. Проверка подключения

Откройте браузер и в консоли должны быть логи:
```
[RealtimeState] Connected to WebSocket
[RealtimeState] WebSocket handshake complete: {realmId: 'global', characterId: '...'}
```

### 3. Первое использование - Real-time Character State

```tsx
// src/app/dashboard/page.tsx (или любой компонент)
import { useRealtimeState } from '@/hooks/use-realtime-state';

export default function DashboardPage() {
  const { user } = useAuth();
  
  // OLD WAY (без real-time):
  // const [character, setCharacter] = useState(initialCharacter);
  
  // NEW WAY (с real-time):
  const { character, isConnected, lastEvent } = useRealtimeState(
    initialCharacter,
    {
      characterId: user?.id,
      realmId: 'global',
      onEvent: (type, data) => {
        // Optional: показывать toast при событиях
        if (type === 'character:level:up') {
          toast.success(`🎉 Level ${data.newLevel}!`);
        }
        if (type === 'divine:intervention:performed') {
          toast.info(`⚡ ${data.effect}`);
        }
      }
    }
  );

  // Character state автоматически обновляется!
  // Не нужно вызывать refetch или setState

  return (
    <div>
      {/* Connection indicator */}
      <div className="status">
        {isConnected ? '🟢 Real-time' : '🔴 Offline'}
      </div>

      {/* Stats автоматически обновляются */}
      <div>HP: {character?.stats.health.current}</div>
      <div>MP: {character?.stats.magicka.current}</div>
      <div>Power: {character?.interventionPower.current}</div>
      
      {/* Last event indicator */}
      {lastEvent && (
        <div>Last update: {lastEvent.type}</div>
      )}
    </div>
  );
}
```

### 4. Первая команда - Divine Intervention

Команды уже работают! Просто используйте existing actions:

```tsx
// src/components/DivineInterventionPanel.tsx
export function DivineInterventionPanel() {
  const { user } = useAuth();
  
  const handleBless = async () => {
    // Использует новую command систему под капотом
    const result = await performIntervention(user.id, 'bless');
    
    if (result.success) {
      // Real-time события уже отправлены!
      // Character state обновится автоматически через useRealtimeState()
      toast.success(result.message);
    }
  };

  return (
    <button onClick={handleBless}>
      ⚡ Bless Character
    </button>
  );
}
```

### 5. Проверка работы Real-time

1. Откройте два окна браузера с одним и тем же персонажем
2. В одном окне нажмите "Bless Character"
3. Во втором окне stats должны обновиться **мгновенно** без перезагрузки!

## Создание своей команды

### Шаг 1: Создайте файл команды

```typescript
// server/commands/my-feature.ts
import { executeCommand, validateCharacterOwnership, validateRequired } from './command-handler';
import * as storage from '../storage';

export interface MyFeatureInput {
  action: string;
  value: number;
}

export async function performMyFeature(
  userId: string,
  input: MyFeatureInput
) {
  // Validation
  const validationError = validateRequired(input, ['action', 'value']);
  if (validationError) return validationError;

  const character = await storage.getCharacterById(userId);
  const ownershipError = validateCharacterOwnership(character, userId);
  if (ownershipError) return ownershipError;

  const context = {
    userId,
    characterId: userId,
    realmId: character.realmId || 'global',
    timestamp: Date.now(),
  };

  return executeCommand(
    async (input, ctx) => {
      // Your logic
      const updatedChar = { ...character };
      updatedChar.someField = input.value;
      
      // Save to DB
      await storage.saveCharacter(updatedChar);

      // Define events (будут автоматически опубликованы)
      const events = [
        {
          type: 'character:stats:updated', // или другой существующий тип
          payload: {
            characterId: ctx.characterId,
            stats: updatedChar.stats,
          },
        },
      ];

      return {
        success: true,
        data: { character: updatedChar },
        events, // События автоматически публикуются!
      };
    },
    input,
    context
  );
}
```

### Шаг 2: Создайте API route (или используйте Server Action)

```typescript
// src/app/api/my-feature/route.ts
import { NextRequest } from 'next/server';
import { performMyFeature } from '@/../server/commands/my-feature';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, action, value } = body;

  const result = await performMyFeature(userId, { action, value });

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), { status: 400 });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data: result.data 
  }), { status: 200 });
}
```

### Шаг 3: Используйте на клиенте

```tsx
// src/components/MyFeatureButton.tsx
import { useRealtimeState } from '@/hooks/use-realtime-state';

export function MyFeatureButton() {
  const { user } = useAuth();
  const { character } = useRealtimeState(initialCharacter, {
    characterId: user?.id,
  });

  const handleAction = async () => {
    const response = await fetch('/api/my-feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        action: 'do-something',
        value: 100,
      }),
    });

    const result = await response.json();
    
    // Character state автоматически обновится через WebSocket!
    // Не нужно вызывать setState или refetch
  };

  return (
    <button onClick={handleAction}>
      Do Something (Real-time!)
    </button>
  );
}
```

## Real-time Market Prices

```tsx
// src/components/MarketPriceDisplay.tsx
import { useRealtimeMarket } from '@/hooks/use-realtime-state';

export function MarketPriceDisplay({ itemId }: { itemId: string }) {
  const { prices, isConnected, getPrice } = useRealtimeMarket();
  
  const currentPrice = getPrice(itemId);

  return (
    <div>
      <div>Connection: {isConnected ? '🟢' : '🔴'}</div>
      <div>Price: {currentPrice || 'Loading...'} gold</div>
      {/* Цена обновляется автоматически при изменении на сервере! */}
    </div>
  );
}
```

## Advanced: Custom Event Handling

```tsx
import { useRealtimeState } from '@/hooks/use-realtime-state';
import { useToast } from '@/hooks/use-toast';

export function AdvancedDashboard() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<string[]>([]);

  const { character, isConnected } = useRealtimeState(
    initialCharacter,
    {
      characterId: user?.id,
      onEvent: (type, data) => {
        // Custom handling для любых событий
        
        // Level up notification
        if (type === 'character:level:up') {
          toast.success(`🎉 Level ${data.newLevel}!`);
          playSound('levelup.mp3');
        }
        
        // Divine intervention
        if (type === 'divine:intervention:performed') {
          toast.info(`⚡ ${data.effect}`);
          setNotifications(prev => [...prev, data.effect]);
        }
        
        // Market trade completed
        if (type === 'market:trade:completed') {
          if (data.side === 'buy') {
            toast.info(`Bought ${data.quantity}x ${data.itemName}`);
          } else {
            toast.success(`Sold ${data.quantity}x ${data.itemName}`);
          }
        }
        
        // Inventory changes
        if (type === 'character:inventory:updated') {
          for (const change of data.changes) {
            if (change.quantityDelta > 0) {
              toast.info(`+${change.quantityDelta} ${change.itemName}`);
            }
          }
        }
      }
    }
  );

  return (
    <div>
      <ConnectionIndicator connected={isConnected} />
      <CharacterStats character={character} />
      <NotificationsList notifications={notifications} />
    </div>
  );
}
```

## Debugging

### Проверка событий в браузере

```javascript
// Browser console
window.addEventListener('storage', (e) => {
  console.log('Storage event:', e);
});

// Or connect directly to WebSocket
const socket = io('ws://localhost:5050', {
  query: { characterId: 'your-id', realmId: 'global' }
});

socket.on('game:event', (event) => {
  console.log('📨 Event received:', event.type, event.data);
});

socket.on('character:stats:updated', (data) => {
  console.log('💓 Stats updated:', data);
});
```

### Проверка событий на сервере

```bash
# Server logs покажут:
[EventBus] Published character:stats:updated to 3 channels
[Realtime] Broadcasted character:stats:updated to 2 rooms
```

### Common Issues

**Problem**: Events не приходят на клиент
```
Solution:
1. Проверьте NEXT_PUBLIC_WS_ENABLED=true
2. Проверьте что realtime server запущен (npm run realtime)
3. Проверьте Redis connection
4. Проверьте characterId совпадает
```

**Problem**: Character state не обновляется
```
Solution:
1. Убедитесь что используете character из useRealtimeState()
2. Проверьте что не используете stale state
3. Проверьте консоль на "[RealtimeState] Received event"
```

**Problem**: WebSocket постоянно reconnecting
```
Solution:
1. Проверьте что NEXT_PUBLIC_WS_URL правильный
2. Проверьте CORS настройки в server/realtime.ts
3. Проверьте firewall не блокирует WebSocket
```

## Best Practices

1. **Всегда используйте `useRealtimeState()`** для character data
2. **Не делайте manual refetch** - state обновляется автоматически
3. **Показывайте connection status** пользователю
4. **Обрабатывайте disconnect gracefully** - polling fallback включён
5. **Используйте `onEvent` для notifications** - лучший UX
6. **Batch события** когда possible - используйте `eventBus.publishBatch()`
7. **Валидируйте inputs** в commands - безопасность важна

## Next Steps

- ✅ Базовая система работает
- ✅ Divine intervention real-time
- ✅ NPC trade real-time
- ✅ Market prices real-time
- 🔲 Добавьте companions commands
- 🔲 Добавьте quest commands
- 🔲 Интегрируйте Background Worker
- 🔲 Добавьте delta updates optimization

## Resources

- [Full Documentation](./REALTIME_SYSTEM.md)
- [Implementation Summary](../REALTIME_IMPLEMENTATION_SUMMARY.md)
- [Event Types](../../server/events/event-types.ts)
- [Example Commands](../../server/commands/)

---

**Have fun with real-time! 🚀**

