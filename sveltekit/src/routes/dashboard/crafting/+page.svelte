<script lang="ts">
	import { character } from '$stores/character';
	import { api } from '$lib/api';
	import { allRecipes } from '$data/data/recipes';
	import { allItems } from '$data/data/items';
	import {
		IconHammer,
		IconFlask,
		IconScissors,
		IconWand,
		IconCheck,
		IconLock,
		IconAlertCircle
	} from '@tabler/icons-svelte';

	interface Recipe {
		id: string;
		name: string;
		resultItemId: string;
		category: 'smithing' | 'alchemy' | 'enchanting' | 'cooking' | 'leatherworking';
		requiredSkill: string;
		requiredSkillLevel: number;
		ingredients: Array<{ id: string; quantity: number }>;
		craftTime: number;
		xpReward: number;
	}

	let selectedCategory = $state<string>('all');
	let selectedRecipe = $state<Recipe | null>(null);
	let loading = $state(false);
	let message = $state('');

	const categories = [
		{ id: 'smithing', name: 'Кузнечное дело', icon: IconHammer, color: 'text-error' },
		{ id: 'alchemy', name: 'Алхимия', icon: IconFlask, color: 'text-success' },
		{ id: 'cooking', name: 'Кулинария', icon: IconScissors, color: 'text-warning' },
		{ id: 'enchanting', name: 'Зачарование', icon: IconWand, color: 'text-info' }
	];

	const filteredRecipes = $derived(() => {
		if (selectedCategory === 'all') return allRecipes;
		return allRecipes.filter((r) => r.category === selectedCategory);
	});

	function canCraftRecipe(recipe: Recipe): boolean {
		if (!$character) return false;

		// Check skill level
		const skill = ($character.skills as any)[recipe.requiredSkill];
		if (skill < recipe.requiredSkillLevel) return false;

		// Check ingredients
		return recipe.ingredients.every((ing) => {
			const item = $character.inventory.find((i) => i.id === ing.id);
			return item && item.quantity >= ing.quantity;
		});
	}

	function getItemDetails(itemId: string) {
		return allItems.find((i) => i.id === itemId);
	}

	async function craftItem(recipeId: string) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			// Mock craft - replace with actual API
			message = 'Предмет создан!';
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
				<IconHammer size={32} />
				Крафт
			</h1>
			<p class="text-base-content/70 mt-1">
				Доступно рецептов: {filteredRecipes().length}
			</p>
		</div>
		{#if message}
			<div class="alert alert-success">
				<span>{message}</span>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
		<!-- Left: Categories -->
		<div class="lg:col-span-1">
			<div class="skyrim-card p-6">
				<h3 class="font-bold mb-4">Категории</h3>
				<div class="flex flex-col gap-2">
					<button
						class="btn btn-sm justify-start"
						class:btn-primary={selectedCategory === 'all'}
						onclick={() => (selectedCategory = 'all')}
					>
						Все рецепты
					</button>
					{#each categories as category}
						<button
							class="btn btn-sm justify-start"
							class:btn-primary={selectedCategory === category.id}
							onclick={() => (selectedCategory = category.id)}
						>
							<svelte:component this={category.icon} size={18} class={category.color} />
							{category.name}
						</button>
					{/each}
				</div>
			</div>

			<!-- Crafting Skills -->
			{#if $character}
				<div class="skyrim-card p-6 mt-6">
					<h3 class="font-bold mb-4">Навыки</h3>
					<div class="space-y-3 text-sm">
						<div>
							<div class="flex justify-between mb-1">
								<span>Кузнечное</span>
								<span class="font-bold">{$character.craftingLevel || 1}</span>
							</div>
							<progress
								class="progress progress-error w-full"
								value={$character.craftingLevel || 1}
								max="100"
							></progress>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right: Recipes -->
		<div class="lg:col-span-3">
			<div class="skyrim-card p-6">
				<h2 class="text-2xl font-bold text-skyrim-gold mb-4">Рецепты</h2>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each filteredRecipes() as recipe}
						{@const canCraft = canCraftRecipe(recipe)}
						{@const resultItem = getItemDetails(recipe.resultItemId)}
						<div
							class="p-4 rounded-lg border transition-all"
							class:border-success={canCraft}
							class:bg-success/10={canCraft}
							class:opacity-50={!canCraft}
						>
							<div class="flex items-start gap-4">
								<div class="flex-shrink-0">
									<div
										class="w-12 h-12 rounded bg-base-100 flex items-center justify-center"
									>
										{#if canCraft}
											<IconCheck size={24} class="text-success" />
										{:else}
											<IconLock size={24} />
										{/if}
									</div>
								</div>

								<div class="flex-1 min-w-0">
									<h3 class="font-bold">{recipe.name}</h3>
									{#if resultItem}
										<div class="text-xs opacity-70 capitalize">{resultItem.type}</div>
									{/if}

									<div class="mt-2 mb-2">
										<div class="text-xs font-bold mb-1">Требуется:</div>
										{#each recipe.ingredients as ing}
											{@const ingItem = getItemDetails(ing.id)}
											{@const hasEnough = $character?.inventory.find((i) => i.id === ing.id)?.quantity || 0}
											<div
												class="text-xs flex items-center gap-1"
												class:text-success={hasEnough >= ing.quantity}
												class:text-error={hasEnough < ing.quantity}
											>
												{ingItem?.name || ing.id} × {ing.quantity}
												{#if hasEnough < ing.quantity}
													<IconAlertCircle size={12} />
												{/if}
											</div>
										{/each}
									</div>

									<div class="flex gap-2 text-xs mb-3">
										<span class="badge badge-xs">
											{recipe.requiredSkill} {recipe.requiredSkillLevel}
										</span>
										<span class="badge badge-xs">+{recipe.xpReward} XP</span>
									</div>

									{#if canCraft}
										<button
											class="btn btn-primary btn-sm w-full"
											onclick={() => craftItem(recipe.id)}
											disabled={loading}
										>
											Создать
										</button>
									{:else}
										<button class="btn btn-sm btn-disabled w-full" disabled>
											Недоступно
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
