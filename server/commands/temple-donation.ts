// Temple & Faction Donation Commands
import type { Character } from '@/types/character';
import * as storage from '../storage';
import { allFactions } from '@/data/factions';
import { allDivinities } from '@/data/divinities';
import { allItems } from '@/data/items';
import type { ReputationTier } from '@/types/faction';
import { 
  executeCommand, 
  validateCharacterOwnership, 
  validateRequired,
  type CommandContext,
  type CommandResult
} from './command-handler';

export interface DonateToFactionInput {
  factionId: string;
  amount: number;
}

export interface DonateToFactionOutput {
  character: Character;
  message: string;
  templeProgress?: number;
  factionReputation?: number;
  rankUp?: {
    factionName: string;
    newRank: ReputationTier;
    rewards: Array<{ type: string; id: string; name: string; description: string }>;
  };
}

/**
 * Helper: Check if character achieved new faction rank and grant rewards
 */
function checkAndGrantFactionRankRewards(
  character: Character, 
  factionId: string, 
  oldReputation: number, 
  newReputation: number
): { rankUp: boolean; newRank?: ReputationTier; rewards?: Array<any> } {
  const faction = allFactions.find(f => f.id === factionId);
  if (!faction) return { rankUp: false };

  const sortedTiers = [...faction.reputationTiers].sort((a, b) => a.level - b.level);
  
  // Find old and new tiers
  let oldTier: ReputationTier | null = null;
  let newTier: ReputationTier | null = null;
  
  for (const tier of sortedTiers) {
    if (oldReputation >= tier.level) {
      oldTier = tier;
    }
    if (newReputation >= tier.level) {
      newTier = tier;
    }
  }

  // Check if rank increased
  if (!newTier || !oldTier || newTier.level <= oldTier.level) {
    return { rankUp: false };
  }

  // Grant rewards for the new tier
  const rewardsGranted: Array<any> = [];
  
  for (const reward of newTier.rewards) {
    switch (reward.type) {
      case 'item':
        // Add item to inventory
        const item = allItems.find(i => i.id === reward.id);
        if (item) {
          const existingItem = character.inventory.find(i => i.id === reward.id);
          if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 0) + 1;
          } else {
            character.inventory.push({
              id: item.id,
              name: item.name,
              type: item.type,
              quantity: 1,
              weight: item.weight,
            });
          }
          rewardsGranted.push(reward);
        }
        break;
        
      case 'perk':
        // Add perk to unlocked perks
        if (!character.unlockedPerks) {
          character.unlockedPerks = [];
        }
        if (!character.unlockedPerks.includes(reward.id)) {
          character.unlockedPerks.push(reward.id);
          rewardsGranted.push(reward);
        }
        break;
        
      case 'title':
        // Titles are just for display, mark as granted
        rewardsGranted.push(reward);
        break;
    }
  }

  return {
    rankUp: true,
    newRank: newTier,
    rewards: rewardsGranted,
  };
}

/**
 * Donate to faction or temple
 */
export async function donateToFaction(
  userId: string,
  input: DonateToFactionInput
): Promise<CommandResult<DonateToFactionOutput>> {
  // Validation
  const validationError = validateRequired(input, ['factionId', 'amount']);
  if (validationError) return validationError;

  if (input.amount <= 0) {
    return { success: false, error: 'Amount must be positive' };
  }

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
    async (inp: DonateToFactionInput, ctx: CommandContext) => {
      const { factionId, amount } = inp;
      
      let updatedChar = structuredClone(char);
      let logMessage = '';

      // Check gold
      const updatedGold = updatedChar.inventory.find(i => i.id === 'gold');
      if (!updatedGold || updatedGold.quantity < amount) {
        return { 
          success: false, 
          error: `Недостаточно золота. Нужно ${amount}, есть ${updatedGold?.quantity || 0}` 
        };
      }

      // Deduct gold
      updatedGold.quantity -= amount;

      const events: Array<{ type: string; payload: any }> = [];
      let templeProgress: number | undefined;
      let factionReputation: number | undefined;
      let rankUpData: DonateToFactionOutput['rankUp'] | undefined;

      if (factionId.startsWith('deity_')) {
        // Temple donation
        const deityId = factionId.replace('deity_', '');
        if (updatedChar.patronDeity === deityId) {
          updatedChar.templeProgress = (updatedChar.templeProgress || 0) + amount;
          templeProgress = updatedChar.templeProgress;
          
          const deity = allDivinities.find(d => d.id === deityId);
          logMessage = `Герой пожертвовал ${amount} золота на постройку храма для своего покровителя${deity ? ` ${deity.name}` : ''}.`;
          
          // Divine favor increases with donations
          const favorGain = Math.floor(amount / 100); // 1 favor per 100 gold
          updatedChar.divineFavor = Math.min(100, (updatedChar.divineFavor || 0) + favorGain);
          
          if (favorGain > 0) {
            logMessage += ` Благоволение божества увеличилось на ${favorGain}.`;
          }
        } else {
          logMessage = `Герой пожертвовал ${amount} золота... но это не его бог-покровитель. Пожертвование потеряно впустую.`;
        }
      } else {
        // Faction donation
        if (!updatedChar.factions) {
          updatedChar.factions = {};
        }
        
        const factionInfo = allFactions.find(f => f.id === factionId);
        if (!factionInfo) {
          return { success: false, error: 'Фракция не найдена' };
        }

        if (!updatedChar.factions[factionId]) {
          updatedChar.factions[factionId] = { reputation: 0 };
        }
        
        const oldReputation = updatedChar.factions[factionId]!.reputation;
        const reputationGain = Math.floor(amount / 10);
        const newReputation = oldReputation + reputationGain;
        updatedChar.factions[factionId]!.reputation = newReputation;
        factionReputation = newReputation;
        
        // Check for rank up
        const rankUpResult = checkAndGrantFactionRankRewards(updatedChar, factionId, oldReputation, newReputation);
        
        if (rankUpResult.rankUp && rankUpResult.newRank) {
          logMessage = `🎉 Герой достиг нового ранга во фракции "${factionInfo.name}"! Новый ранг: ${rankUpResult.newRank.title}. Репутация: ${factionReputation}.`;
          
          // Add rewards description
          if (rankUpResult.rewards && rankUpResult.rewards.length > 0) {
            const rewardsList = rankUpResult.rewards.map(r => r.name).join(', ');
            logMessage += ` Получены награды: ${rewardsList}.`;
          }
          
          // Store rank up data for return
          rankUpData = {
            factionName: factionInfo.name,
            newRank: rankUpResult.newRank,
            rewards: rankUpResult.rewards || [],
          };
          
          // Add chronicle entry for rank up
          try {
            await storage.addChronicleEntry(ctx.characterId, {
              type: 'faction_rank',
              title: `Повышение в ${factionInfo.name}`,
              description: `${updatedChar.name} достиг звания "${rankUpResult.newRank.title}" во фракции "${factionInfo.name}".`,
              icon: 'Shield',
              data: {
                factionId,
                factionName: factionInfo.name,
                rankTitle: rankUpResult.newRank.title,
                reputation: factionReputation,
                rewards: rankUpResult.rewards?.map(r => r.name) || [],
              },
            });
          } catch (error) {
            console.error('Failed to add chronicle entry:', error);
          }
        } else {
          logMessage = `Герой пожертвовал ${amount} золота фракции "${factionInfo.name}", улучшив свою репутацию. Текущая репутация: ${factionReputation}.`;
        }
      }

      // Save character
      await storage.saveCharacter(updatedChar);

      // Prepare events
      events.push(
        {
          type: 'character:inventory:updated',
          payload: {
            characterId: ctx.characterId,
            changes: [
              { 
                itemId: 'gold', 
                itemName: 'Золото', 
                quantityDelta: -amount, 
                newQuantity: updatedGold.quantity 
              },
            ],
          },
        }
      );

      // Also send a custom event for temple/faction updates
      // This ensures UI updates immediately
      if (templeProgress !== undefined) {
        events.push({
          type: 'character:stats:updated',
          payload: {
            characterId: ctx.characterId,
            stats: {
              // Using stats channel to trigger update, but include custom data
              templeProgress,
              divineFavor: updatedChar.divineFavor,
            } as any,
          },
        });
      }

      if (factionReputation !== undefined) {
        events.push({
          type: 'character:stats:updated',
          payload: {
            characterId: ctx.characterId,
            stats: {
              // Using stats channel to trigger update
              factions: updatedChar.factions,
            } as any,
          },
        });
      }

      // Log to offline events
      try {
        const { addOfflineEvent } = await import('@/services/offlineEventsService');
        await addOfflineEvent(ctx.characterId, {
          type: 'social',
          message: logMessage,
        } as any);
      } catch {}

      return {
        success: true,
        data: {
          character: updatedChar,
          message: logMessage,
          templeProgress,
          factionReputation,
          rankUp: rankUpData,
        },
        events,
      };
    },
    input,
    context
  );
}

