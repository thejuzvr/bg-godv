import { writable, derived } from 'svelte/store';
import type { Character } from '$types/character';

function createCharacterStore() {
	const { subscribe, set, update } = writable<Character | null>(null);

	return {
		subscribe,
		set,
		update,

		// Helper methods
		updateStats: (stats: Partial<Character['stats']>) => {
			update((char) => {
				if (!char) return char;
				return {
					...char,
					stats: { ...char.stats, ...stats }
				};
			});
		},

		addToInventory: (item: any) => {
			update((char) => {
				if (!char) return char;
				return {
					...char,
					inventory: [...char.inventory, item]
				};
			});
		},

		removeFromInventory: (itemId: string) => {
			update((char) => {
				if (!char) return char;
				return {
					...char,
					inventory: char.inventory.filter((i) => i.id !== itemId)
				};
			});
		}
	};
}

export const character = createCharacterStore();

// Derived stores
export const isAlive = derived(character, ($char) =>
	$char ? $char.stats.health.current > 0 : false
);

export const isTraveling = derived(character, ($char) => $char?.status === 'traveling');

export const isResting = derived(character, ($char) => $char?.status === 'resting');

export const healthPercent = derived(character, ($char) =>
	$char ? ($char.stats.health.current / $char.stats.health.max) * 100 : 0
);

export const magickaPercent = derived(character, ($char) =>
	$char ? ($char.stats.magicka.current / $char.stats.magicka.max) * 100 : 0
);

export const staminaPercent = derived(character, ($char) =>
	$char ? ($char.stats.stamina.current / $char.stats.stamina.max) * 100 : 0
);
