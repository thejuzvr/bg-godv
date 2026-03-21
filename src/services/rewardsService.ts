export interface Rewards { gold?: number; xp?: number; items?: Array<{ id: string; quantity: number }>; }

// Resolve friendly item data (name, type, etc.) using game data service with static fallback
import { gameDataService } from "../../server/game-data-service";

export async function applyRewards(character: any, rewards: Rewards): Promise<{ character: any; log: string }> {
  const updated = structuredClone(character);
  const logs: string[] = [];
  if (rewards.gold && rewards.gold > 0) {
    const gold = updated.inventory.find((i: any) => i.id === 'gold');
    if (gold) gold.quantity += rewards.gold; else updated.inventory.push({ id: 'gold', name: 'Золото', weight: 0, type: 'gold', quantity: rewards.gold });
    logs.push(`+${rewards.gold} золота`);
  }
  if (rewards.xp && rewards.xp > 0) {
    updated.xp.current += rewards.xp;
    logs.push(`+${rewards.xp} опыта`);
  }
  if (rewards.items && rewards.items.length > 0) {
    for (const it of rewards.items) {
      const existing = updated.inventory.find((i: any) => i.id === it.id);
      let itemMeta: any = null;
      try {
        itemMeta = await gameDataService.getItemById(it.id);
      } catch {}
      const display = itemMeta || { id: it.id, name: it.id, weight: 0, type: 'misc' };
      if (existing) {
        existing.quantity += it.quantity;
      } else {
        updated.inventory.push({
          id: display.id,
          name: display.name,
          weight: display.weight || 0,
          type: display.type || 'misc',
          quantity: it.quantity,
          damage: display.damage,
          armor: display.armor,
          equipmentSlot: display.equipmentSlot,
          effect: display.effect,
          learningEffect: display.learningEffect,
        });
      }
    }
    logs.push('получены предметы');
  }
  return { character: updated, log: logs.join(', ') };
}
