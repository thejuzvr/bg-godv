<script lang="ts">
	import { onMount } from 'svelte';
	import { character } from '$stores/character';
	import { api } from '$lib/api';
	import { _ } from 'svelte-i18n';
	import {
		IconScroll,
		IconTarget,
		IconCheck,
		IconX,
		IconClock,
		IconMapPin,
		IconStar,
		IconChevronRight,
		IconSparkles,
		IconCoins,
		IconGift
	} from '@tabler/icons-svelte';

	interface Quest {
		id: string;
		title: string;
		description: string;
		location: string;
		type: 'main' | 'side' | 'bounty' | 'urgent';
		status: 'available' | 'in-progress' | 'completed' | 'failed';
		progress: number;
		priority: number;
		isActive: boolean;
		rewards?: {
			gold?: number;
			xp?: number;
			items?: Array<{ id: string; quantity: number }>;
		};
		tasks?: Array<{
			id: string;
			title: string;
			status: string;
			progress: number;
		}>;
	}

	let quests = $state<Quest[]>([]);
	let selectedQuest = $state<Quest | null>(null);
	let filter = $state<string>('all');
	let loading = $state(false);
	let message = $state('');
	let showQuestModal = $state(false);

	onMount(async () => {
		await loadQuests();
	});

	async function loadQuests() {
		if (!$character) return;

		loading = true;
		try {
			const data = await api.getQuests($character.id);
			quests = data.quests || [];
		} catch (error) {
			console.error('Failed to load quests:', error);
		} finally {
			loading = false;
		}
	}

	const filteredQuests = $derived(() => {
		if (filter === 'all') return quests;
		if (filter === 'active') return quests.filter((q) => q.isActive);
		if (filter === 'in-progress') return quests.filter((q) => q.status === 'in-progress');
		if (filter === 'completed') return quests.filter((q) => q.status === 'completed');
		return quests.filter((q) => q.type === filter);
	});

	const activeQuest = $derived(quests.find((q) => q.isActive));

	function getQuestTypeColor(type: string) {
		switch (type) {
			case 'main':
				return 'badge-error';
			case 'urgent':
				return 'badge-warning';
			case 'side':
				return 'badge-info';
			case 'bounty':
				return 'badge-success';
			default:
				return 'badge-ghost';
		}
	}

	function getQuestTypeLabel(type: string) {
		switch (type) {
			case 'main':
				return 'Основной';
			case 'urgent':
				return 'Срочный';
			case 'side':
				return 'Побочный';
			case 'bounty':
				return 'Награда';
			default:
				return type;
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'completed':
				return IconCheck;
			case 'failed':
				return IconX;
			case 'in-progress':
				return IconClock;
			default:
				return IconTarget;
		}
	}

	async function setActiveQuest(questId: string) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			await api.setActiveQuest($character.id, questId);
			await loadQuests();
			message = 'Квест активирован';
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	async function suggestQuestTravel(destinationId: string) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			await api.suggestTravel($character.id, destinationId);
			message = 'Направление отправлено герою';
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	function openQuestDetails(quest: Quest) {
		selectedQuest = quest;
		showQuestModal = true;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-skyrim-gold flex items-center gap-3">
				<IconScroll size={32} />
				Квесты
			</h1>
			<p class="text-base-content/70 mt-1">
				Активных: {quests.filter((q) => q.status === 'in-progress').length} • Завершено: {quests.filter(
					(q) => q.status === 'completed'
				).length}
			</p>
		</div>
		{#if message}
			<div class="alert alert-success">
				<span>{message}</span>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left: Active quest -->
		<div class="lg:col-span-1">
			{#if activeQuest}
				<div class="skyrim-card p-6">
					<div class="flex items-center gap-2 mb-4">
						<IconStar size={24} class="text-skyrim-gold" />
						<h2 class="text-2xl font-bold text-skyrim-gold">Активный квест</h2>
					</div>

					<div class="space-y-4">
						<div>
							<h3 class="font-bold text-lg mb-2">{activeQuest.title}</h3>
							<p class="text-sm opacity-70 mb-3">{activeQuest.description}</p>

							<div class="flex gap-2 mb-3">
								<span class="badge {getQuestTypeColor(activeQuest.type)} badge-sm">
									{getQuestTypeLabel(activeQuest.type)}
								</span>
								<span class="badge badge-sm">
									<IconMapPin size={12} />
									{activeQuest.location}
								</span>
							</div>

							<div class="mb-3">
								<div class="flex justify-between text-xs mb-1">
									<span>Прогресс</span>
									<span>{activeQuest.progress}%</span>
								</div>
								<progress
									class="progress progress-primary w-full"
									value={activeQuest.progress}
									max="100"
								></progress>
							</div>
						</div>

						{#if activeQuest.tasks && activeQuest.tasks.length > 0}
							<div>
								<div class="font-bold mb-2">Задачи:</div>
								<div class="space-y-2">
									{#each activeQuest.tasks as task}
										{@const TaskIcon = getStatusIcon(task.status)}
										<div class="flex items-start gap-2 text-sm">
											<svelte:component
												this={TaskIcon}
												size={16}
												class={task.status === 'completed' ? 'text-success' : ''}
											/>
											<span class:line-through={task.status === 'completed'}>
												{task.title}
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if activeQuest.rewards}
							<div>
								<div class="font-bold mb-2">Награды:</div>
								<div class="flex gap-3 text-sm">
									{#if activeQuest.rewards.gold}
										<span class="flex items-center gap-1">
											<IconCoins size={16} class="text-skyrim-gold" />
											{activeQuest.rewards.gold}
										</span>
									{/if}
									{#if activeQuest.rewards.xp}
										<span class="flex items-center gap-1">
											<IconStar size={16} class="text-info" />
											{activeQuest.rewards.xp} XP
										</span>
									{/if}
									{#if activeQuest.rewards.items}
										<span class="flex items-center gap-1">
											<IconGift size={16} class="text-success" />
											{activeQuest.rewards.items.length}
										</span>
									{/if}
								</div>
							</div>
						{/if}

						<button
							class="btn btn-primary btn-sm w-full"
							onclick={() => suggestQuestTravel(activeQuest.location)}
							disabled={loading}
						>
							<IconSparkles size={16} />
							Направить героя
						</button>
					</div>
				</div>
			{:else}
				<div class="skyrim-card p-6">
					<h2 class="text-2xl font-bold text-skyrim-gold mb-4">Активный квест</h2>
					<div class="text-center py-8 opacity-70">
						<IconScroll size={48} class="mx-auto mb-4 opacity-50" />
						<p>Нет активного квеста</p>
						<p class="text-sm">Выберите квест из списка</p>
					</div>
				</div>
			{/if}

			<!-- Quest Stats -->
			<div class="skyrim-card p-6 mt-6">
				<h3 class="text-xl font-bold text-skyrim-gold mb-4">Статистика</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span>Всего квестов</span>
						<span class="font-bold">{quests.length}</span>
					</div>
					<div class="flex justify-between">
						<span>В процессе</span>
						<span class="font-bold">
							{quests.filter((q) => q.status === 'in-progress').length}
						</span>
					</div>
					<div class="flex justify-between">
						<span>Завершено</span>
						<span class="font-bold text-success">
							{quests.filter((q) => q.status === 'completed').length}
						</span>
					</div>
					<div class="flex justify-between">
						<span>Провалено</span>
						<span class="font-bold text-error">
							{quests.filter((q) => q.status === 'failed').length}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Right: All quests -->
		<div class="lg:col-span-2">
			<div class="skyrim-card p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-2xl font-bold text-skyrim-gold">Все квесты</h2>

					<!-- Filter -->
					<div class="tabs tabs-boxed">
						<button
							class="tab tab-sm"
							class:tab-active={filter === 'all'}
							onclick={() => (filter = 'all')}
						>
							Все
						</button>
						<button
							class="tab tab-sm"
							class:tab-active={filter === 'active'}
							onclick={() => (filter = 'active')}
						>
							Активный
						</button>
						<button
							class="tab tab-sm"
							class:tab-active={filter === 'in-progress'}
							onclick={() => (filter = 'in-progress')}
						>
							В процессе
						</button>
						<button
							class="tab tab-sm"
							class:tab-active={filter === 'main'}
							onclick={() => (filter = 'main')}
						>
							Основные
						</button>
						<button
							class="tab tab-sm"
							class:tab-active={filter === 'side'}
							onclick={() => (filter = 'side')}
						>
							Побочные
						</button>
					</div>
				</div>

				<!-- Quests list -->
				<div class="space-y-3 max-h-[700px] overflow-y-auto">
					{#if loading}
						<div class="text-center py-12">
							<span class="loading loading-spinner loading-lg"></span>
						</div>
					{:else if filteredQuests().length === 0}
						<div class="text-center py-12 opacity-70">
							<IconScroll size={48} class="mx-auto mb-4 opacity-50" />
							<p>Нет квестов</p>
						</div>
					{:else}
						{#each filteredQuests() as quest}
							<div
								class="p-4 rounded-lg border transition-all hover:bg-base-300 cursor-pointer"
								class:border-primary={quest.isActive}
								class:bg-primary/10={quest.isActive}
								onclick={() => openQuestDetails(quest)}
							>
								<div class="flex items-start gap-4">
									<div class="flex-shrink-0 mt-1">
										{#if quest.isActive}
											<IconStar size={24} class="text-skyrim-gold" />
										{:else if quest.status === 'completed'}
											<IconCheck size={24} class="text-success" />
										{:else if quest.status === 'failed'}
											<IconX size={24} class="text-error" />
										{:else}
											<IconScroll size={24} class="opacity-50" />
										{/if}
									</div>

									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-4 mb-2">
											<div class="flex-1">
												<h3 class="font-bold text-lg">{quest.title}</h3>
												<p class="text-sm opacity-70 line-clamp-2">{quest.description}</p>
											</div>
										</div>

										<div class="flex flex-wrap gap-2 mb-3">
											<span class="badge {getQuestTypeColor(quest.type)} badge-sm">
												{getQuestTypeLabel(quest.type)}
											</span>
											<span class="badge badge-sm">
												<IconMapPin size={12} />
												{quest.location}
											</span>
											{#if quest.priority >= 70}
												<span class="badge badge-error badge-sm">Высокий приоритет</span>
											{/if}
											{#if quest.isActive}
												<span class="badge badge-primary badge-sm">Активный</span>
											{/if}
										</div>

										{#if quest.status === 'in-progress' || quest.status === 'available'}
											<div class="mb-3">
												<div class="flex justify-between text-xs mb-1">
													<span>Прогресс</span>
													<span>{quest.progress}%</span>
												</div>
												<progress
													class="progress progress-primary w-full"
													value={quest.progress}
													max="100"
												></progress>
											</div>
										{/if}

										<!-- Rewards preview -->
										{#if quest.rewards}
											<div class="flex gap-3 text-xs opacity-70">
												{#if quest.rewards.gold}
													<span class="flex items-center gap-1">
														<IconCoins size={12} />
														{quest.rewards.gold}
													</span>
												{/if}
												{#if quest.rewards.xp}
													<span class="flex items-center gap-1">
														<IconStar size={12} />
														{quest.rewards.xp} XP
													</span>
												{/if}
											</div>
										{/if}

										<!-- Actions -->
										<div class="flex gap-2 mt-3">
											{#if !quest.isActive && quest.status === 'in-progress'}
												<button
													class="btn btn-xs btn-primary"
													onclick={(e) => {
														e.stopPropagation();
														setActiveQuest(quest.id);
													}}
													disabled={loading}
												>
													Сделать активным
												</button>
											{/if}
											<button
												class="btn btn-xs btn-outline"
												onclick={(e) => {
													e.stopPropagation();
													openQuestDetails(quest);
												}}
											>
												Детали
												<IconChevronRight size={14} />
											</button>
										</div>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Quest Details Modal -->
{#if showQuestModal && selectedQuest}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => (showQuestModal = false)}
			>
				<IconX size={20} />
			</button>

			<h3 class="font-bold text-2xl mb-2">{selectedQuest.title}</h3>

			<div class="flex gap-2 mb-4">
				<span class="badge {getQuestTypeColor(selectedQuest.type)}">
					{getQuestTypeLabel(selectedQuest.type)}
				</span>
				<span class="badge badge-outline">
					<IconMapPin size={14} />
					{selectedQuest.location}
				</span>
				{#if selectedQuest.isActive}
					<span class="badge badge-primary">Активный</span>
				{/if}
			</div>

			<p class="mb-4 leading-relaxed">{selectedQuest.description}</p>

			<!-- Progress -->
			{#if selectedQuest.status === 'in-progress'}
				<div class="mb-4">
					<div class="flex justify-between text-sm mb-2">
						<span>Прогресс квеста</span>
						<span>{selectedQuest.progress}%</span>
					</div>
					<progress
						class="progress progress-primary w-full h-3"
						value={selectedQuest.progress}
						max="100"
					></progress>
				</div>
			{/if}

			<!-- Tasks -->
			{#if selectedQuest.tasks && selectedQuest.tasks.length > 0}
				<div class="mb-4">
					<h4 class="font-bold mb-3">Задачи:</h4>
					<div class="space-y-2">
						{#each selectedQuest.tasks as task}
							{@const TaskIcon = getStatusIcon(task.status)}
							<div
								class="p-3 rounded-lg border"
								class:border-success={task.status === 'completed'}
								class:bg-success/10={task.status === 'completed'}
							>
								<div class="flex items-start gap-3">
									<svelte:component
										this={TaskIcon}
										size={18}
										class={task.status === 'completed' ? 'text-success' : ''}
									/>
									<div class="flex-1">
										<div
											class="font-medium"
											class:line-through={task.status === 'completed'}
										>
											{task.title}
										</div>
										{#if task.progress > 0 && task.status !== 'completed'}
											<progress
												class="progress progress-sm progress-primary w-full mt-2"
												value={task.progress}
												max="100"
											></progress>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Rewards -->
			{#if selectedQuest.rewards}
				<div class="divider">Награды</div>
				<div class="flex gap-4 justify-center mb-4">
					{#if selectedQuest.rewards.gold}
						<div class="text-center">
							<IconCoins size={32} class="mx-auto text-skyrim-gold mb-1" />
							<div class="font-bold">{selectedQuest.rewards.gold}</div>
							<div class="text-xs opacity-70">Золото</div>
						</div>
					{/if}
					{#if selectedQuest.rewards.xp}
						<div class="text-center">
							<IconStar size={32} class="mx-auto text-info mb-1" />
							<div class="font-bold">{selectedQuest.rewards.xp}</div>
							<div class="text-xs opacity-70">Опыт</div>
						</div>
					{/if}
					{#if selectedQuest.rewards.items && selectedQuest.rewards.items.length > 0}
						<div class="text-center">
							<IconGift size={32} class="mx-auto text-success mb-1" />
							<div class="font-bold">{selectedQuest.rewards.items.length}</div>
							<div class="text-xs opacity-70">Предметы</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Actions -->
			<div class="modal-action">
				{#if !selectedQuest.isActive && selectedQuest.status === 'in-progress'}
					<button
						class="btn btn-primary"
						onclick={() => {
							setActiveQuest(selectedQuest.id);
							showQuestModal = false;
						}}
						disabled={loading}
					>
						Сделать активным
					</button>
				{/if}
				<button
					class="btn btn-outline"
					onclick={() => {
						suggestQuestTravel(selectedQuest.location);
						showQuestModal = false;
					}}
					disabled={loading}
				>
					<IconSparkles size={16} />
					Направить героя
				</button>
				<button class="btn" onclick={() => (showQuestModal = false)}>Закрыть</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={() => (showQuestModal = false)}></div>
	</div>
{/if}
