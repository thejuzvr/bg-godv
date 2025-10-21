# 🔄 Миграция компаньонов в раздел "Общество"

**Дата:** 2025-10-21  
**Версия:** 1.2.1

## Что изменилось?

### ❌ Удалено:
- Отдельная страница `/dashboard/companions`
- Пункт меню "Компаньоны"

### ✅ Обновлено:
- Функционал компаньонов интегрирован в `/dashboard/society`
- Пункт меню "Общество" теперь включает:
  - NPC и взаимодействия
  - Торговцев
  - Компаньонов
  - Отношения с персонажами

## Зачем?

1. **Лучшая организация** - все социальные взаимодействия в одном месте
2. **Меньше дублирования** - компаньоны это тоже NPC
3. **Удобнее навигация** - 13 пунктов меню вместо 14

## Как работает?

### В society/page.tsx:
```typescript
// Компаньоны фильтруются по признаку isCompanion
const companionNPCs = useMemo(() => {
  if (!character) return [];
  return npcs.filter(npc => npc.isCompanion);
}, [npcs, character]);

// Роль NPC определяется функцией
const getNPCRole = (npc: NPC): string => {
  if (npc.inventory && npc.inventory.length > 0) return 'merchant';
  if (npc.isCompanion) return 'companion';
  return 'citizen';
};
```

### Фильтрация:
- **Торговцы** - `npc.inventory.length > 0`
- **Компаньоны** - `npc.isCompanion === true`
- **Жители** - все остальные

## Структура NPC с компаньонами:

```typescript
interface NPC {
  id: string;
  name: string;
  description: string;
  location: string;
  inventory?: Item[]; // Если есть - торговец
  isCompanion?: boolean; // Если true - компаньон
  companionData?: { // Дополнительная информация для компаньонов
    class: CompanionClass;
    rarity: CompanionRarity;
    abilities: CompanionAbility[];
    stats: CompanionStats;
    // ... etc
  };
}
```

## Обновлённое меню (13 пунктов):

1. Дашборд
2. Персонаж
3. Инвентарь
4. Задания
5. Карта
6. **Общество** ⭐ (включает компаньонов)
7. Рынок
8. Крафт
9. Добыча
10. Фракции
11. Летопись
12. Сознание
13. Аналитика

## Что нужно обновить?

### В базе данных (когда будет):
```sql
-- Добавить поле isCompanion в таблицу npcs
ALTER TABLE npcs ADD COLUMN is_companion BOOLEAN DEFAULT FALSE;

-- Добавить JSONB поле для данных компаньонов
ALTER TABLE npcs ADD COLUMN companion_data JSONB;
```

### В коде:
- ✅ Layout.tsx - обновлено меню
- ✅ Society/page.tsx - уже поддерживает компаньонов
- ✅ Документация обновлена

### Для будущей интеграции:
1. Создать NPC с `isCompanion: true`
2. Заполнить `companionData` для компаньонов
3. Использовать существующую страницу society для отображения

## Преимущества:

### Для разработки:
- Меньше кода для поддержки
- Единая логика взаимодействий
- Проще добавлять новые типы NPC

### Для игроков:
- Все социальные функции в одном месте
- Удобная фильтрация по типам
- Меньше кликов для навигации

### Для архитектуры:
- NPC и компаньоны используют одну систему
- Проще балансировка
- Легче масштабировать

## Миграционный путь:

### Если были созданные компаньоны:
```typescript
// Конвертация старых компаньонов в NPC
function migrateCompanionToNPC(companion: Companion): NPC {
  return {
    id: companion.id,
    name: companion.name,
    description: companion.bio,
    location: companion.acquiredLocation,
    isCompanion: true,
    companionData: {
      class: companion.class,
      rarity: companion.rarity,
      level: companion.level,
      stats: companion.stats,
      skills: companion.skills,
      personality: companion.personality,
      abilities: companion.abilities,
      loyalty: companion.loyalty,
      mood: companion.mood,
      upkeepCost: companion.upkeepCost,
      foodConsumption: companion.foodConsumption,
      // ... etc
    }
  };
}
```

## Тестирование:

- [x] Меню обновлено
- [x] Ссылка на /dashboard/companions удалена
- [x] Society page поддерживает фильтрацию компаньонов
- [x] Документация обновлена
- [ ] Создать тестовых NPC-компаньонов
- [ ] Проверить взаимодействие
- [ ] Проверить найм (когда будет реализовано)

---

**Итог:** Компаньоны теперь часть единой системы "Общество". Это упрощает код и улучшает UX.

