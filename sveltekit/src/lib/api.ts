import { browser } from '$app/environment';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

interface FetchOptions extends RequestInit {
	csrf?: boolean;
}

class APIError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
		this.name = 'APIError';
	}
}

export async function fetchAPI<T = any>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<T> {
	const { csrf = true, ...fetchOptions } = options;

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...fetchOptions.headers
	};

	// Add CSRF token for mutations
	if (browser && csrf && fetchOptions.method && fetchOptions.method !== 'GET') {
		const csrfToken = document.cookie
			.split('; ')
			.find((row) => row.startsWith('csrf_token='))
			?.split('=')[1];
		if (csrfToken) {
			headers['x-csrf-token'] = csrfToken;
		}
	}

	const response = await fetch(`${API_BASE}${endpoint}`, {
		...fetchOptions,
		headers,
		credentials: 'include'
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: response.statusText }));
		throw new APIError(response.status, error.error || 'API request failed');
	}

	return response.json();
}

// API functions
export const api = {
	// Health check
	health: () => fetchAPI('/api/health'),

	// Characters
	getCharacter: (id: string) => fetchAPI(`/api/characters/${id}`),
	getQuests: (characterId: string) => fetchAPI(`/api/quests?characterId=${characterId}`),
	getActiveQuest: (characterId: string) =>
		fetchAPI(`/api/quests/active?characterId=${characterId}`),
	setActiveQuest: (characterId: string, questId: string) =>
		fetchAPI('/api/quests/set-active', {
			method: 'POST',
			body: JSON.stringify({ characterId, questId })
		}),

	// Character actions
	equipItem: (characterId: string, itemId: string) =>
		fetchAPI('/api/character/equip', {
			method: 'POST',
			body: JSON.stringify({ characterId, itemId })
		}),
	unequipItem: (characterId: string, slot: string) =>
		fetchAPI('/api/character/unequip', {
			method: 'POST',
			body: JSON.stringify({ characterId, slot })
		}),
	useItem: (characterId: string, itemId: string) =>
		fetchAPI('/api/character/use-item', {
			method: 'POST',
			body: JSON.stringify({ characterId, itemId })
		}),
	dropItem: (characterId: string, itemId: string, quantity?: number) =>
		fetchAPI('/api/character/drop-item', {
			method: 'POST',
			body: JSON.stringify({ characterId, itemId, quantity })
		}),
	assignPoints: (
		characterId: string,
		pointType: 'attribute' | 'skill',
		targetStat: string,
		amount: number
	) =>
		fetchAPI('/api/character/assign-points', {
			method: 'POST',
			body: JSON.stringify({ characterId, pointType, targetStat, amount })
		}),
	unlockPerk: (characterId: string, perkId: string) =>
		fetchAPI('/api/character/unlock-perk', {
			method: 'POST',
			body: JSON.stringify({ characterId, perkId })
		}),
	rest: (characterId: string, duration?: number) =>
		fetchAPI('/api/character/rest', {
			method: 'POST',
			body: JSON.stringify({ characterId, duration })
		}),
	travel: (characterId: string, destinationId: string) =>
		fetchAPI('/api/character/travel', {
			method: 'POST',
			body: JSON.stringify({ characterId, destinationId })
		}),

	// Divine interventions
	performIntervention: (characterId: string, type: 'bless' | 'punish') =>
		fetchAPI('/api/divine/intervention', {
			method: 'POST',
			body: JSON.stringify({ characterId, type })
		}),
	suggestTravel: (characterId: string, destinationId: string) =>
		fetchAPI('/api/divine/suggest-travel', {
			method: 'POST',
			body: JSON.stringify({ characterId, destinationId })
		}),
	sendDivineMessage: (characterId: string, text: string) =>
		fetchAPI('/api/divine/message', {
			method: 'POST',
			body: JSON.stringify({ characterId, text })
		}),

	// Factions
	donateToFaction: (characterId: string, factionId: string, amount: number) =>
		fetchAPI('/api/factions/donate', {
			method: 'POST',
			body: JSON.stringify({ characterId, factionId, amount })
		}),

	// Market
	getMarketList: (characterId: string) =>
		fetchAPI(`/api/market/list?characterId=${characterId}`),
	marketTrade: (characterId: string, itemId: string, quantity: number, action: 'buy' | 'sell') =>
		fetchAPI('/api/market/trade', {
			method: 'POST',
			body: JSON.stringify({ characterId, itemId, quantity, action })
		}),

	// Crafting
	getRecipes: (characterId: string) =>
		fetchAPI(`/api/crafting/recipes?characterId=${characterId}`),
	performCrafting: (characterId: string, recipeId: string, quantity: number) =>
		fetchAPI('/api/crafting/perform', {
			method: 'POST',
			body: JSON.stringify({ characterId, recipeId, quantity })
		}),
	unlockRecipe: (characterId: string, recipeId: string) =>
		fetchAPI('/api/crafting/unlock', {
			method: 'POST',
			body: JSON.stringify({ characterId, recipeId })
		}),

	// Gathering
	startGathering: (characterId: string, nodeId: string) =>
		fetchAPI('/api/gathering/start', {
			method: 'POST',
			body: JSON.stringify({ characterId, nodeId })
		}),

	// Combat analytics
	getCombatAnalytics: (characterId: string) =>
		fetchAPI(`/api/combat-analytics?characterId=${characterId}`),

	// Shouts
	getShouts: () => fetchAPI('/api/shouts'),
	getKnownShouts: (characterId: string) =>
		fetchAPI(`/api/shouts/known?characterId=${characterId}`)
};
