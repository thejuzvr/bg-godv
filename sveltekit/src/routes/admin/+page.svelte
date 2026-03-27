<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import {
		IconShield,
		IconUsers,
		IconDatabase,
		IconSettings,
		IconChartBar,
		IconRefresh
	} from '@tabler/icons-svelte';

	let stats = $state<any>(null);
	let loading = $state(false);

	onMount(async () => {
		await loadStats();
	});

	async function loadStats() {
		loading = true;
		try {
			// Mock stats - replace with actual API
			stats = {
				totalUsers: 42,
				totalCharacters: 38,
				activeCharacters: 15,
				totalQuests: 127,
				completedQuests: 234
			};
		} catch (error) {
			console.error('Failed to load admin stats:', error);
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
				Панель администратора
			</h1>
			<p class="text-base-content/70 mt-1">Управление игровым миром</p>
		</div>
		<button class="btn btn-primary" onclick={loadStats} disabled={loading}>
			<IconRefresh size={18} />
			Обновить
		</button>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if stats}
		<!-- Stats Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="skyrim-card p-6">
				<div class="flex items-center gap-3 mb-2">
					<IconUsers size={24} class="text-info" />
					<h3 class="font-bold">Пользователи</h3>
				</div>
				<div class="text-3xl font-bold text-skyrim-gold">{stats.totalUsers}</div>
				<div class="text-xs opacity-70">Всего зарегистрировано</div>
			</div>

			<div class="skyrim-card p-6">
				<div class="flex items-center gap-3 mb-2">
					<IconDatabase size={24} class="text-success" />
					<h3 class="font-bold">Персонажи</h3>
				</div>
				<div class="text-3xl font-bold text-skyrim-gold">{stats.totalCharacters}</div>
				<div class="text-xs opacity-70">{stats.activeCharacters} активных</div>
			</div>

			<div class="skyrim-card p-6">
				<div class="flex items-center gap-3 mb-2">
					<IconChartBar size={24} class="text-warning" />
					<h3 class="font-bold">Квесты</h3>
				</div>
				<div class="text-3xl font-bold text-skyrim-gold">{stats.totalQuests}</div>
				<div class="text-xs opacity-70">{stats.completedQuests} завершено</div>
			</div>

			<div class="skyrim-card p-6">
				<div class="flex items-center gap-3 mb-2">
					<IconSettings size={24} class="text-error" />
					<h3 class="font-bold">Система</h3>
				</div>
				<div class="text-sm font-bold text-success">Работает</div>
				<div class="text-xs opacity-70">Все сервисы онлайн</div>
			</div>
		</div>

		<!-- Admin Sections -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- User Management -->
			<div class="skyrim-card p-6">
				<h2 class="text-2xl font-bold text-skyrim-gold mb-4 flex items-center gap-2">
					<IconUsers size={24} />
					Управление пользователями
				</h2>
				<div class="space-y-2">
					<button class="btn btn-outline btn-sm w-full">Просмотр всех пользователей</button>
					<button class="btn btn-outline btn-sm w-full">Поиск пользователя</button>
					<button class="btn btn-outline btn-sm w-full">Бан/Разбан</button>
				</div>
			</div>

			<!-- Character Management -->
			<div class="skyrim-card p-6">
				<h2 class="text-2xl font-bold text-skyrim-gold mb-4 flex items-center gap-2">
					<IconDatabase size={24} />
					Управление персонажами
				</h2>
				<div class="space-y-2">
					<button class="btn btn-outline btn-sm w-full">Просмотр всех персонажей</button>
					<button class="btn btn-outline btn-sm w-full">Поиск персонажа</button>
					<button class="btn btn-outline btn-sm w-full">Редактировать персонажа</button>
				</div>
			</div>

			<!-- Game Management -->
			<div class="skyrim-card p-6">
				<h2 class="text-2xl font-bold text-skyrim-gold mb-4 flex items-center gap-2">
					<IconSettings size={24} />
					Управление игрой
				</h2>
				<div class="space-y-2">
					<button class="btn btn-outline btn-sm w-full">Управление квестами</button>
					<button class="btn btn-outline btn-sm w-full">Управление предметами</button>
					<button class="btn btn-outline btn-sm w-full">Управление локациями</button>
				</div>
			</div>

			<!-- Analytics -->
			<div class="skyrim-card p-6">
				<h2 class="text-2xl font-bold text-skyrim-gold mb-4 flex items-center gap-2">
					<IconChartBar size={24} />
					Аналитика
				</h2>
				<div class="space-y-2">
					<button class="btn btn-outline btn-sm w-full">Статистика игроков</button>
					<button class="btn btn-outline btn-sm w-full">Экономика</button>
					<button class="btn btn-outline btn-sm w-full">Логи системы</button>
				</div>
			</div>
		</div>
	{/if}
</div>
