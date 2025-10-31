<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { character } from '$stores/character';
	import { api } from '$lib/api';
	import { allLocations } from '$data/data/locations';
	import {
		IconMap,
		IconMapPin,
		IconLock,
		IconCheck,
		IconCloud,
		IconSun,
		IconCloudRain,
		IconSnowflake,
		IconWind,
		IconMaximize,
		IconMinimize,
		IconSparkles
	} from '@tabler/icons-svelte';

	let mapContainer: HTMLDivElement;
	let map: any = null;
	let selectedLocation = $state<any>(null);
	let loading = $state(false);
	let message = $state('');
	let isFullscreen = $state(false);

	// Weather icon mapping
	function getWeatherIcon(weather: string) {
		switch (weather?.toLowerCase()) {
			case 'clear':
				return IconSun;
			case 'cloudy':
				return IconCloud;
			case 'rain':
				return IconCloudRain;
			case 'snow':
				return IconSnowflake;
			case 'fog':
				return IconWind;
			default:
				return IconCloud;
		}
	}

	onMount(async () => {
		// Dynamically import Leaflet (client-side only)
		const L = (await import('leaflet')).default;

		// Import Leaflet CSS
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
		document.head.appendChild(link);

		// Initialize map
		map = L.map(mapContainer, {
			center: [50, 50],
			zoom: 3,
			minZoom: 2,
			maxZoom: 5,
			zoomControl: true,
			attributionControl: false
		});

		// Simple tile layer (можно заменить на custom Tamriel tiles)
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 5
		}).addTo(map);

		// Add location markers
		allLocations.forEach((location) => {
			const isDiscovered = $character?.visitedLocations?.includes(location.id) || false;
			const isCurrent = $character?.location === location.id;

			const icon = L.divIcon({
				className: 'custom-marker',
				html: `
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
							isCurrent
								? 'bg-primary border-2 border-white'
								: isDiscovered
									? 'bg-success'
									: 'bg-base-300'
						}">
              ${
								isCurrent
									? '★'
									: isDiscovered
										? '●'
										: location.isStartingLocation
											? '○'
											: '?'
							}
            </div>
            ${
							isDiscovered || location.isStartingLocation
								? `<div class="text-xs font-bold mt-1 bg-base-100 px-2 py-1 rounded shadow">${location.name}</div>`
								: ''
						}
          </div>
        `,
				iconSize: [100, 50],
				iconAnchor: [50, 25]
			});

			const marker = L.marker([location.coordY, location.coordX], { icon }).addTo(map);

			marker.on('click', () => {
				selectedLocation = { ...location, isDiscovered, isCurrent };
			});
		});
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});

	async function fastTravel(locationId: string) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			const data = await api.travel($character.id, locationId);
			character.set(data.character);
			message = `Путешествие в ${selectedLocation.name} началось`;
			selectedLocation = null;
			setTimeout(() => (message = ''), 3000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	async function suggestTravel(locationId: string) {
		if (!$character) return;

		loading = true;
		message = '';

		try {
			await api.suggestTravel($character.id, locationId);
			message = 'Направление отправлено герою';
			setTimeout(() => (message = ''), 2000);
		} catch (error: any) {
			message = error.message;
		} finally {
			loading = false;
		}
	}

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
	}

	const WeatherIcon = $derived(getWeatherIcon($character?.weather || 'Clear'));
</script>

<svelte:head>
	<style>
		.custom-marker {
			background: transparent;
			border: none;
		}
	</style>
</svelte:head>

<div class="space-y-4" class:fixed={isFullscreen} class:inset-0={isFullscreen} class:z-50={isFullscreen} class:bg-base-100={isFullscreen}>
	<!-- Header -->
	{#if !isFullscreen}
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-4xl font-bold text-skyrim-gold flex items-center gap-3">
					<IconMap size={32} />
					Карта мира
				</h1>
				{#if $character}
					<p class="text-base-content/70 mt-1">
						Текущая локация: <strong>{$character.location}</strong>
					</p>
				{/if}
			</div>
			{#if message}
				<div class="alert alert-success">
					<span>{message}</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Map container -->
	<div class="relative" class:h-[calc(100vh-2rem)]={isFullscreen} class:h-[600px]={!isFullscreen}>
		<div bind:this={mapContainer} class="w-full h-full rounded-lg overflow-hidden shadow-xl"></div>

		<!-- Weather HUD -->
		{#if $character}
			<div class="absolute top-4 left-4 skyrim-card p-4 shadow-xl z-[1000]">
				<div class="flex items-center gap-3">
					<svelte:component this={WeatherIcon} size={32} class="text-skyrim-gold" />
					<div>
						<div class="font-bold">{$character.weather || 'Clear'}</div>
						<div class="text-xs opacity-70">{$character.season || 'Summer'}</div>
						<div class="text-xs opacity-70 capitalize">
							{$character.timeOfDay || 'day'}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Fullscreen toggle -->
		<button
			class="btn btn-sm btn-circle absolute top-4 right-4 z-[1000]"
			onclick={toggleFullscreen}
		>
			{#if isFullscreen}
				<IconMinimize size={18} />
			{:else}
				<IconMaximize size={18} />
			{/if}
		</button>

		<!-- Location info panel -->
		{#if selectedLocation}
			<div class="absolute bottom-4 right-4 skyrim-card p-6 shadow-xl z-[1000] w-80">
				<button
					class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
					onclick={() => (selectedLocation = null)}
				>
					<IconMap size={16} />
				</button>

				<div class="space-y-4">
					<div>
						<h3 class="font-bold text-xl mb-1">{selectedLocation.name}</h3>
						<div class="flex gap-2 mb-2">
							<span class="badge badge-sm capitalize">{selectedLocation.type}</span>
							{#if selectedLocation.isCurrent}
								<span class="badge badge-primary badge-sm">Вы здесь</span>
							{/if}
							{#if selectedLocation.isDiscovered}
								<span class="badge badge-success badge-sm">
									<IconCheck size={12} />
									Открыто
								</span>
							{:else}
								<span class="badge badge-error badge-sm">
									<IconLock size={12} />
									Не открыто
								</span>
							{/if}
						</div>
					</div>

					{#if selectedLocation.dangerLevel !== undefined && selectedLocation.dangerLevel > 0}
						<div>
							<div class="text-sm mb-1">Уровень опасности</div>
							<progress
								class="progress progress-error w-full"
								value={selectedLocation.dangerLevel}
								max="100"
							></progress>
							<div class="text-xs text-right">{selectedLocation.dangerLevel}/100</div>
						</div>
					{/if}

					{#if selectedLocation.travelDistance}
						<div class="flex items-center gap-2 text-sm">
							<IconMapPin size={16} />
							<span>Расстояние: ~{selectedLocation.travelDistance} единиц</span>
						</div>
					{/if}

					<div class="flex gap-2">
						{#if selectedLocation.isDiscovered && !selectedLocation.isCurrent}
							<button
								class="btn btn-primary btn-sm flex-1"
								onclick={() => fastTravel(selectedLocation.id)}
								disabled={loading}
							>
								{#if loading}
									<span class="loading loading-spinner loading-xs"></span>
								{/if}
								Быстрое перемещение
							</button>
						{:else if !selectedLocation.isCurrent}
							<button
								class="btn btn-outline btn-sm flex-1"
								onclick={() => suggestTravel(selectedLocation.id)}
								disabled={loading}
							>
								<IconSparkles size={16} />
								Направить героя
							</button>
						{/if}
					</div>

					{#if !selectedLocation.isDiscovered && !selectedLocation.isStartingLocation}
						<div class="alert alert-warning">
							<IconLock size={16} />
							<span class="text-xs"
								>Локация не открыта. Герой должен дойти сюда пешком.</span
							>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Legend -->
		<div class="absolute bottom-4 left-4 skyrim-card p-4 shadow-xl z-[1000]">
			<div class="font-bold mb-2 text-sm">Легенда</div>
			<div class="space-y-2 text-xs">
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded-full bg-primary border-2 border-white">★</div>
					<span>Текущая локация</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded-full bg-success">●</div>
					<span>Открытые локации</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 rounded-full bg-base-300">?</div>
					<span>Неоткрытые</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Discovered locations list (не в fullscreen) -->
	{#if !isFullscreen && $character}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
			{#each allLocations.filter((l) => $character?.visitedLocations?.includes(l.id) || l.isStartingLocation) as location}
				{@const isCurrent = $character.location === location.id}
				<div
					class="skyrim-card p-4 cursor-pointer hover:bg-base-300 transition-all"
					class:border-primary={isCurrent}
					class:border-2={isCurrent}
					onclick={() => {
						selectedLocation = {
							...location,
							isDiscovered: true,
							isCurrent
						};
					}}
				>
					<div class="flex items-start gap-3">
						<div class="flex-shrink-0">
							<div
								class="w-10 h-10 rounded-full flex items-center justify-center"
								class:bg-primary={isCurrent}
								class:bg-success={!isCurrent}
							>
								{#if isCurrent}
									<IconMapPin size={20} class="text-white" />
								{:else}
									<IconCheck size={20} class="text-white" />
								{/if}
							</div>
						</div>
						<div class="flex-1">
							<h3 class="font-bold">{location.name}</h3>
							<div class="text-xs opacity-70 capitalize">{location.type}</div>
							{#if isCurrent}
								<span class="badge badge-primary badge-xs mt-1">Вы здесь</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	:global(.leaflet-container) {
		background: #1a1a1a;
		font-family: inherit;
	}

	:global(.custom-marker) {
		background: transparent !important;
		border: none !important;
		text-align: center;
		color: white;
		font-size: 20px;
		font-weight: bold;
	}
</style>
