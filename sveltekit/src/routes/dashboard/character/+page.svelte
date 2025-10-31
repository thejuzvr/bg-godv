<script lang="ts">
	import { character } from '$stores/character';
	import { api } from '$lib/api';
	import { _ } from 'svelte-i18n';
	import { allPerks } from '$data/data/perks';
	import {
		IconSword,
		IconShield,
		IconSparkles,
		IconUsers,
		IconTrophy,
		IconChevronRight,
		IconLock,
		IconCheck
	} from '@tabler/icons-svelte';

	interface PerkCategory {
		id: string;
		name: string;
		icon: any;
		color: string;
	}

	const categories: PerkCategory[] = [
		{ id: 'combat', name: 'Боевые', icon: IconSword, color: 'text-error' },
		{ id: 'crafting', name: 'Крафт', icon: IconShield, color: 'text-warning' },
		{ id: 'magic', name: 'Магия', icon: IconSparkles, color: 'text-info' },
		{ id: 'social', name: 'Социальные', icon: IconUsers, color: 'text-success' }
	];

	let selectedCategory = $state<string>('combat');
	let selectedAttribute = $state<string | null>(null);
	let selectedSkill = $state<string | null>(null);
	let loading = $state(false);
	let message = $state('');

	const categoryPerks = $derived(
		allPerks.filter((perk) => perk.category === selectedCategory)
	);

	const attributeLabels: Record<string, string> = {
		strength: 'Сила',
		agility: 'Ловкость',
		intelligence: 'Интеллект',
		endurance: 'Выносливость'
	};

	const skillLabels: Record<string, string> = {
		oneHanded: 'Одноручное',
		block: 'Блок',
		heavyArmor: 'Тяжелая броня',
		lightArmor: 'Легкая броня',
		persuasion: 'Убеждение',
		alchemy: 'Алхимия'
	};

	function isPerkUnlocked(perkId: string): boolean {
		return $character?.unlockedPerks?.includes(perkId) || false;
	}

	function canUnlockPerk(perk: any): boolean {
		if (isPerkUnlocked(perk.id)) return false;

		// Check skill requirement
		if (perk.requiredSkillLevel && $character) {
			const skillValue = ($character.skills as any)[perk.skill];
			if (skillValue < perk.requiredSkillLevel) return false;
		}

		return true;
	}

	async function assignAttributePoint(attribute: string) {
		if (!$character || $character.points.attribute <= 0) return;

		loading = true;
		message = '';

		try {
			const data = await api.assignPoints($character.id, 'attribute', attribute, 1);
			character.set(data.character);
			message = `+1 ${attributeLabels[attribute]}`;
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	async function assignSkillPoint(skill: string) {
		if (!$character || $character.points.skill <= 0) return;

		loading = true;
		message = '';

		try {
			const data = await api.assignPoints($character.id, 'skill', skill, 1);
			character.set(data.character);
			message = `+1 ${skillLabels[skill]}`;
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	async function unlockPerk(perkId: string, perkName: string) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			const data = await api.unlockPerk($character.id, perkId);
			character.set(data.character);
			message = `Разблокирован: ${perkName}`;
			setTimeout(() => (message = ''), 3000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-skyrim-gold flex items-center gap-3">
				<IconTrophy size={32} />
				Персонаж
			</h1>
			<p class="text-base-content/70 mt-1">
				{$character?.name} • Уровень {$character?.level}
			</p>
		</div>
		{#if message}
			<div class="alert alert-success">
				<span>{message}</span>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left: Attributes & Skills -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Attributes -->
			<div class="skyrim-card p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-2xl font-bold text-skyrim-gold">Характеристики</h2>
					{#if $character && $character.points.attribute > 0}
						<span class="skyrim-badge">
							Очков: {$character.points.attribute}
						</span>
					{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#if $character}
						{#each Object.entries($character.attributes) as [key, value]}
							<div
								class="p-4 rounded-lg border transition-all cursor-pointer"
								class:border-primary={selectedAttribute === key}
								class:bg-base-300={selectedAttribute === key}
								onclick={() => (selectedAttribute = key)}
							>
								<div class="flex items-center justify-between mb-2">
									<span class="font-bold">{attributeLabels[key]}</span>
									<span class="text-2xl font-bold text-skyrim-gold">{value}</span>
								</div>
								<progress
									class="progress progress-primary w-full"
									value={value}
									max="100"
								></progress>
								{#if $character.points.attribute > 0}
									<button
										class="btn btn-sm btn-primary w-full mt-3"
										onclick={(e) => {
											e.stopPropagation();
											assignAttributePoint(key);
										}}
										disabled={loading}
									>
										+1 Очко
									</button>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Skills -->
			<div class="skyrim-card p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-2xl font-bold text-skyrim-gold">Навыки</h2>
					{#if $character && $character.points.skill > 0}
						<span class="skyrim-badge">
							Очков: {$character.points.skill}
						</span>
					{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#if $character}
						{#each Object.entries($character.skills) as [key, value]}
							<div
								class="p-4 rounded-lg border transition-all cursor-pointer"
								class:border-primary={selectedSkill === key}
								class:bg-base-300={selectedSkill === key}
								onclick={() => (selectedSkill = key)}
							>
								<div class="flex items-center justify-between mb-2">
									<span class="font-bold">{skillLabels[key]}</span>
									<span class="text-2xl font-bold text-skyrim-gold">{value}</span>
								</div>
								<progress
									class="progress progress-secondary w-full"
									value={value}
									max="100"
								></progress>
								{#if $character.points.skill > 0}
									<button
										class="btn btn-sm btn-secondary w-full mt-3"
										onclick={(e) => {
											e.stopPropagation();
											assignSkillPoint(key);
										}}
										disabled={loading}
									>
										+1 Очко
									</button>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Perks -->
			<div class="skyrim-card p-6">
				<h2 class="text-2xl font-bold text-skyrim-gold mb-4">Перки</h2>

				<!-- Category tabs -->
				<div class="tabs tabs-boxed mb-6">
					{#each categories as category}
						<button
							class="tab"
							class:tab-active={selectedCategory === category.id}
							onclick={() => (selectedCategory = category.id)}
						>
							<svelte:component this={category.icon} size={18} class={category.color} />
							<span class="ml-2">{category.name}</span>
						</button>
					{/each}
				</div>

				<!-- Perks list -->
				<div class="space-y-3">
					{#if categoryPerks.length === 0}
						<div class="text-center py-8 opacity-70">
							<p>Нет доступных перков в этой категории</p>
						</div>
					{:else}
						{#each categoryPerks as perk}
							{@const unlocked = isPerkUnlocked(perk.id)}
							{@const canUnlock = canUnlockPerk(perk)}
							<div
								class="p-4 rounded-lg border transition-all"
								class:border-success={unlocked}
								class:bg-success/10={unlocked}
								class:border-base-300={!unlocked && !canUnlock}
								class:opacity-50={!unlocked && !canUnlock}
							>
								<div class="flex items-start gap-4">
									<div class="flex-shrink-0">
										{#if unlocked}
											<div
												class="w-12 h-12 rounded-full bg-success flex items-center justify-center"
											>
												<IconCheck size={24} class="text-white" />
											</div>
										{:else}
											<div
												class="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center"
											>
												<IconLock size={24} class="opacity-50" />
											</div>
										{/if}
									</div>

									<div class="flex-1">
										<div class="flex items-start justify-between gap-4 mb-2">
											<div>
												<h3 class="font-bold text-lg">{perk.name}</h3>
												{#if perk.maxRank && perk.currentRank}
													<span class="text-xs opacity-70">
														Ранг {perk.currentRank}/{perk.maxRank}
													</span>
												{/if}
											</div>
											{#if !unlocked && canUnlock}
												<button
													class="btn btn-sm btn-primary"
													onclick={() => unlockPerk(perk.id, perk.name)}
													disabled={loading}
												>
													Разблокировать
												</button>
											{/if}
										</div>

										<p class="text-sm mb-2">{perk.description}</p>

										<div class="flex flex-wrap gap-2 text-xs">
											<span class="badge badge-sm">
												{skillLabels[perk.skill] || perk.skill}
											</span>
											{#if perk.requiredSkillLevel}
												<span
													class="badge badge-sm"
													class:badge-success={$character &&
														($character.skills as any)[perk.skill] >= perk.requiredSkillLevel}
													class:badge-error={$character &&
														($character.skills as any)[perk.skill] < perk.requiredSkillLevel}
												>
													Требуется: {perk.requiredSkillLevel}
												</span>
											{/if}
										</div>

										{#if perk.nextRankRequirement}
											<div class="mt-2 text-xs opacity-70 flex items-center gap-1">
												<IconChevronRight size={14} />
												{perk.nextRankRequirement}
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- Right: Stats Summary -->
		<div class="space-y-6">
			<!-- Level Progress -->
			{#if $character}
				<div class="skyrim-card p-6">
					<h3 class="text-xl font-bold text-skyrim-gold mb-4">Прогресс уровня</h3>
					<div class="space-y-3">
						<div>
							<div class="flex justify-between text-sm mb-2">
								<span>Опыт</span>
								<span>{$character.xp.current} / {$character.xp.required}</span>
							</div>
							<progress
								class="progress progress-primary w-full"
								value={$character.xp.current}
								max={$character.xp.required}
							></progress>
						</div>

						<div class="divider">Характеристики</div>

						<div class="space-y-2">
							<div class="flex justify-between">
								<span>Здоровье</span>
								<span class="font-bold">{$character.stats.health.max}</span>
							</div>
							<div class="flex justify-between">
								<span>Магия</span>
								<span class="font-bold">{$character.stats.magicka.max}</span>
							</div>
							<div class="flex justify-between">
								<span>Выносливость</span>
								<span class="font-bold">{$character.stats.stamina.max}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Character Info -->
				<div class="skyrim-card p-6">
					<h3 class="text-xl font-bold text-skyrim-gold mb-4">Информация</h3>
					<div class="space-y-3">
						<div>
							<div class="text-sm opacity-70">Раса</div>
							<div class="font-bold capitalize">{$character.race}</div>
						</div>
						<div>
							<div class="text-sm opacity-70">Пол</div>
							<div class="font-bold">
								{$character.gender === 'male' ? 'Мужской' : 'Женский'}
							</div>
						</div>
						<div>
							<div class="text-sm opacity-70">Покровитель</div>
							<div class="font-bold capitalize">{$character.patronDeity}</div>
						</div>
						<div>
							<div class="text-sm opacity-70">Смертей</div>
							<div class="font-bold">{$character.deaths}</div>
						</div>
						<div>
							<div class="text-sm opacity-70">Завершено квестов</div>
							<div class="font-bold">{$character.completedQuests?.length || 0}</div>
						</div>
					</div>
				</div>

				<!-- Unlocked Perks Summary -->
				<div class="skyrim-card p-6">
					<h3 class="text-xl font-bold text-skyrim-gold mb-4">Разблокированные перки</h3>
					{#if $character.unlockedPerks && $character.unlockedPerks.length > 0}
						<div class="space-y-2">
							{#each $character.unlockedPerks as perkId}
								{@const perk = allPerks.find((p) => p.id === perkId)}
								{#if perk}
									<div class="flex items-center gap-2 text-sm">
										<IconCheck size={16} class="text-success" />
										<span>{perk.name}</span>
									</div>
								{/if}
							{/each}
						</div>
					{:else}
						<p class="text-sm opacity-70">Нет разблокированных перков</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
