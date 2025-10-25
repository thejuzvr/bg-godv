/**
 * Migration script to convert legacy quest system to new unified quest system
 * 
 * This script:
 * 1. Migrates activeSovngardeQuest from character JSONB to quests table
 * 2. Migrates activeCryptQuest from character JSONB to quests table
 * 3. Creates appropriate quest_tasks for multi-step quests
 * 4. Sets proper priority and active status
 */

import '../server/load-env';
import { db } from '../server/storage';
import { characters, quests, questTasks } from '../shared/schema';
import { eq, isNotNull } from 'drizzle-orm';

interface LegacySovngardeQuest {
  id: string;
  type: 'sovngarde';
  startedAt: number;
  progress: number;
  questGiver: string;
  tasks?: Array<{
    type: string;
    completed: boolean;
    data?: any;
  }>;
}

interface LegacyCryptQuest {
  id: string;
  type: 'crypt';
  location: string;
  startedAt: number;
  progress: number;
  enemiesDefeated?: number;
  bossDefeated?: boolean;
}

async function migrateLegacyQuests() {
  console.log('🔄 Starting legacy quest migration...\n');

  // Fetch all characters with legacy quests
  const allCharacters = await db.select().from(characters);
  
  let migratedSovngarde = 0;
  let migratedCrypt = 0;
  let errors = 0;

  for (const char of allCharacters) {
    try {
      // Migrate Sovngarde Quest
      if (char.activeSovngardeQuest) {
        const legacyQuest = char.activeSovngardeQuest as LegacySovngardeQuest;
        
        console.log(`  📜 Migrating Sovngarde quest for character ${char.name} (${char.id})`);
        
        // Create main quest
        const [newQuest] = await db.insert(quests).values({
          characterId: char.id,
          templateId: 'sovngarde_main',
          title: 'Путь в Совнгард',
          description: 'Великое испытание для достойных воинов. Докажи свою доблесть и войди в чертоги героев.',
          location: char.location,
          type: 'main',
          status: 'in-progress',
          rewards: {
            gold: 500,
            xp: 1000,
            items: [{ id: 'weapon_sword_legendary', quantity: 1 }]
          },
          progress: legacyQuest.progress || 0,
          priority: 90, // Main quests have highest priority
          isActive: true, // Set as active quest
          canAutoComplete: true,
          metadata: {
            legacyType: 'sovngarde',
            questGiver: legacyQuest.questGiver,
            migratedAt: Date.now()
          }
        }).returning();

        // Create tasks if they exist
        if (legacyQuest.tasks && legacyQuest.tasks.length > 0) {
          for (let i = 0; i < legacyQuest.tasks.length; i++) {
            const task = legacyQuest.tasks[i];
            await db.insert(questTasks).values({
              questId: newQuest.id,
              idx: i,
              title: getTaskTitle(task.type, i),
              type: task.type,
              status: task.completed ? 'completed' : 'pending',
              progress: task.completed ? 100 : 0,
              data: task.data || {}
            });
          }
        } else {
          // Create default tasks for Sovngarde quest
          const defaultTasks = [
            { title: 'Поговорить с ярлом', type: 'talk', status: 'completed' as const },
            { title: 'Найти путь в Совнгард', type: 'travel', status: 'in-progress' as const },
            { title: 'Доказать свою доблесть', type: 'combat', status: 'pending' as const },
            { title: 'Войти в чертоги героев', type: 'interact', status: 'pending' as const },
          ];

          for (let i = 0; i < defaultTasks.length; i++) {
            await db.insert(questTasks).values({
              questId: newQuest.id,
              idx: i,
              title: defaultTasks[i].title,
              type: defaultTasks[i].type,
              status: defaultTasks[i].status,
              progress: defaultTasks[i].status === 'completed' ? 100 : 0,
              data: {}
            });
          }
        }

        // Clear legacy quest from character
        await db.update(characters)
          .set({ activeSovngardeQuest: null })
          .where(eq(characters.id, char.id));

        migratedSovngarde++;
        console.log(`    ✅ Migrated Sovngarde quest (${newQuest.id})`);
      }

      // Migrate Crypt Quest
      if (char.activeCryptQuest) {
        const legacyQuest = char.activeCryptQuest as LegacyCryptQuest;
        
        console.log(`  📜 Migrating Crypt quest for character ${char.name} (${char.id})`);
        
        // Create main quest
        const [newQuest] = await db.insert(quests).values({
          characterId: char.id,
          templateId: 'crypt_exploration',
          title: `Исследование крипты: ${legacyQuest.location}`,
          description: 'Древняя крипта полна опасностей и сокровищ. Исследуй её глубины и победи всех врагов.',
          location: legacyQuest.location,
          type: 'side',
          status: 'in-progress',
          rewards: {
            gold: 300,
            xp: 400,
            randomItemRewards: [
              { rarity: 'rare', type: 'weapon', quantity: 1 }
            ]
          },
          progress: legacyQuest.progress || 0,
          priority: 60,
          isActive: !char.activeSovngardeQuest, // Active only if no Sovngarde quest
          canAutoComplete: true,
          metadata: {
            legacyType: 'crypt',
            enemiesDefeated: legacyQuest.enemiesDefeated || 0,
            bossDefeated: legacyQuest.bossDefeated || false,
            migratedAt: Date.now()
          }
        }).returning();

        // Create tasks for crypt exploration
        const cryptTasks = [
          { 
            title: 'Войти в крипту', 
            type: 'travel', 
            status: 'completed' as const,
            progress: 100
          },
          { 
            title: `Победить врагов (${legacyQuest.enemiesDefeated || 0}/10)`, 
            type: 'combat',
            status: (legacyQuest.enemiesDefeated || 0) >= 10 ? 'completed' as const : 'in-progress' as const,
            progress: Math.min(100, ((legacyQuest.enemiesDefeated || 0) / 10) * 100)
          },
          { 
            title: 'Победить босса крипты', 
            type: 'combat',
            status: legacyQuest.bossDefeated ? 'completed' as const : 'pending' as const,
            progress: legacyQuest.bossDefeated ? 100 : 0
          },
          { 
            title: 'Забрать сокровища', 
            type: 'interact',
            status: 'pending' as const,
            progress: 0
          },
        ];

        for (let i = 0; i < cryptTasks.length; i++) {
          await db.insert(questTasks).values({
            questId: newQuest.id,
            idx: i,
            title: cryptTasks[i].title,
            type: cryptTasks[i].type,
            status: cryptTasks[i].status,
            progress: cryptTasks[i].progress,
            data: {}
          });
        }

        // Clear legacy quest from character
        await db.update(characters)
          .set({ activeCryptQuest: null })
          .where(eq(characters.id, char.id));

        migratedCrypt++;
        console.log(`    ✅ Migrated Crypt quest (${newQuest.id})`);
      }

    } catch (error) {
      console.error(`  ❌ Error migrating quests for character ${char.name}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Sovngarde quests migrated: ${migratedSovngarde}`);
  console.log(`  ✅ Crypt quests migrated: ${migratedCrypt}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log('\n✨ Legacy quest migration completed!\n');
}

function getTaskTitle(taskType: string, index: number): string {
  const titles: Record<string, string[]> = {
    talk: ['Поговорить с заказчиком', 'Получить информацию', 'Обсудить детали'],
    travel: ['Отправиться в путь', 'Найти локацию', 'Добраться до места'],
    combat: ['Сразиться с врагами', 'Победить противника', 'Одолеть угрозу'],
    interact: ['Исследовать область', 'Осмотреть объект', 'Взять награду'],
    collect: ['Собрать предметы', 'Найти артефакты', 'Добыть ресурсы'],
  };

  const typeTitles = titles[taskType] || ['Выполнить задание'];
  return typeTitles[index % typeTitles.length];
}

// Run migration
if (require.main === module) {
  migrateLegacyQuests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateLegacyQuests };
