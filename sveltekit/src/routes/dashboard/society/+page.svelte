<script lang="ts">
	import { character } from '$stores/character';
	import { IconUsers, IconUserPlus, IconMessage, IconHeart, IconStar } from '@tabler/icons-svelte';

	let selectedTab = $state<string>('companions');
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-4xl font-bold text-skyrim-gold flex items-center gap-3">
			<IconUsers size={32} />
			Общество
		</h1>
		<p class="text-base-content/70 mt-1">Компаньоны и социальные взаимодействия</p>
	</div>

	<!-- Tabs -->
	<div class="tabs tabs-boxed">
		<button
			class="tab"
			class:tab-active={selectedTab === 'companions'}
			onclick={() => (selectedTab = 'companions')}
		>
			<IconUsers size={18} />
			<span class="ml-2">Компаньоны</span>
		</button>
		<button
			class="tab"
			class:tab-active={selectedTab === 'relationships'}
			onclick={() => (selectedTab = 'relationships')}
		>
			<IconHeart size={18} />
			<span class="ml-2">Отношения</span>
		</button>
	</div>

	<!-- Content -->
	{#if selectedTab === 'companions'}
		<div class="skyrim-card p-6">
			<h2 class="text-2xl font-bold text-skyrim-gold mb-4">Ваши компаньоны</h2>

			{#if $character?.companions && $character.companions.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each $character.companions as companion}
						<div class="p-4 rounded-lg border">
							<div class="flex items-start gap-4">
								<div class="w-16 h-16 rounded-full bg-base-100 flex items-center justify-center">
									<IconUsers size={32} />
								</div>
								<div class="flex-1">
									<h3 class="font-bold">{companion.name}</h3>
									<div class="text-xs opacity-70 capitalize">{companion.role || 'Компаньон'}</div>
									<div class="flex items-center gap-2 mt-2">
										<IconStar size={14} />
										<span class="text-sm">Уровень {companion.level || 1}</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-12 opacity-70">
					<IconUsers size={48} class="mx-auto mb-4 opacity-50" />
					<p>У вас пока нет компаньонов</p>
					<p class="text-sm">Найдите союзников в своих путешествиях</p>
				</div>
			{/if}
		</div>
	{:else if selectedTab === 'relationships'}
		<div class="skyrim-card p-6">
			<h2 class="text-2xl font-bold text-skyrim-gold mb-4">Отношения с NPC</h2>
			<div class="text-center py-12 opacity-70">
				<IconHeart size={48} class="mx-auto mb-4 opacity-50" />
				<p>Система отношений будет доступна скоро</p>
			</div>
		</div>
	{/if}
</div>
