# 🛠️ Руководство по интеграции компаньонов

## Фаза 1: Хранилище (БД) ✅ Готово к реализации

### 1.1 Создать таблицу в schema.ts

```typescript
export const companions = pgTable('companions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  templateId: text('template_id').notNull(),
  name: text('name').notNull(),
  class: text('class').notNull(), // warrior, mage, rogue, healer, ranger
  rarity: text('rarity').notNull(),
  level: integer('level').notNull().default(1),
  
  // Stats (JSON)
  stats: jsonb('stats').notNull().$type<{ health: { current: number; max: number }; damage: number; defense: number }>(),
  skills: jsonb('skills').notNull().$type<{ combat: number; survival: number; magic: number; social: number }>(),
  personality: jsonb('personality').notNull().$type<{ brave: number; friendly: number; greedy: number; loyal: number }>(),
  
  // Abilities (array of IDs)
  abilityIds: jsonb('ability_ids').notNull().$type<string[]>(),
  
  // State
  loyalty: integer('loyalty').notNull().default(50),
  mood: integer('mood').notNull().default(60),
  isActive: boolean('is_active').notNull().default(false),
  isInjured: boolean('is_injured').notNull().default(false),
  injuredUntil: bigint('injured_until', { mode: 'number' }),
  
  // Upkeep
  upkeepCost: integer('upkeep_cost').notNull(),
  foodConsumption: integer('food_consumption').notNull(),
  lastFed: bigint('last_fed', { mode: 'number' }),
  lastPaid: bigint('last_paid', { mode: 'number' }),
  
  // Meta
  acquiredAt: bigint('acquired_at', { mode: 'number' }).notNull(),
  acquiredLocation: text('acquired_location').notNull(),
  bio: text('bio'),
  dialogues: jsonb('dialogues'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### 1.2 Создать сервис companionService.ts

```typescript
'use server';

import { db } from '../../server/storage';
import * as schema from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { companionTemplates, generateCompanionFromTemplate } from '@/data/companions';
import type { Companion } from '@/types/companion';

// List all companions for a character
export async function listCompanions(characterId: string): Promise<Companion[]> {
  const rows = await db.select()
    .from(schema.companions)
    .where(eq(schema.companions.characterId, characterId));
  return rows as Companion[];
}

// Get active companion
export async function getActiveCompanion(characterId: string): Promise<Companion | null> {
  const [row] = await db.select()
    .from(schema.companions)
    .where(and(
      eq(schema.companions.characterId, characterId),
      eq(schema.companions.isActive, true)
    ))
    .limit(1);
  return row as Companion || null;
}

// Recruit new companion
export async function recruitCompanion(
  characterId: string, 
  templateId: string, 
  location: string
): Promise<{ success: boolean; companion?: Companion; error?: string }> {
  const template = companionTemplates.find(t => t.id === templateId);
  if (!template) {
    return { success: false, error: 'Template not found' };
  }
  
  // Check if available at location
  if (!template.availableAt.includes(location)) {
    return { success: false, error: 'Not available at this location' };
  }
  
  // Check gold
  const char = await getCharacterById(characterId);
  if (!char) return { success: false, error: 'Character not found' };
  
  const goldItem = char.inventory.find(i => i.id === 'gold');
  if (!goldItem || goldItem.quantity < template.recruitCost) {
    return { success: false, error: 'Not enough gold' };
  }
  
  // Generate companion
  const companion = generateCompanionFromTemplate(template);
  companion.acquiredLocation = location;
  
  // Save to DB
  const [row] = await db.insert(schema.companions).values({
    characterId,
    templateId: template.id,
    name: companion.name,
    class: companion.class,
    rarity: companion.rarity,
    level: companion.level,
    stats: companion.stats as any,
    skills: companion.skills as any,
    personality: companion.personality as any,
    abilityIds: companion.abilities.map(a => a.id) as any,
    loyalty: companion.loyalty,
    mood: companion.mood,
    isActive: false,
    isInjured: false,
    upkeepCost: companion.upkeepCost,
    foodConsumption: companion.foodConsumption,
    lastFed: Date.now(),
    lastPaid: Date.now(),
    acquiredAt: Date.now(),
    acquiredLocation: location,
    bio: companion.bio,
    dialogues: companion.dialogues as any,
  }).returning();
  
  // Deduct gold
  goldItem.quantity -= template.recruitCost;
  await saveCharacter(char);
  
  return { success: true, companion: row as Companion };
}

// Activate companion
export async function activateCompanion(characterId: string, companionId: string) {
  // Deactivate all others first
  await db.update(schema.companions)
    .set({ isActive: false })
    .where(eq(schema.companions.characterId, characterId));
  
  // Activate selected
  await db.update(schema.companions)
    .set({ isActive: true })
    .where(eq(schema.companions.id, companionId));
}

// Dismiss companion
export async function dismissCompanion(companionId: string) {
  await db.delete(schema.companions)
    .where(eq(schema.companions.id, companionId));
}

// Update companion state
export async function updateCompanion(companionId: string, updates: Partial<Companion>) {
  await db.update(schema.companions)
    .set(updates as any)
    .where(eq(schema.companions.id, companionId));
}
```

---

## Фаза 2: Боевая интеграция

### 2.1 Добавить в performCombatRound (brain.ts)

```typescript
// После хода героя, до хода врага
const doCompanionTurn = async (): Promise<Character> => {
  if (!updatedChar.activeCompanion) return updatedChar;
  
  const companion = await getActiveCompanion(updatedChar.id);
  if (!companion || companion.isInjured) return updatedChar;
  
  logMessages.push(`--- Ход ${companion.name} ---`);
  
  // Simple companion attack
  const companionBonus = Math.floor(companion.skills.combat / 10);
  const roll = Math.floor(Math.random() * 20) + 1;
  const totalRoll = roll + companionBonus;
  
  const enemyAC = enemy.armor;
  const success = totalRoll >= enemyAC;
  
  if (success) {
    const damage = companion.stats.damage + Math.floor(Math.random() * 5);
    enemy.health.current -= damage;
    logMessages.push(`${companion.name} попадает, нанося ${damage} урона!`);
    
    // Random companion dialogue
    if (Math.random() < 0.2) {
      const dialogue = companion.dialogues.onCombatWin[Math.floor(Math.random() * companion.dialogues.onCombatWin.length)];
      logMessages.push(`${companion.name}: "${dialogue}"`);
    }
  } else {
    logMessages.push(`${companion.name} промахивается!`);
  }
  
  // Small chance companion takes damage
  if (Math.random() < 0.15 && enemy.health.current > 0) {
    const damage = Math.floor(enemy.damage * 0.5);
    companion.stats.health.current -= damage;
    logMessages.push(`Враг контратакует ${companion.name}, нанося ${damage} урона!`);
    
    if (companion.stats.health.current <= 0) {
      companion.isInjured = true;
      companion.injuredUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      logMessages.push(`${companion.name} ранен и не может продолжать бой!`);
      await updateCompanion(companion.id, { 
        isInjured: true, 
        injuredUntil: companion.injuredUntil 
      });
    }
  }
  
  return updatedChar;
};

// Execute turns
if (heroActsFirst) {
  updatedChar = await doHeroTurn();
  if (updatedChar.activeCompanion) {
    updatedChar = await doCompanionTurn();
  }
  if (updatedChar.combat && enemy.health.current > 0) {
    updatedChar = await doEnemyTurn();
  }
} else {
  updatedChar = await doEnemyTurn();
  if (updatedChar.combat && updatedChar.stats.health.current > 0) {
    updatedChar = await doHeroTurn();
    if (updatedChar.activeCompanion) {
      updatedChar = await doCompanionTurn();
    }
  }
}
```

---

## Фаза 3: Содержание и лояльность

### 3.1 Daily upkeep в game-engine.ts

```typescript
// В processGameLoop после обновления времени суток
async function processCompanionUpkeep(character: Character): Promise<{ character: Character; logs: string[] }> {
  const logs: string[] = [];
  const updated = structuredClone(character);
  
  if (!character.activeCompanion) return { character: updated, logs };
  
  const companion = await getActiveCompanion(character.id);
  if (!companion) return { character: updated, logs };
  
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000; // game day
  
  // Check if need to pay
  const timeSincePayment = now - (companion.lastPaid || 0);
  if (timeSincePayment >= dayMs) {
    const goldItem = updated.inventory.find(i => i.id === 'gold');
    if (goldItem && goldItem.quantity >= companion.upkeepCost) {
      goldItem.quantity -= companion.upkeepCost;
      companion.lastPaid = now;
      companion.mood = Math.min(100, companion.mood + 5);
      logs.push(`Выплачено ${companion.upkeepCost} золота ${companion.name}.`);
      await updateCompanion(companion.id, { lastPaid: now, mood: companion.mood });
    } else {
      // Can't pay - loyalty drops
      companion.loyalty = Math.max(0, companion.loyalty - 10);
      companion.mood = Math.max(0, companion.mood - 15);
      logs.push(`${companion.name} недоволен — не получил плату. Лояльность -10.`);
      await updateCompanion(companion.id, { loyalty: companion.loyalty, mood: companion.mood });
      
      // Desertion check
      if (companion.loyalty < 20) {
        logs.push(`${companion.name}: "${companion.dialogues.onLeaving}"`);
        await dismissCompanion(companion.id);
        updated.activeCompanion = null;
        updated.companions = (updated.companions || []).filter(id => id !== companion.id);
      }
    }
  }
  
  // Check if need to feed
  const timeSinceFeeding = now - (companion.lastFed || 0);
  if (timeSinceFeeding >= dayMs) {
    const food = updated.inventory.find(i => i.type === 'food');
    if (food && food.quantity >= companion.foodConsumption) {
      food.quantity -= companion.foodConsumption;
      if (food.quantity <= 0) {
        updated.inventory = updated.inventory.filter(i => i.id !== food.id);
      }
      companion.lastFed = now;
      companion.mood = Math.min(100, companion.mood + 3);
      await updateCompanion(companion.id, { lastFed: now, mood: companion.mood });
    } else {
      companion.loyalty = Math.max(0, companion.loyalty - 5);
      companion.mood = Math.max(0, companion.mood - 10);
      logs.push(`${companion.name} голоден. Лояльность -5.`);
      await updateCompanion(companion.id, { loyalty: companion.loyalty, mood: companion.mood });
    }
  }
  
  return { character: updated, logs };
}
```

---

## Фаза 4: Способности компаньонов

### 4.1 Активация способностей

```typescript
// В combat system
interface CompanionCombatState {
  abilityCooldowns: Record<string, number>; // abilityId -> timestamp
}

async function tryUseCompanionAbility(
  companion: Companion, 
  combat: CombatState,
  logMessages: string[]
): Promise<{ damage?: number; healing?: number; buff?: ActiveEffect }> {
  
  const now = Date.now();
  const state = combat.companionState || { abilityCooldowns: {} };
  
  // Find available ability
  const availableAbility = companion.abilities.find(a => {
    if (a.type === 'passive') return false;
    const cooldownEnd = state.abilityCooldowns[a.id] || 0;
    return now >= cooldownEnd;
  });
  
  if (!availableAbility) return {};
  
  // Chance to use (30% per turn)
  if (Math.random() > 0.3) return {};
  
  // Activate ability
  state.abilityCooldowns[availableAbility.id] = now + (availableAbility.cooldown || 0);
  logMessages.push(`${companion.name} использует "${availableAbility.name}"!`);
  
  const result: any = {};
  
  if (availableAbility.effect.damageBonus) {
    result.damage = availableAbility.effect.damageBonus;
  }
  
  if (availableAbility.effect.healAmount) {
    result.healing = availableAbility.effect.healAmount;
  }
  
  if (availableAbility.effect.defenseBonus || availableAbility.effect.buffDuration) {
    result.buff = {
      id: `companion_${availableAbility.id}`,
      name: availableAbility.name,
      description: availableAbility.description,
      icon: 'Shield',
      type: 'buff',
      expiresAt: now + (availableAbility.effect.buffDuration || 60000),
      value: availableAbility.effect.defenseBonus || 0,
    };
  }
  
  return result;
}
```

---

## Фаза 5: UI Actions

### 5.1 Server Actions для компаньонов

```typescript
// /src/app/dashboard/actions.ts

export async function recruitCompanionAction(
  userId: string,
  templateId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const char = await fetchCharacter(userId);
    if (!char) return { success: false, message: 'Character not found' };
    
    const result = await recruitCompanion(userId, templateId, char.location);
    if (!result.success) {
      return { success: false, message: result.error || 'Failed to recruit' };
    }
    
    return { 
      success: true, 
      message: `${result.companion?.name} присоединился к вашему отряду!` 
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function activateCompanionAction(
  userId: string,
  companionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await activateCompanion(userId, companionId);
    return { success: true, message: 'Компаньон активирован' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function dismissCompanionAction(
  companionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await dismissCompanion(companionId);
    return { success: true, message: 'Компаньон уволен' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
```

### 5.2 Обновить companions/page.tsx

Заменить `disabled` на реальные кнопки:
```typescript
<Button 
  size="sm" 
  onClick={() => handleRecruit(template.id)}
  disabled={recruiting}
>
  <UserPlus className="h-4 w-4 mr-1" />
  {recruiting ? 'Найм...' : 'Нанять'}
</Button>
```

---

## Фаза 6: AI Integration

### 6.1 Компаньоны в решениях AI

```typescript
// В determineNextAction добавить модификаторы от компаньона

const companion = character.activeCompanion 
  ? await getActiveCompanion(character.id) 
  : null;

// Modify action weights based on companion
if (companion) {
  // Combat actions boosted
  if (action.type === 'combat' && companion.skills.combat > 60) {
    weight *= 1.3;
  }
  
  // Social actions boosted
  if (action.type === 'social' && companion.skills.social > 60) {
    weight *= 1.2;
  }
  
  // Travel fatigue reduced
  if (action.type === 'travel' && companion.skills.survival > 50) {
    // Will reduce fatigue gain in travel action
  }
}
```

---

## Фаза 7: Тестирование

### Чек-лист:
- [ ] Создать таблицу companions в БД
- [ ] Реализовать companionService
- [ ] Добавить server actions
- [ ] Обновить UI с реальными кнопками
- [ ] Протестировать найм
- [ ] Протестировать активацию/деактивацию
- [ ] Протестировать увольнение
- [ ] Интегрировать в бой
- [ ] Протестировать способности
- [ ] Протестировать содержание (upkeep)
- [ ] Протестировать дезертирство
- [ ] Балансировка

---

## 📊 Ожидаемые метрики

### Gameplay Impact:
- +15-30% к эффективности боя с компаньоном
- -20% усталость в путешествиях (с следопытом)
- +25% к социальным взаимодействиям (с харизматичным компаньоном)

### Economy Impact:
- Стоимость содержания: 20-50 золота/день
- Потребление еды: 1-2 единицы/день
- Стоимость найма: 100-500 золота

### Retention:
- Новый слой стратегии
- Долгосрочное вложение ресурсов
- Эмоциональная привязка к спутникам

---

**Готово к реализации:** Все компоненты спроектированы и готовы к интеграции.
**Приоритет:** Средний (улучшение опыта, не критично)
**Время на реализацию:** ~4-6 часов разработки

