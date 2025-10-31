<script lang="ts">
	import { character } from '$stores/character';
	import { api } from '$lib/api';
	import { allFactions } from '$data/data/factions';
	import {
		IconShield,
		IconStar,
		IconTrendingUp,
		IconGift,
		IconCoins,
		IconAward,
		IconLock
	} from '@tabler/icons-svelte';

	let selectedFaction = $state<any>(null);
	let donationAmount = $state(50);
	let loading = $state(false);
	let message = $state('');

	function getFactionReputation(factionId: string): number {
		if (!$character) return 0;
		const rep = $character.factionReputations?.find((r: any) => r.factionId === factionId);
		return rep?.reputation || 0;
	}

	function getReputationLevel(reputation: number): string {
		if (reputation >= 100) return 'Легенда';
		if (reputation >= 80) return 'Превозносимый';
		if (reputation >= 60) return 'Уважаемый';
		if (reputation >= 40) return 'Дружелюбный';
		if (reputation >= 20) return 'Знакомый';
		if (reputation >= 0) return 'Нейтральный';
		if (reputation >= -20) return 'Недружелюбный';
		if (reputation >= -40) return 'Враждебный';
		return 'Ненавистный';
	}

	function getReputationColor(reputation: number): string {
		if (reputation >= 80) return 'text-success';
		if (reputation >= 40) return 'text-info';
		if (reputation >= 0) return 'text-base-content';
		if (reputation >= -40) return 'text-warning';
		return 'text-error';
	}

	async function donateFaction(factionId: string, amount: number) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			const data = await api.donateFaction($character.id, factionId, amount);
			character.set(data.character);
			message = `Пожертвовано ${amount} золота`;
			setTimeout(() => (message = ''), 2000);
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
				<IconShield size={32} />
				Фракции
			</h1>
			<p class="text-base-content/70 mt-1">
				Репутация определяет ваши отношения с организациями
			</p>
		</div>
		{#if message}
			<div class="alert alert-success">
				<span>{message}</span>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each allFactions as faction}
			{@const reputation = getFactionReputation(faction.id)}
			{@const reputationLevel = getReputationLevel(reputation)}
			{@const reputationColor = getReputationColor(reputation)}
			<div
				class="skyrim-card p-6 cursor-pointer hover:shadow-xl transition-all"
				onclick={() => (selectedFaction = faction)}
			>
				<div class="flex items-start gap-4">
					<div class="flex-shrink-0">
						<div class="w-16 h-16 rounded-full bg-base-100 flex items-center justify-center">
							<IconShield size={32} class="text-skyrim-gold" />
						</div>
					</div>

					<div class="flex-1 min-w-0">
						<h3 class="font-bold text-lg mb-1">{faction.name}</h3>
						<div class="text-xs opacity-70 mb-3 line-clamp-2">{faction.description}</div>

						<div class="mb-3">
							<div class="flex justify-between text-xs mb-1">
								<span>Репутация</span>
								<span class="font-bold {reputationColor}">{reputationLevel}</span>
							</div>
							<progress
								class="progress w-full"
								class:progress-success={reputation >= 40}
								class:progress-info={reputation >= 0 && reputation < 40}
								class:progress-error={reputation < 0}
								value={Math.abs(reputation)}
								max="100"
							></progress>
							<div class="text-xs text-right">{reputation}/100</div>
						</div>

						{#if faction.benefits && reputation >= 40}
							<div class="badge badge-success badge-xs">
								<IconGift size={12} />
								Доступны преимущества
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Faction Details Modal -->
{#if selectedFaction}
	{@const reputation = getFactionReputation(selectedFaction.id)}
	{@const reputationLevel = getReputationLevel(reputation)}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => (selectedFaction = null)}
			>
				×
			</button>

			<div class="flex items-center gap-4 mb-4">
				<div class="w-20 h-20 rounded-full bg-base-100 flex items-center justify-center">
					<IconShield size={40} class="text-skyrim-gold" />
				</div>
				<div>
					<h3 class="font-bold text-2xl">{selectedFaction.name}</h3>
					<div class="badge {getReputationColor(reputation)}">{reputationLevel}</div>
				</div>
			</div>

			<p class="mb-4">{selectedFaction.description}</p>

			<!-- Reputation progress -->
			<div class="mb-4">
				<div class="flex justify-between text-sm mb-2">
					<span>Репутация</span>
					<span class="font-bold">{reputation}/100</span>
				</div>
				<progress
					class="progress w-full h-3"
					class:progress-success={reputation >= 40}
					class:progress-info={reputation >= 0 && reputation < 40}
					class:progress-error={reputation < 0}
					value={Math.abs(reputation)}
					max="100"
				></progress>
			</div>

			<!-- Benefits -->
			{#if selectedFaction.benefits}
				<div class="divider">Преимущества</div>
				<div class="space-y-2 mb-4">
					{#each selectedFaction.benefits as benefit, i}
						{@const unlocked = reputation >= (benefit.requiredReputation || 40)}
						<div
							class="p-3 rounded-lg border"
							class:border-success={unlocked}
							class:bg-success/10={unlocked}
							class:opacity-50={!unlocked}
						>
							<div class="flex items-start gap-2">
								{#if unlocked}
									<IconAward size={18} class="text-success flex-shrink-0 mt-1" />
								{:else}
									<IconLock size={18} class="flex-shrink-0 mt-1" />
								{/if}
								<div class="flex-1">
									<div class="font-bold text-sm">{benefit.name || `Преимущество ${i + 1}`}</div>
									<div class="text-xs opacity-70">
										{benefit.description || 'Специальные привилегии'}
									</div>
									{#if !unlocked}
										<div class="text-xs mt-1">
											Требуется: {benefit.requiredReputation || 40} репутации
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Donation -->
			<div class="divider">Пожертвование</div>
			<div class="space-y-3">
				<p class="text-sm opacity-70">
					Пожертвуйте золото, чтобы повысить репутацию с {selectedFaction.name}
				</p>

				<div class="form-control">
					<label class="label" for="donation-amount">
						<span class="label-text">Сумма</span>
					</label>
					<input
						type="range"
						id="donation-amount"
						class="range range-primary"
						min="50"
						max="500"
						step="50"
						bind:value={donationAmount}
					/>
					<div class="flex justify-between text-xs px-2">
						<span>50</span>
						<span class="font-bold flex items-center gap-1">
							<IconCoins size={14} class="text-skyrim-gold" />
							{donationAmount}
						</span>
						<span>500</span>
					</div>
				</div>

				{#if $character}
					{@const gold = $character.inventory.find((i) => i.id === 'gold')?.quantity || 0}
					<div class="text-sm">
						Ваше золото: <strong>{gold}</strong>
					</div>
					{#if gold < donationAmount}
						<div class="alert alert-error">
							<span>Недостаточно золота!</span>
						</div>
					{/if}
				{/if}
			</div>

			<div class="modal-action">
				<button class="btn btn-outline" onclick={() => (selectedFaction = null)}
					>Закрыть</button
				>
				<button
					class="btn btn-primary"
					onclick={() => {
						donateFaction(selectedFaction.id, donationAmount);
						selectedFaction = null;
					}}
					disabled={loading ||
						!$character ||
						($character.inventory.find((i) => i.id === 'gold')?.quantity || 0) < donationAmount}
				>
					{#if loading}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Пожертвовать
				</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={() => (selectedFaction = null)}></div>
	</div>
{/if}
