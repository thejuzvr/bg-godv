// Crafting recipes
export interface Recipe {
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

export const allRecipes: Recipe[] = [
	// Smithing
	{
		id: 'recipe_iron_sword',
		name: 'Железный меч',
		resultItemId: 'weapon_iron_sword',
		category: 'smithing',
		requiredSkill: 'smithing',
		requiredSkillLevel: 1,
		ingredients: [
			{ id: 'iron_ingot', quantity: 2 },
			{ id: 'leather_strips', quantity: 1 }
		],
		craftTime: 60,
		xpReward: 10
	},
	{
		id: 'recipe_iron_helmet',
		name: 'Железный шлем',
		resultItemId: 'armor_iron_helmet',
		category: 'smithing',
		requiredSkill: 'smithing',
		requiredSkillLevel: 5,
		ingredients: [
			{ id: 'iron_ingot', quantity: 3 },
			{ id: 'leather_strips', quantity: 2 }
		],
		craftTime: 90,
		xpReward: 15
	},
	{
		id: 'recipe_steel_sword',
		name: 'Стальной меч',
		resultItemId: 'weapon_steel_sword',
		category: 'smithing',
		requiredSkill: 'smithing',
		requiredSkillLevel: 20,
		ingredients: [
			{ id: 'steel_ingot', quantity: 2 },
			{ id: 'leather_strips', quantity: 1 }
		],
		craftTime: 120,
		xpReward: 25
	},

	// Alchemy
	{
		id: 'recipe_minor_healing',
		name: 'Слабое зелье здоровья',
		resultItemId: 'potion_minor_healing',
		category: 'alchemy',
		requiredSkill: 'alchemy',
		requiredSkillLevel: 1,
		ingredients: [
			{ id: 'wheat', quantity: 1 },
			{ id: 'blue_mountain_flower', quantity: 1 }
		],
		craftTime: 30,
		xpReward: 8
	},
	{
		id: 'recipe_stamina_potion',
		name: 'Зелье выносливости',
		resultItemId: 'potion_stamina',
		category: 'alchemy',
		requiredSkill: 'alchemy',
		requiredSkillLevel: 10,
		ingredients: [
			{ id: 'torchbug_thorax', quantity: 1 },
			{ id: 'purple_mountain_flower', quantity: 1 }
		],
		craftTime: 40,
		xpReward: 12
	},

	// Cooking
	{
		id: 'recipe_grilled_salmon',
		name: 'Жареный лосось',
		resultItemId: 'food_salmon',
		category: 'cooking',
		requiredSkill: 'cooking',
		requiredSkillLevel: 1,
		ingredients: [{ id: 'raw_salmon', quantity: 1 }],
		craftTime: 20,
		xpReward: 5
	},
	{
		id: 'recipe_venison_stew',
		name: 'Оленье рагу',
		resultItemId: 'food_venison',
		category: 'cooking',
		requiredSkill: 'cooking',
		requiredSkillLevel: 15,
		ingredients: [
			{ id: 'raw_venison', quantity: 1 },
			{ id: 'potato', quantity: 2 },
			{ id: 'salt', quantity: 1 }
		],
		craftTime: 60,
		xpReward: 15
	},

	// Leatherworking
	{
		id: 'recipe_leather_armor',
		name: 'Кожаная броня',
		resultItemId: 'armor_leather_cuirass',
		category: 'leatherworking',
		requiredSkill: 'leatherworking',
		requiredSkillLevel: 5,
		ingredients: [
			{ id: 'leather', quantity: 4 },
			{ id: 'leather_strips', quantity: 2 }
		],
		craftTime: 90,
		xpReward: 18
	}
];
