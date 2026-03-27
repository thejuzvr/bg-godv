import { writable } from 'svelte/store';

export interface AdventureLogEntry {
	id: string;
	timestamp: number;
	type: string;
	message: string;
	icon?: string;
	data?: any;
}

function createGameEventsStore() {
	const { subscribe, set, update } = writable<AdventureLogEntry[]>([]);

	return {
		subscribe,
		set,
		add: (entry: Omit<AdventureLogEntry, 'id' | 'timestamp'>) => {
			update((events) => [
				...events.slice(-99), // Keep last 100 entries
				{
					...entry,
					id: `${Date.now()}-${Math.random()}`,
					timestamp: Date.now()
				}
			]);
		},
		clear: () => set([])
	};
}

export const adventureLog = createGameEventsStore();
