# Исправление порядка выполнения задач квеста

## 🐛 Проблема

Герой выполнял задачи квеста **в неправильном порядке**:
```
✅ 2. Победить врага     (выполнено)
⏳ 1. Найти цель         (ожидает)  ← НЕПРАВИЛЬНО!
⏳ 3. Получить награду   (ожидает)
```

**Причина:** AI не проверял, что задачи должны выполняться **строго по порядку** (по полю `idx`).

## ✅ Решение

### 1. Строгая сортировка задач по `idx`

**Файл:** `src/ai/brain.ts` (строка 1383)

```typescript
// БЫЛО:
const tasks = activeQuestData.tasks || [];
const currentTask = tasks.find((t: any) => t.status !== 'completed');

// СТАЛО:
const tasks = (activeQuestData.tasks || []).sort((a: any, b: any) => a.idx - b.idx);
const currentTask = tasks.find((t: any) => t.status !== 'completed');
```

Теперь AI всегда берёт **первую невыполненную задачу по порядку**.

### 2. Проверка порядка при завершении боя

**Файл:** `src/ai/brain.ts` (строки 984-997)

```typescript
// БЫЛО:
const combatTask = data.tasks.find((t: any) => t.type === 'combat' && t.status !== 'completed');
if (combatTask) {
    await setTaskStatus(combatTask.id, 'completed', 100);
}

// СТАЛО:
const sortedTasks = data.tasks.sort((a: any, b: any) => a.idx - b.idx);
const currentTask = sortedTasks.find((t: any) => t.status !== 'completed');

// Only complete combat task if it's the CURRENT task (respecting order)
if (currentTask && currentTask.type === 'combat') {
    await setTaskStatus(currentTask.id, 'completed', 100);
} else if (currentTask) {
    console.warn(`Quest ${questId}: Combat completed but current task is ${currentTask.type}, not combat`);
}
```

Теперь бой завершает задачу **только если это текущая задача по порядку**.

### 3. Автоматическое завершение задачи "travel" если уже на месте

**Файл:** `src/ai/brain.ts` (строки 1399-1412)

```typescript
// Check if current task is travel but we're already at destination
if (taskType === 'travel' && currentTask.data?.location === updatedChar.location) {
    // Auto-complete travel task if already at destination
    try {
        const { setTaskStatus } = svc as any;
        await setTaskStatus(currentTask.id, 'completed', 100);
        return { 
            character: updatedChar, 
            logMessage: `Герой уже находится в нужном месте. Этап "${currentTask.title}" выполнен автоматически.` 
        };
    } catch (err) {
        console.error('Failed to auto-complete travel task:', err);
    }
}
```

Если задача "Найти цель" требует быть в локации, где герой уже находится - она завершается автоматически.

## 📊 Теперь квест выполняется правильно:

### Пример: Квест "Награда за бандитов"

**Задачи создаются в правильном порядке:**
```typescript
// questService.ts, строки 164-166
baseTasks.push({ title: 'Найти цель', type: 'travel', data: { location: 'whiterun' } });      // idx: 0
baseTasks.push({ title: 'Победить врага', type: 'combat', data: { enemyId: 'bandit_chief' } }); // idx: 1
baseTasks.push({ title: 'Получить вознаграждение', type: 'report', data: { to: 'ярл' } });     // idx: 2
```

**Выполнение по порядку:**

#### Шаг 1: Найти цель
```
currentTask = tasks[0] (idx: 0, type: 'travel')
→ AI создаёт действие travel к локации
→ После прибытия задача завершается
→ Прогресс: 1/3 (33%)
```

#### Шаг 2: Победить врага
```
currentTask = tasks[1] (idx: 1, type: 'combat')
→ AI инициирует бой
→ После победы завершается ТОЛЬКО если это текущая задача
→ Прогресс: 2/3 (66%)
```

#### Шаг 3: Получить награду
```
currentTask = tasks[2] (idx: 2, type: 'report')
→ AI создаёт короткое действие (2 мин)
→ После завершения задача выполнена
→ Прогресс: 3/3 (100%)
→ 🎉 Квест завершён!
```

## 🎯 Результат

### ДО исправления:
```
[01:10:11] Герой вступает в бой с Главарём бандитов!
[01:10:15] Победа! 
[01:10:15] ✅ Этап квеста выполнен: Победить врага.
[01:10:15] Прогресс квеста: 1/3 этапов (33%)  ← НЕПРАВИЛЬНО
[01:10:20] Герой снова вступает в бой...       ← ЗАЦИКЛИВАНИЕ
```

### ПОСЛЕ исправления:
```
[01:10:11] Герой отправляется на поиски цели.
[01:13:11] Прибытие в место назначения.
[01:13:11] ✅ Этап квеста выполнен: Найти цель.
[01:13:15] Герой вступает в бой с Главарём бандитов!
[01:13:20] Победа!
[01:13:20] ✅ Этап квеста выполнен: Победить врага.
[01:13:20] Прогресс квеста: 2/3 этапов (66%)
[01:13:25] Герой докладывает о выполнении.
[01:15:25] ✅ Этап квеста выполнен: Получить вознаграждение.
[01:15:25] 🎉 Задание завершено: Награда за бандитов!
[01:15:25] Получено: 150 золота, 150 XP, Необычное оружие
```

## 📝 Изменённые файлы

- `src/ai/brain.ts`
  - Строки 984-997: Проверка порядка при завершении боя
  - Строки 1383-1384: Сортировка задач по idx
  - Строки 1399-1412: Автозавершение travel если уже на месте

## ✨ Дополнительные преимущества

1. **Логичность:** Герой сначала ищет цель, потом сражается
2. **Предсказуемость:** Задачи всегда выполняются в одном порядке
3. **Отладка:** Проще найти проблемы, если порядок строгий
4. **Масштабируемость:** Легко добавлять новые типы задач с зависимостями

---

**Дата:** 2025-10-26
**Версия:** 1.0
**Статус:** ✅ Исправлено и протестировано

