// Quest Commands
import type { Character } from '@/types/character';
import * as storage from '../storage';
import { 
  completeQuest as completeQuestService,
  updateQuestProgress as updateQuestProgressService,
  setTaskStatus as setTaskStatusService,
  setActiveQuest as setActiveQuestService,
  getQuest,
  applyRewardsToCharacter,
} from '@/services/questService';
import { 
  executeCommand, 
  validateCharacterOwnership, 
  validateRequired,
  type CommandContext,
  type CommandResult
} from './command-handler';

export interface CompleteQuestInput {
  questId: string;
}

export interface UpdateQuestProgressInput {
  questId: string;
  progress: number;
}

export interface SetTaskStatusInput {
  questId: string;
  taskId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress?: number;
}

export interface SetActiveQuestInput {
  questId: string;
}

export interface CompleteQuestOutput {
  character: Character;
  quest: any;
  rewards: any;
  message: string;
}

/**
 * Complete a quest
 */
export async function completeQuest(
  userId: string,
  input: CompleteQuestInput
): Promise<CommandResult<CompleteQuestOutput>> {
  // Validation
  const validationError = validateRequired(input, ['questId']);
  if (validationError) return validationError;

  const character = await storage.getCharacterById(userId);
  const ownershipError = validateCharacterOwnership(character, userId);
  if (ownershipError) return ownershipError;

  const char = character as Character;
  const context: CommandContext = {
    userId,
    characterId: userId,
    realmId: (char as any).realmId || 'global',
    timestamp: Date.now(),
  };

  return executeCommand(
    async (inp: CompleteQuestInput, ctx: CommandContext) => {
      // Get quest details
      const questData = await getQuest(inp.questId);
      if (!questData || !questData.quest) {
        return { success: false, error: 'Quest not found' };
      }

      const quest = questData.quest;
      
      // Check ownership
      if (quest.characterId !== ctx.characterId) {
        return { success: false, error: 'Quest does not belong to this character' };
      }

      // Complete quest in DB
      const completedQuest = await completeQuestService(inp.questId);
      
      // Apply rewards
      const rewardResult = await applyRewardsToCharacter(char, quest.rewards);
      const updatedChar = rewardResult.character;
      
      // Save character
      await storage.saveCharacter(updatedChar);

      // Prepare events
      const events: Array<{ type: string; payload: any }> = [
        {
          type: 'quest:completed',
          payload: {
            characterId: ctx.characterId,
            questId: inp.questId,
            questTitle: quest.title,
            rewards: quest.rewards,
          },
        },
      ];

      // Add character stats/inventory updates if rewards included them
      if (quest.rewards.xp) {
        events.push({
          type: 'character:stats:updated',
          payload: {
            characterId: ctx.characterId,
            stats: {
              // XP is tracked separately but we notify about it
            },
          },
        });
      }

      if (quest.rewards.gold || quest.rewards.items) {
        const changes = [];
        if (quest.rewards.gold) {
          const goldItem = updatedChar.inventory.find(i => i.id === 'gold');
          changes.push({
            itemId: 'gold',
            itemName: 'Золото',
            quantityDelta: quest.rewards.gold,
            newQuantity: goldItem?.quantity || 0,
          });
        }
        if (quest.rewards.items) {
          for (const item of quest.rewards.items) {
            const invItem = updatedChar.inventory.find(i => i.id === item.id);
            changes.push({
              itemId: item.id,
              itemName: invItem?.name || item.id,
              quantityDelta: item.quantity,
              newQuantity: invItem?.quantity || 0,
            });
          }
        }
        
        events.push({
          type: 'character:inventory:updated',
          payload: {
            characterId: ctx.characterId,
            changes,
          },
        });
      }

      // Log to offline events
      try {
        const { addOfflineEvent } = await import('@/services/offlineEventsService');
        await addOfflineEvent(ctx.characterId, {
          type: 'quest',
          message: `🎉 Задание выполнено: ${quest.title}! ${rewardResult.log}`,
        } as any);
      } catch {}

      return {
        success: true,
        data: {
          character: updatedChar,
          quest: completedQuest,
          rewards: quest.rewards,
          message: `Задание "${quest.title}" выполнено!`,
        },
        events,
      };
    },
    input,
    context
  );
}

/**
 * Update quest progress
 */
export async function updateQuestProgress(
  userId: string,
  input: UpdateQuestProgressInput
): Promise<CommandResult<{ quest: any; message: string }>> {
  // Validation
  const validationError = validateRequired(input, ['questId', 'progress']);
  if (validationError) return validationError;

  const character = await storage.getCharacterById(userId);
  const ownershipError = validateCharacterOwnership(character, userId);
  if (ownershipError) return ownershipError;

  const context: CommandContext = {
    userId,
    characterId: userId,
    realmId: (character as any).realmId || 'global',
    timestamp: Date.now(),
  };

  return executeCommand(
    async (inp: UpdateQuestProgressInput, ctx: CommandContext) => {
      // Get quest to verify ownership
      const questData = await getQuest(inp.questId);
      if (!questData || !questData.quest) {
        return { success: false, error: 'Quest not found' };
      }

      if (questData.quest.characterId !== ctx.characterId) {
        return { success: false, error: 'Quest does not belong to this character' };
      }

      // Update progress
      const updatedQuest = await updateQuestProgressService(inp.questId, inp.progress);

      // Prepare events
      const events: Array<{ type: string; payload: any }> = [
        {
          type: 'quest:progress:updated',
          payload: {
            characterId: ctx.characterId,
            questId: inp.questId,
            questTitle: questData.quest.title,
            progress: inp.progress,
            completedTasks: 0, // Would need to calculate
            totalTasks: questData.tasks?.length || 0,
          },
        },
      ];

      return {
        success: true,
        data: {
          quest: updatedQuest,
          message: `Прогресс квеста обновлён: ${inp.progress}%`,
        },
        events,
      };
    },
    input,
    context
  );
}

/**
 * Set task status
 */
export async function setTaskStatus(
  userId: string,
  input: SetTaskStatusInput
): Promise<CommandResult<{ task: any; message: string }>> {
  // Validation
  const validationError = validateRequired(input, ['questId', 'taskId', 'status']);
  if (validationError) return validationError;

  const character = await storage.getCharacterById(userId);
  const ownershipError = validateCharacterOwnership(character, userId);
  if (ownershipError) return ownershipError;

  const context: CommandContext = {
    userId,
    characterId: userId,
    realmId: (character as any).realmId || 'global',
    timestamp: Date.now(),
  };

  return executeCommand(
    async (inp: SetTaskStatusInput, ctx: CommandContext) => {
      // Get quest to verify ownership
      const questData = await getQuest(inp.questId);
      if (!questData || !questData.quest) {
        return { success: false, error: 'Quest not found' };
      }

      if (questData.quest.characterId !== ctx.characterId) {
        return { success: false, error: 'Quest does not belong to this character' };
      }

      // Find task
      const task = questData.tasks?.find((t: any) => t.id === inp.taskId);
      if (!task) {
        return { success: false, error: 'Task not found' };
      }

      // Update task status
      const updatedTask = await setTaskStatusService(inp.taskId, inp.status, inp.progress);

      // Prepare events
      const events: Array<{ type: string; payload: any }> = [];

      if (inp.status === 'completed') {
        events.push({
          type: 'quest:task:completed',
          payload: {
            characterId: ctx.characterId,
            questId: inp.questId,
            taskId: inp.taskId,
            taskTitle: task.title,
          },
        });
      }

      // Also send progress update
      const completedTasks = (questData.tasks || []).filter((t: any) => 
        t.id === inp.taskId ? inp.status === 'completed' : t.status === 'completed'
      ).length;
      const totalTasks = questData.tasks?.length || 0;
      const progress = totalTasks > 0 ? Math.floor((completedTasks / totalTasks) * 100) : 0;

      events.push({
        type: 'quest:progress:updated',
        payload: {
          characterId: ctx.characterId,
          questId: inp.questId,
          questTitle: questData.quest.title,
          progress,
          completedTasks,
          totalTasks,
        },
      });

      return {
        success: true,
        data: {
          task: updatedTask,
          message: `Этап квеста обновлён: ${task.title}`,
        },
        events,
      };
    },
    input,
    context
  );
}

/**
 * Set active quest
 */
export async function setActiveQuest(
  userId: string,
  input: SetActiveQuestInput
): Promise<CommandResult<{ quest: any; message: string }>> {
  // Validation
  const validationError = validateRequired(input, ['questId']);
  if (validationError) return validationError;

  const character = await storage.getCharacterById(userId);
  const ownershipError = validateCharacterOwnership(character, userId);
  if (ownershipError) return ownershipError;

  const context: CommandContext = {
    userId,
    characterId: userId,
    realmId: (character as any).realmId || 'global',
    timestamp: Date.now(),
  };

  return executeCommand(
    async (inp: SetActiveQuestInput, ctx: CommandContext) => {
      // Set active quest
      const result = await setActiveQuestService(ctx.characterId, inp.questId);

      if (!result.ok) {
        return { success: false, error: result.error || 'Failed to set active quest' };
      }

      // Prepare events
      const events: Array<{ type: string; payload: any }> = [
        {
          type: 'quest:accepted', // Using 'accepted' as proxy for 'activated'
          payload: {
            characterId: ctx.characterId,
            questId: inp.questId,
            questTitle: result.quest?.title || 'Quest',
            questType: result.quest?.type || 'side',
          },
        },
      ];

      return {
        success: true,
        data: {
          quest: result.quest,
          message: 'Quest set as active successfully',
        },
        events,
      };
    },
    input,
    context
  );
}

