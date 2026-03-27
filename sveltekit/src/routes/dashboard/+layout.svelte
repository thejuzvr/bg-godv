<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { realtime, isConnected, connectionError } from '$lib/realtime';
	import { character, healthPercent, magickaPercent, staminaPercent } from '$stores/character';
	import { authStore } from '$stores/auth';
	import { _ } from 'svelte-i18n';
	import {
		IconHome,
		IconUser,
		IconBackpack,
		IconScroll,
		IconMap,
		IconShoppingCart,
		IconHammer,
		IconShield,
		IconUsers,
		IconLogout,
		IconMenu2,
		IconX
	} from '@tabler/icons-svelte';

	let { data, children } = $props();

	let mobileMenuOpen = $state(false);

	$effect(() => {
		// Set character from server data
		if (data.character) {
			character.set(data.character);
			authStore.setUser(data.user);

			// Connect to realtime
			realtime.connect('global', data.character.id);
		}
	});

	onDestroy(() => {
		realtime.disconnect();
	});

	async function handleLogout() {
		await fetch('http://localhost:5000/api/auth/logout', {
			method: 'POST',
			credentials: 'include'
		});
		authStore.logout();
		goto('/login');
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	const navItems = [
		{ href: '/dashboard', icon: IconHome, label: 'Главная' },
		{ href: '/dashboard/character', icon: IconUser, label: 'Персонаж' },
		{ href: '/dashboard/inventory', icon: IconBackpack, label: 'Инвентарь' },
		{ href: '/dashboard/quests', icon: IconScroll, label: 'Квесты' },
		{ href: '/dashboard/map', icon: IconMap, label: 'Карта' },
		{ href: '/dashboard/market', icon: IconShoppingCart, label: 'Рынок' },
		{ href: '/dashboard/crafting', icon: IconHammer, label: 'Крафт' },
		{ href: '/dashboard/factions', icon: IconShield, label: 'Фракции' },
		{ href: '/dashboard/society', icon: IconUsers, label: 'Общество' }
	];
</script>

<div class="drawer lg:drawer-open">
	<input
		id="mobile-menu"
		type="checkbox"
		class="drawer-toggle"
		bind:checked={mobileMenuOpen}
	/>

	<!-- Main content -->
	<div class="drawer-content flex flex-col min-h-screen">
		<!-- Top navbar (mobile) -->
		<div class="navbar bg-base-300 shadow-lg lg:hidden sticky top-0 z-40">
			<div class="flex-none">
				<label for="mobile-menu" class="btn btn-square btn-ghost">
					{#if mobileMenuOpen}
						<IconX size={24} />
					{:else}
						<IconMenu2 size={24} />
					{/if}
				</label>
			</div>
			<div class="flex-1">
				<a href="/dashboard" class="btn btn-ghost text-xl text-skyrim-gold">
					{$character?.name || 'Elder Scrolls Game'}
				</a>
			</div>
			<div class="flex-none">
				{#if $isConnected}
					<div class="badge badge-success badge-sm gap-1">
						<div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
					</div>
				{:else}
					<div class="badge badge-error badge-sm gap-1">
						<div class="w-2 h-2 rounded-full bg-red-400"></div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Desktop header -->
		<div class="hidden lg:block bg-base-300 shadow-lg sticky top-0 z-40">
			<div class="navbar">
				<div class="flex-1">
					<a href="/dashboard" class="btn btn-ghost text-xl text-skyrim-gold">
						{$character?.name || 'Elder Scrolls Game'}
					</a>
					<div class="ml-4">
						<span class="skyrim-badge">Уровень {$character?.level || 1}</span>
					</div>
				</div>
				<div class="flex-none gap-2">
					<!-- Connection status -->
					{#if $isConnected}
						<div class="badge badge-success gap-2">
							<div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
							Online
						</div>
					{:else if $connectionError}
						<div class="badge badge-error gap-2" title={$connectionError}>
							<div class="w-2 h-2 rounded-full bg-red-400"></div>
							Offline
						</div>
					{:else}
						<div class="badge badge-warning gap-2">
							<div class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
							Connecting...
						</div>
					{/if}

					<!-- Quick stats -->
					{#if $character}
						<div class="hidden xl:flex gap-3">
							<div class="tooltip" data-tip="Здоровье">
								<progress
									class="progress progress-error w-24 h-3"
									value={$healthPercent}
									max="100"
								></progress>
							</div>
							<div class="tooltip" data-tip="Магия">
								<progress
									class="progress progress-info w-24 h-3"
									value={$magickaPercent}
									max="100"
								></progress>
							</div>
							<div class="tooltip" data-tip="Выносливость">
								<progress
									class="progress progress-success w-24 h-3"
									value={$staminaPercent}
									max="100"
								></progress>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Page content -->
		<div class="flex-1 p-4 lg:p-6">
			{@render children()}
		</div>
	</div>

	<!-- Sidebar -->
	<div class="drawer-side z-50">
		<label for="mobile-menu" class="drawer-overlay" onclick={closeMobileMenu}></label>
		<aside class="bg-base-200 min-h-full w-80">
			<div class="p-4">
				<!-- Character info -->
				{#if $character}
					<div class="skyrim-card p-4 mb-4">
						<div class="flex items-center gap-3 mb-3">
							<div class="avatar placeholder">
								<div class="bg-skyrim-blue text-white rounded-full w-12">
									<span class="text-xl">{$character.name[0]}</span>
								</div>
							</div>
							<div class="flex-1">
								<div class="font-bold text-lg">{$character.name}</div>
								<div class="text-sm opacity-70">{$character.race} • {$character.gender === 'male' ? 'М' : 'Ж'}</div>
							</div>
						</div>

						<!-- Stats -->
						<div class="space-y-2">
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span>HP</span>
									<span
										>{$character.stats.health.current}/{$character.stats.health.max}</span
									>
								</div>
								<progress
									class="progress progress-error w-full"
									value={$healthPercent}
									max="100"
								></progress>
							</div>
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span>MP</span>
									<span
										>{$character.stats.magicka.current}/{$character.stats.magicka.max}</span
									>
								</div>
								<progress
									class="progress progress-info w-full"
									value={$magickaPercent}
									max="100"
								></progress>
							</div>
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span>SP</span>
									<span
										>{$character.stats.stamina.current}/{$character.stats.stamina.max}</span
									>
								</div>
								<progress
									class="progress progress-success w-full"
									value={$staminaPercent}
									max="100"
								></progress>
							</div>
						</div>
					</div>
				{/if}

				<!-- Navigation -->
				<ul class="menu menu-lg">
					{#each navItems as item}
						<li>
							<a href={item.href} onclick={closeMobileMenu}>
								<svelte:component this={item.icon} size={20} />
								{item.label}
							</a>
						</li>
					{/each}
					<li class="mt-4">
						<button onclick={handleLogout} class="text-error">
							<IconLogout size={20} />
							Выход
						</button>
					</li>
				</ul>
			</div>
		</aside>
	</div>
</div>
