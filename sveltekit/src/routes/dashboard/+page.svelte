<script lang="ts">
	import { onMount } from 'svelte';
	import { character } from '$stores/character';
	import { adventureLog } from '$stores/gameEvents';
	import { realtimeEvents } from '$lib/realtime';
	import { api } from '$lib/api';
	import { _ } from 'svelte-i18n';
	import {
		IconSparkles,
		IconBolt,
		IconCoins,
		IconSword,
		IconScroll,
		IconMapPin,
		IconClock
	} from '@tabler/icons-svelte';

	let interventionLoading = $state(false);
	let interventionMessage = $state('');
	let offlineEvents = $state<any[]>([]);

	// Listen to realtime events
	$effect(() => {
		const lastEvent = $realtimeEvents[$realtimeEvents.length - 1];
		if (lastEvent) {
			adventureLog.add({
				type: lastEvent.type,
				message: getEventMessage(lastEvent),
				icon: getEventIcon(lastEvent.type)
			});

			// Update character if tick update
			if (lastEvent.type === 'tick:update' && lastEvent.data?.characterId === $character?.id) {
				// Refresh character data
				loadCharacterData();
			}
		}
	});

	onMount(async () => {
		// Load offline events
		await loadOfflineEvents();
	});

	async function loadCharacterData() {
		if (!$character) return;
		try {
			const response = await fetch(`http://localhost:5000/api/characters/${$character.id}`, {
				credentials: 'include'
			});
			if (response.ok) {
				const data = await response.json();
				character.set(data.character);
			}
		} catch (error) {
			console.error('Failed to load character:', error);
		}
	}

	async function loadOfflineEvents() {
		if (!$character) return;
		try {
			const response = await fetch(
				`http://localhost:5000/api/offline-events?characterId=${$character.id}&limit=20`,
				{
					credentials: 'include'
				}
			);
			if (response.ok) {
				const data = await response.json();
				offlineEvents = data.events || [];
			}
		} catch (error) {
			console.error('Failed to load offline events:', error);
		}
	}

	async function performIntervention(type: 'bless' | 'punish') {
		if (!$character) return;

		interventionLoading = true;
		interventionMessage = '';

		try {
			const data = await api.performIntervention($character.id, type);
			interventionMessage = data.message;
			character.set(data.character);

			// Reload offline events to see the intervention message
			await loadOfflineEvents();
		} catch (error: any) {
			interventionMessage = error.message || 'Ошибка божественного вмешательства';
		} finally {
			interventionLoading = false;
		}
	}

	function getEventMessage(event: any): string {
		if (event.data?.message) return event.data.message;
		if (event.type === 'tick:update') return 'Персонаж обновлен';
		if (event.type === 'character:level_up') return `Повышен уровень до ${event.data?.level}!`;
		if (event.type === 'quest:completed') return `Квест завершен: ${event.data?.title}`;
		return event.type;
	}

	function getEventIcon(type: string): string {
		if (type.startsWith('combat:')) return 'Sword';
		if (type.startsWith('quest:')) return 'Scroll';
		if (type.startsWith('market:')) return 'Coins';
		if (type.startsWith('divine:')) return 'Sparkles';
		if (type.startsWith('character:')) return 'User';
		return 'Clock';
	}

	function formatTime(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	}

	function getEventTypeIcon(type: string) {
		switch (type) {
			case 'combat':
				return IconSword;
			case 'quest':
				return IconScroll;
			case 'explore':
			case 'travel':
				return IconMapPin;
			case 'divine':
				return IconSparkles;
			default:
				return IconClock;
		}
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
	<!-- Left column - Quick actions -->
	<div class="lg:col-span-1 space-y-6">
		<!-- Current status -->
		{#if $character}
			<div class="skyrim-card p-6">
				<h2 class="text-2xl font-bold text-skyrim-gold mb-4">Текущий статус</h2>
				<div class="space-y-3">
					<div class="flex items-center gap-3">
						<IconMapPin size={20} class="text-skyrim-gold" />
						<div>
							<div class="text-sm opacity-70">Локация</div>
							<div class="font-bold">{$character.location}</div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<IconClock size={20} class="text-skyrim-gold" />
						<div>
							<div class="text-sm opacity-70">Статус</div>
							<div class="font-bold capitalize">{$character.status}</div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<IconCoins size={20} class="text-skyrim-gold" />
						<div>
							<div class="text-sm opacity-70">Золото</div>
							<div class="font-bold">
								{$character.inventory.find((i) => i.id === 'gold')?.quantity || 0}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Divine Intervention -->
		<div class="skyrim-card p-6">
			<h2 class="text-2xl font-bold text-skyrim-gold mb-4 flex items-center gap-2">
				<IconSparkles size={24} />
				Божественное вмешательство
			</h2>

			<div class="mb-4">
				<div class="flex justify-between text-sm mb-2">
					<span>Сила вмешательства</span>
					<span
						>{$character?.interventionPower.current}/{$character?.interventionPower.max}</span
					>
				</div>
				<progress
					class="progress progress-primary w-full"
					value={$character?.interventionPower.current || 0}
					max={$character?.interventionPower.max || 100}
				></progress>
			</div>

			{#if interventionMessage}
				<div class="alert alert-info mb-4">
					<span>{interventionMessage}</span>
				</div>
			{/if}

			<div class="flex gap-3">
				<button
					class="btn btn-success flex-1"
					onclick={() => performIntervention('bless')}
					disabled={interventionLoading ||
						($character?.interventionPower.current || 0) < 50}
				>
					{#if interventionLoading}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					<IconSparkles size={20} />
					Благословить
				</button>
				<button
					class="btn btn-error flex-1"
					onclick={() => performIntervention('punish')}
					disabled={interventionLoading ||
						($character?.interventionPower.current || 0) < 50}
				>
					{#if interventionLoading}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					<IconBolt size={20} />
					Наказать
				</button>
			</div>
			<p class="text-xs text-center mt-3 opacity-70">Стоимость: 50 силы</p>
		</div>

		<!-- Quick stats -->
		<div class="skyrim-card p-6">
			<h2 class="text-2xl font-bold text-skyrim-gold mb-4">Статистика</h2>
			<div class="space-y-2">
				<div class="flex justify-between">
					<span>Уровень</span>
					<span class="font-bold">{$character?.level}</span>
				</div>
				<div class="flex justify-between">
					<span>Смертей</span>
					<span class="font-bold">{$character?.deaths || 0}</span>
				</div>
				<div class="flex justify-between">
					<span>Убито врагов</span>
					<span class="font-bold">
						{Object.values($character?.analytics?.killedEnemies || {}).reduce(
							(a, b) => a + b,
							0
						)}
					</span>
				</div>
				<div class="flex justify-between">
					<span>Завершено квестов</span>
					<span class="font-bold">{$character?.completedQuests?.length || 0}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Right column - Adventure log -->
	<div class="lg:col-span-2">
		<div class="skyrim-card p-6">
			<h2 class="text-3xl font-bold text-skyrim-gold mb-6">Журнал приключений</h2>

			<div class="space-y-3 max-h-[600px] overflow-y-auto">
				{#if offlineEvents.length === 0}
					<div class="text-center py-12 opacity-70">
						<IconScroll size={48} class="mx-auto mb-4 opacity-50" />
						<p>Ваше приключение только начинается...</p>
						<p class="text-sm">События будут появляться здесь</p>
					</div>
				{:else}
					{#each offlineEvents.slice().reverse() as event}
						{@const Icon = getEventTypeIcon(event.type)}
						<div class="flex gap-3 p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors">
							<div class="flex-shrink-0 mt-1">
								<div class="w-8 h-8 rounded-full bg-skyrim-blue/20 flex items-center justify-center">
									<svelte:component this={Icon} size={16} class="text-skyrim-gold" />
								</div>
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between gap-2 mb-1">
									<span class="text-xs opacity-70">
										{formatTime(event.timestamp)}
									</span>
									<span class="badge badge-sm capitalize">{event.type}</span>
								</div>
								<p class="text-sm leading-relaxed">{event.message}</p>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Realtime events (показывать поверх) -->
			{#if $adventureLog.length > 0}
				<div class="divider">Текущие события</div>
				<div class="space-y-2">
					{#each $adventureLog.slice(-5).reverse() as event}
						<div
							class="flex gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 animate-pulse"
						>
							<div class="flex-shrink-0">
								<div
									class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"
								>
									<IconSparkles size={14} class="text-primary" />
								</div>
							</div>
							<div class="flex-1">
								<div class="text-xs opacity-70 mb-1">
									{formatTime(event.timestamp)}
								</div>
								<p class="text-sm">{event.message}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
