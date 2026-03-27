<script lang="ts">
	import { character } from '$stores/character';
	import { api } from '$lib/api';
	import { _ } from 'svelte-i18n';
	import { allItems } from '$data/data/items';
	import {
		IconBackpack,
		IconShirt,
		IconShield,
		IconSword,
		IconPotion,
		IconCoin,
		IconTrash,
		IconX,
		IconCheck,
		IconWeight
	} from '@tabler/icons-svelte';

	interface InventoryItem {
		id: string;
		name: string;
		type: string;
		quantity: number;
		weight: number;
		rarity?: string;
		damage?: number;
		armor?: number;
		equipmentSlot?: string;
	}

	let selectedItem = $state<InventoryItem | null>(null);
	let filter = $state<string>('all');
	let loading = $state(false);
	let message = $state('');
	let showDropModal = $state(false);
	let dropQuantity = $state(1);

	const equipmentSlots = [
		{ id: 'head', name: 'Голова', icon: IconShirt },
		{ id: 'torso', name: 'Торс', icon: IconShirt },
		{ id: 'legs', name: 'Ноги', icon: IconShirt },
		{ id: 'hands', name: 'Руки', icon: IconShirt },
		{ id: 'feet', name: 'Ноги', icon: IconShirt },
		{ id: 'weapon', name: 'Оружие', icon: IconSword },
		{ id: 'ring', name: 'Кольцо', icon: IconShield },
		{ id: 'amulet', name: 'Амулет', icon: IconShield }
	];

	const totalWeight = $derived(
		$character?.inventory.reduce((sum, item) => sum + item.weight * item.quantity, 0) || 0
	);

	const maxWeight = $derived($character ? $character.attributes.strength * 10 : 100);

	const filteredInventory = $derived(() => {
		if (!$character) return [];
		if (filter === 'all') return $character.inventory;
		return $character.inventory.filter((item) => item.type === filter);
	});

	function getItemDetails(itemId: string) {
		return allItems.find((i) => i.id === itemId);
	}

	function getEquippedItem(slot: string) {
		if (!$character) return null;
		const itemId = $character.equippedItems[slot];
		if (!itemId) return null;
		const details = getItemDetails(itemId);
		return details;
	}

	function isItemEquipped(itemId: string): boolean {
		if (!$character) return false;
		return Object.values($character.equippedItems).includes(itemId);
	}

	function getItemIcon(type: string) {
		switch (type) {
			case 'weapon':
				return IconSword;
			case 'armor':
				return IconShirt;
			case 'potion':
			case 'food':
				return IconPotion;
			case 'gold':
				return IconCoin;
			default:
				return IconBackpack;
		}
	}

	function getRarityColor(rarity?: string) {
		switch (rarity) {
			case 'legendary':
				return 'text-warning';
			case 'epic':
				return 'text-secondary';
			case 'rare':
				return 'text-info';
			case 'uncommon':
				return 'text-success';
			default:
				return 'text-base-content';
		}
	}

	async function equipItem(itemId: string) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			const data = await api.equipItem($character.id, itemId);
			character.set(data.character);
			const item = getItemDetails(itemId);
			message = `Экипировано: ${item?.name}`;
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	async function unequipItem(slot: string) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			const data = await api.unequipItem($character.id, slot);
			character.set(data.character);
			message = 'Предмет снят';
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	async function useItem(itemId: string) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			const data = await api.useItem($character.id, itemId);
			character.set(data.character);
			const item = getItemDetails(itemId);
			message = `Использовано: ${item?.name}`;
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	async function dropItem(itemId: string, quantity: number) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			const data = await api.dropItem($character.id, itemId, quantity);
			character.set(data.character);
			message = 'Предмет выброшен';
			showDropModal = false;
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	function openDropModal(item: InventoryItem) {
		selectedItem = item;
		dropQuantity = 1;
		showDropModal = true;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-skyrim-gold flex items-center gap-3">
				<IconBackpack size={32} />
				Инвентарь
			</h1>
			<div class="flex items-center gap-4 mt-2 text-sm">
				<div class="flex items-center gap-2">
					<IconWeight size={18} />
					<span>
						Вес: <span class:text-error={totalWeight > maxWeight}
							>{totalWeight.toFixed(1)} / {maxWeight}</span
						>
					</span>
				</div>
				<div class="flex items-center gap-2">
					<IconBackpack size={18} />
					<span>
						Предметов: {$character?.inventory.length || 0}
					</span>
				</div>
			</div>
		</div>
		{#if message}
			<div class="alert alert-success">
				<span>{message}</span>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left: Equipment slots -->
		<div class="lg:col-span-1">
			<div class="skyrim-card p-6">
				<h2 class="text-2xl font-bold text-skyrim-gold mb-4">Экипировка</h2>

				<div class="space-y-3">
					{#each equipmentSlots as slot}
						{@const equipped = getEquippedItem(slot.id)}
						<div
							class="p-3 rounded-lg border transition-all"
							class:border-primary={equipped}
							class:bg-base-300={equipped}
						>
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded bg-base-100 flex items-center justify-center">
									<svelte:component this={slot.icon} size={20} />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm opacity-70">{slot.name}</div>
									{#if equipped}
										<div class="font-bold truncate">{equipped.name}</div>
										{#if equipped.damage}
											<div class="text-xs text-error">Урон: {equipped.damage}</div>
										{/if}
										{#if equipped.armor}
											<div class="text-xs text-info">Броня: {equipped.armor}</div>
										{/if}
									{:else}
										<div class="text-sm opacity-50">Пусто</div>
									{/if}
								</div>
								{#if equipped}
									<button
										class="btn btn-xs btn-circle btn-ghost"
										onclick={() => unequipItem(slot.id)}
										disabled={loading}
									>
										<IconX size={16} />
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- Character stats -->
				{#if $character}
					<div class="divider">Характеристики</div>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span>Базовый урон</span>
							<span class="font-bold">10</span>
						</div>
						<div class="flex justify-between">
							<span>Базовая броня</span>
							<span class="font-bold">5</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right: Inventory items -->
		<div class="lg:col-span-2">
			<div class="skyrim-card p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-2xl font-bold text-skyrim-gold">Предметы</h2>

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
							class:tab-active={filter === 'weapon'}
							onclick={() => (filter = 'weapon')}
						>
							Оружие
						</button>
						<button
							class="tab tab-sm"
							class:tab-active={filter === 'armor'}
							onclick={() => (filter = 'armor')}
						>
							Броня
						</button>
						<button
							class="tab tab-sm"
							class:tab-active={filter === 'potion'}
							onclick={() => (filter = 'potion')}
						>
							Зелья
						</button>
						<button
							class="tab tab-sm"
							class:tab-active={filter === 'misc'}
							onclick={() => (filter = 'misc')}
						>
							Разное
						</button>
					</div>
				</div>

				<!-- Items list -->
				<div class="space-y-2 max-h-[600px] overflow-y-auto">
					{#if $character && filteredInventory().length === 0}
						<div class="text-center py-12 opacity-70">
							<IconBackpack size={48} class="mx-auto mb-4 opacity-50" />
							<p>Инвентарь пуст</p>
						</div>
					{:else if $character}
						{#each filteredInventory() as item}
							{@const details = getItemDetails(item.id)}
							{@const Icon = getItemIcon(item.type)}
							{@const equipped = isItemEquipped(item.id)}
							<div
								class="p-4 rounded-lg border transition-all hover:bg-base-300 cursor-pointer"
								class:border-success={equipped}
								class:bg-success/10={equipped}
								onclick={() => (selectedItem = item)}
							>
								<div class="flex items-start gap-4">
									<div class="flex-shrink-0">
										<div
											class="w-12 h-12 rounded bg-base-100 flex items-center justify-center"
										>
											<svelte:component this={Icon} size={24} />
										</div>
									</div>

									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-4 mb-1">
											<div class="flex-1">
												<h3 class="font-bold {getRarityColor(item.rarity)}">
													{item.name}
													{#if item.quantity > 1}
														<span class="text-sm opacity-70">x{item.quantity}</span>
													{/if}
												</h3>
												{#if equipped}
													<span class="badge badge-success badge-xs">Экипировано</span>
												{/if}
											</div>
										</div>

										<div class="flex flex-wrap gap-2 text-xs mb-2">
											<span class="badge badge-sm">{item.type}</span>
											{#if item.weight}
												<span class="badge badge-sm">
													<IconWeight size={12} />
													{(item.weight * item.quantity).toFixed(1)}
												</span>
											{/if}
											{#if details?.damage}
												<span class="badge badge-error badge-sm">Урон: {details.damage}</span>
											{/if}
											{#if details?.armor}
												<span class="badge badge-info badge-sm">Броня: {details.armor}</span>
											{/if}
										</div>

										<!-- Actions -->
										<div class="flex gap-2">
											{#if details?.equipmentSlot && !equipped}
												<button
													class="btn btn-xs btn-primary"
													onclick={(e) => {
														e.stopPropagation();
														equipItem(item.id);
													}}
													disabled={loading}
												>
													Надеть
												</button>
											{/if}
											{#if equipped}
												<button
													class="btn btn-xs btn-outline"
													onclick={(e) => {
														e.stopPropagation();
														const slot = details?.equipmentSlot;
														if (slot) unequipItem(slot);
													}}
													disabled={loading}
												>
													Снять
												</button>
											{/if}
											{#if item.type === 'potion' || item.type === 'food'}
												<button
													class="btn btn-xs btn-success"
													onclick={(e) => {
														e.stopPropagation();
														useItem(item.id);
													}}
													disabled={loading}
												>
													Использовать
												</button>
											{/if}
											{#if item.id !== 'gold'}
												<button
													class="btn btn-xs btn-error btn-outline"
													onclick={(e) => {
														e.stopPropagation();
														openDropModal(item);
													}}
													disabled={loading}
												>
													<IconTrash size={14} />
												</button>
											{/if}
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

<!-- Drop Modal -->
{#if showDropModal && selectedItem}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">Выбросить предмет</h3>
			<p class="mb-4">
				Вы уверены, что хотите выбросить <strong>{selectedItem.name}</strong>?
			</p>

			{#if selectedItem.quantity > 1}
				<div class="form-control mb-4">
					<label class="label" for="drop-quantity">
						<span class="label-text">Количество</span>
					</label>
					<input
						type="range"
						id="drop-quantity"
						class="range range-primary"
						min="1"
						max={selectedItem.quantity}
						bind:value={dropQuantity}
					/>
					<div class="flex justify-between text-xs px-2">
						<span>1</span>
						<span class="font-bold">{dropQuantity}</span>
						<span>{selectedItem.quantity}</span>
					</div>
				</div>
			{/if}

			<div class="modal-action">
				<button class="btn btn-outline" onclick={() => (showDropModal = false)}>Отмена</button>
				<button
					class="btn btn-error"
					onclick={() => selectedItem && dropItem(selectedItem.id, dropQuantity)}
					disabled={loading}
				>
					{#if loading}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Выбросить
				</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={() => (showDropModal = false)}></div>
	</div>
{/if}
