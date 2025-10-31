<script lang="ts">
	import { onMount } from 'svelte';
	import { character } from '$stores/character';
	import { api } from '$lib/api';
	import { allItems } from '$data/data/items';
	import {
		IconShoppingCart,
		IconCoins,
		IconTrendingUp,
		IconTrendingDown,
		IconStar,
		IconFilter,
		IconSearch
	} from '@tabler/icons-svelte';

	interface MarketListing {
		id: string;
		itemId: string;
		sellerId: string | null;
		sellerName: string;
		price: number;
		quantity: number;
		priceHistory?: Array<{ price: number; timestamp: Date }>;
	}

	let listings = $state<MarketListing[]>([]);
	let filter = $state<string>('all');
	let searchQuery = $state('');
	let loading = $state(false);
	let message = $state('');
	let selectedListing = $state<MarketListing | null>(null);
	let buyQuantity = $state(1);

	onMount(async () => {
		await loadMarketListings();
	});

	async function loadMarketListings() {
		loading = true;
		try {
			// Mock data - replace with actual API call
			const mockListings: MarketListing[] = [
				{
					id: '1',
					itemId: 'weapon_iron_sword',
					sellerId: null,
					sellerName: 'Торговец',
					price: 100,
					quantity: 5,
					priceHistory: []
				},
				{
					id: '2',
					itemId: 'armor_iron_helmet',
					sellerId: null,
					sellerName: 'Кузнец',
					price: 80,
					quantity: 3
				},
				{
					id: '3',
					itemId: 'potion_minor_healing',
					sellerId: null,
					sellerName: 'Алхимик',
					price: 25,
					quantity: 10
				}
			];
			listings = mockListings;
		} catch (error) {
			console.error('Failed to load market:', error);
		} finally {
			loading = false;
		}
	}

	const filteredListings = $derived(() => {
		let result = listings;

		// Filter by type
		if (filter !== 'all') {
			result = result.filter((listing) => {
				const item = getItemDetails(listing.itemId);
				return item?.type === filter;
			});
		}

		// Search
		if (searchQuery) {
			result = result.filter((listing) => {
				const item = getItemDetails(listing.itemId);
				return item?.name.toLowerCase().includes(searchQuery.toLowerCase());
			});
		}

		return result;
	});

	function getItemDetails(itemId: string) {
		return allItems.find((i) => i.id === itemId);
	}

	async function buyItem(listingId: string, quantity: number) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			// Mock purchase - replace with actual API
			message = `Куплено ${quantity} шт.`;
			await loadMarketListings();
			selectedListing = null;
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	async function sellItem(itemId: string, quantity: number, price: number) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			// Mock sell - replace with actual API
			message = `Выставлено на продажу`;
			await loadMarketListings();
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	function openBuyModal(listing: MarketListing) {
		selectedListing = listing;
		buyQuantity = 1;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold text-skyrim-gold flex items-center gap-3">
				<IconShoppingCart size={32} />
				Рынок
			</h1>
			{#if $character}
				<p class="text-base-content/70 mt-1 flex items-center gap-2">
					<IconCoins size={18} class="text-skyrim-gold" />
					<span>Ваше золото: <strong>{$character.inventory.find((i) => i.id === 'gold')?.quantity || 0}</strong></span>
				</p>
			{/if}
		</div>
		{#if message}
			<div class="alert alert-success">
				<span>{message}</span>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
		<!-- Left: Filters & Search -->
		<div class="lg:col-span-1">
			<div class="skyrim-card p-6 space-y-4">
				<div>
					<h3 class="font-bold mb-3 flex items-center gap-2">
						<IconSearch size={20} />
						Поиск
					</h3>
					<input
						type="text"
						class="input input-bordered w-full"
						placeholder="Искать предмет..."
						bind:value={searchQuery}
					/>
				</div>

				<div class="divider">Фильтры</div>

				<div>
					<h3 class="font-bold mb-3 flex items-center gap-2">
						<IconFilter size={20} />
						Тип
					</h3>
					<div class="flex flex-col gap-2">
						<button
							class="btn btn-sm"
							class:btn-primary={filter === 'all'}
							onclick={() => (filter = 'all')}
						>
							Все предметы
						</button>
						<button
							class="btn btn-sm"
							class:btn-primary={filter === 'weapon'}
							onclick={() => (filter = 'weapon')}
						>
							Оружие
						</button>
						<button
							class="btn btn-sm"
							class:btn-primary={filter === 'armor'}
							onclick={() => (filter = 'armor')}
						>
							Броня
						</button>
						<button
							class="btn btn-sm"
							class:btn-primary={filter === 'potion'}
							onclick={() => (filter = 'potion')}
						>
							Зелья
						</button>
						<button
							class="btn btn-sm"
							class:btn-primary={filter === 'misc'}
							onclick={() => (filter = 'misc')}
						>
							Разное
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Right: Market listings -->
		<div class="lg:col-span-3">
			<div class="skyrim-card p-6">
				<h2 class="text-2xl font-bold text-skyrim-gold mb-4">
					Доступные предметы ({filteredListings().length})
				</h2>

				{#if loading}
					<div class="text-center py-12">
						<span class="loading loading-spinner loading-lg"></span>
					</div>
				{:else if filteredListings().length === 0}
					<div class="text-center py-12 opacity-70">
						<IconShoppingCart size={48} class="mx-auto mb-4 opacity-50" />
						<p>Нет предметов</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each filteredListings() as listing}
							{@const item = getItemDetails(listing.itemId)}
							{#if item}
								<div class="p-4 rounded-lg border hover:bg-base-300 transition-all">
									<div class="flex items-start gap-4">
										<div class="flex-shrink-0">
											<div
												class="w-16 h-16 rounded bg-base-100 flex items-center justify-center"
											>
												<IconShoppingCart size={32} />
											</div>
										</div>

										<div class="flex-1 min-w-0">
											<h3 class="font-bold text-lg">{item.name}</h3>
											<div class="text-xs opacity-70 mb-2 capitalize">{item.type}</div>

											<div class="flex items-center gap-3 mb-3">
												<div class="flex items-center gap-1 text-skyrim-gold font-bold">
													<IconCoins size={16} />
													<span>{listing.price}</span>
												</div>
												<div class="text-xs opacity-70">× {listing.quantity} шт.</div>
											</div>

											{#if item.damage}
												<div class="badge badge-error badge-xs">Урон: {item.damage}</div>
											{/if}
											{#if item.armor}
												<div class="badge badge-info badge-xs">Броня: {item.armor}</div>
											{/if}

											<div class="text-xs opacity-70 mt-2">
												Продавец: {listing.sellerName}
											</div>

											<button
												class="btn btn-primary btn-sm w-full mt-3"
												onclick={() => openBuyModal(listing)}
												disabled={loading || !$character}
											>
												Купить
											</button>
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Your listings (if you're selling) -->
			<div class="skyrim-card p-6 mt-6">
				<h2 class="text-2xl font-bold text-skyrim-gold mb-4">Ваши объявления</h2>
				<div class="text-center py-8 opacity-70">
					<p>У вас пока нет активных объявлений</p>
					<button class="btn btn-outline btn-sm mt-4">Выставить предмет</button>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Buy Modal -->
{#if selectedListing}
	{@const item = getItemDetails(selectedListing.itemId)}
	{#if item}
		<div class="modal modal-open">
			<div class="modal-box">
				<h3 class="font-bold text-lg mb-4">Покупка: {item.name}</h3>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span>Цена за шт.</span>
						<span class="flex items-center gap-1 font-bold text-skyrim-gold">
							<IconCoins size={16} />
							{selectedListing.price}
						</span>
					</div>

					<div class="form-control">
						<label class="label" for="buy-quantity">
							<span class="label-text">Количество</span>
						</label>
						<input
							type="range"
							id="buy-quantity"
							class="range range-primary"
							min="1"
							max={selectedListing.quantity}
							bind:value={buyQuantity}
						/>
						<div class="flex justify-between text-xs px-2">
							<span>1</span>
							<span class="font-bold">{buyQuantity}</span>
							<span>{selectedListing.quantity}</span>
						</div>
					</div>

					<div class="divider">Итого</div>

					<div class="flex items-center justify-between text-xl">
						<span class="font-bold">Всего:</span>
						<span class="flex items-center gap-2 font-bold text-skyrim-gold">
							<IconCoins size={24} />
							{selectedListing.price * buyQuantity}
						</span>
					</div>

					{#if $character}
						{@const gold = $character.inventory.find((i) => i.id === 'gold')?.quantity || 0}
						{@const totalCost = selectedListing.price * buyQuantity}
						{#if gold < totalCost}
							<div class="alert alert-error">
								<span>Недостаточно золота!</span>
							</div>
						{/if}
					{/if}
				</div>

				<div class="modal-action">
					<button class="btn btn-outline" onclick={() => (selectedListing = null)}
						>Отмена</button
					>
					<button
						class="btn btn-primary"
						onclick={() => buyItem(selectedListing.id, buyQuantity)}
						disabled={loading ||
							!$character ||
							($character.inventory.find((i) => i.id === 'gold')?.quantity || 0) <
								selectedListing.price * buyQuantity}
					>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						Купить
					</button>
				</div>
			</div>
			<div class="modal-backdrop" onclick={() => (selectedListing = null)}></div>
		</div>
	{/if}
{/if}
