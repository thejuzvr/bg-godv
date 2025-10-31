<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { authStore } from '$stores/auth';
	import { IconUser, IconSparkles, IconBook, IconHeart } from '@tabler/icons-svelte';

	interface Race {
		id: string;
		name: string;
		description: string;
		bonuses: string;
	}

	interface Deity {
		id: string;
		name: string;
		description: string;
		domain: string;
	}

	const races: Race[] = [
		{
			id: 'nord',
			name: 'Норд',
			description: 'Суровые воины севера',
			bonuses: '+10 Сила, +10 Выносливость'
		},
		{
			id: 'imperial',
			name: 'Имперец',
			description: 'Умелые дипломаты и торговцы',
			bonuses: '+10 Убеждение, +10 Интеллект'
		},
		{
			id: 'dark_elf',
			name: 'Темный Эльф',
			description: 'Искусные маги и воины',
			bonuses: '+10 Магия, +5 Ловкость'
		},
		{
			id: 'high_elf',
			name: 'Высший Эльф',
			description: 'Величайшие маги Тамриэля',
			bonuses: '+15 Интеллект, +10 Магия'
		},
		{
			id: 'wood_elf',
			name: 'Лесной Эльф',
			description: 'Непревзойденные лучники',
			bonuses: '+10 Ловкость, +10 Легкая броня'
		},
		{
			id: 'khajiit',
			name: 'Каджит',
			description: 'Ловкие торговцы и воры',
			bonuses: '+10 Ловкость, +10 Убеждение'
		},
		{
			id: 'argonian',
			name: 'Аргонианин',
			description: 'Стойкие рептилии Черного Болота',
			bonuses: '+10 Выносливость, +10 Алхимия'
		},
		{
			id: 'orc',
			name: 'Орк',
			description: 'Непобедимые берсерки',
			bonuses: '+15 Сила, +10 Тяжелая броня'
		}
	];

	const deities: Deity[] = [
		{
			id: 'talos',
			name: 'Талос',
			description: 'Бог войны и управления',
			domain: 'Война, Власть'
		},
		{
			id: 'kynareth',
			name: 'Кинарет',
			description: 'Богиня воздуха и природы',
			domain: 'Природа, Путешествия'
		},
		{
			id: 'arkay',
			name: 'Аркей',
			description: 'Бог жизни и смерти',
			domain: 'Жизнь, Смерть'
		},
		{
			id: 'dibella',
			name: 'Дибелла',
			description: 'Богиня красоты и любви',
			domain: 'Красота, Убеждение'
		},
		{
			id: 'julianos',
			name: 'Джулианос',
			description: 'Бог мудрости и логики',
			domain: 'Знания, Магия'
		},
		{
			id: 'mara',
			name: 'Мара',
			description: 'Богиня любви и сострадания',
			domain: 'Исцеление, Милосердие'
		}
	];

	// Form state
	let name = $state('');
	let gender = $state<'male' | 'female'>('male');
	let selectedRace = $state('nord');
	let backstory = $state('');
	let selectedDeity = $state('talos');
	
	// Attributes (total 100 points)
	let attributes = $state({
		strength: 25,
		agility: 25,
		intelligence: 25,
		endurance: 25
	});
	
	let error = $state('');
	let loading = $state(false);
	let step = $state(1);

	const totalAttributePoints = $derived(
		attributes.strength + attributes.agility + attributes.intelligence + attributes.endurance
	);
	const maxAttributePoints = 100;
	const remainingPoints = $derived(maxAttributePoints - totalAttributePoints);

	function incrementAttribute(attr: keyof typeof attributes) {
		if (remainingPoints > 0) {
			attributes[attr]++;
		}
	}

	function decrementAttribute(attr: keyof typeof attributes) {
		if (attributes[attr] > 10) {
			attributes[attr]--;
		}
	}

	async function handleSubmit() {
		error = '';

		// Validation
		if (!name.trim()) {
			error = 'Введите имя персонажа';
			return;
		}

		if (name.length < 3 || name.length > 20) {
			error = 'Имя должно быть от 3 до 20 символов';
			return;
		}

		if (!backstory.trim()) {
			error = 'Напишите предысторию персонажа';
			return;
		}

		if (backstory.length < 20) {
			error = 'Предыстория должна быть минимум 20 символов';
			return;
		}

		if (remainingPoints !== 0) {
			error = `Распределите все очки характеристик (осталось: ${remainingPoints})`;
			return;
		}

		loading = true;

		try {
			// Create character
			const response = await fetch('http://localhost:5000/api/characters/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					name: name.trim(),
					gender,
					race: selectedRace,
					backstory: backstory.trim(),
					patronDeity: selectedDeity,
					attributes
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to create character');
			}

			// Redirect to dashboard
			goto('/dashboard');
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function nextStep() {
		if (step === 1 && !name.trim()) {
			error = 'Введите имя персонажа';
			return;
		}
		if (step === 2 && !backstory.trim()) {
			error = 'Напишите предысторию';
			return;
		}
		error = '';
		step++;
	}

	function prevStep() {
		error = '';
		step--;
	}
</script>

<div class="min-h-screen bg-base-200 py-8">
	<div class="container mx-auto px-4 max-w-4xl">
		<!-- Progress -->
		<ul class="steps steps-horizontal w-full mb-8">
			<li class="step" class:step-primary={step >= 1}>Основное</li>
			<li class="step" class:step-primary={step >= 2}>Предыстория</li>
			<li class="step" class:step-primary={step >= 3}>Характеристики</li>
			<li class="step" class:step-primary={step >= 4}>Покровитель</li>
		</ul>

		<div class="skyrim-card p-8">
			<h1 class="text-4xl font-bold text-skyrim-gold mb-2 text-center">
				Создание персонажа
			</h1>
			<p class="text-center text-base-content/70 mb-8">
				Ваше приключение в мире The Elder Scrolls начинается здесь
			</p>

			{#if error}
				<div class="alert alert-error mb-6">
					<span>{error}</span>
				</div>
			{/if}

			<form onsubmit={handleSubmit}>
				<!-- Step 1: Basic Info -->
				{#if step === 1}
					<div class="space-y-6">
						<div class="form-control">
							<label class="label" for="name">
								<span class="label-text flex items-center gap-2">
									<IconUser size={20} />
									Имя персонажа
								</span>
							</label>
							<input
								type="text"
								id="name"
								placeholder="Введите имя"
								class="input input-bordered w-full"
								bind:value={name}
								maxlength="20"
							/>
							<label class="label">
								<span class="label-text-alt">3-20 символов</span>
							</label>
						</div>

						<div class="form-control">
							<label class="label">
								<span class="label-text">Пол</span>
							</label>
							<div class="flex gap-4">
								<label class="label cursor-pointer gap-2">
									<input
										type="radio"
										name="gender"
										class="radio radio-primary"
										value="male"
										bind:group={gender}
									/>
									<span class="label-text">Мужской</span>
								</label>
								<label class="label cursor-pointer gap-2">
									<input
										type="radio"
										name="gender"
										class="radio radio-primary"
										value="female"
										bind:group={gender}
									/>
									<span class="label-text">Женский</span>
								</label>
							</div>
						</div>

						<div class="form-control">
							<label class="label">
								<span class="label-text">Раса</span>
							</label>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
								{#each races as race}
									<label
										class="label cursor-pointer justify-start gap-3 p-4 border rounded-lg"
										class:border-primary={selectedRace === race.id}
										class:bg-base-300={selectedRace === race.id}
									>
										<input
											type="radio"
											name="race"
											class="radio radio-primary"
											value={race.id}
											bind:group={selectedRace}
										/>
										<div>
											<div class="font-bold">{race.name}</div>
											<div class="text-sm opacity-70">{race.description}</div>
											<div class="text-xs text-primary mt-1">{race.bonuses}</div>
										</div>
									</label>
								{/each}
							</div>
						</div>

						<button type="button" class="skyrim-btn w-full" onclick={nextStep}>
							Далее
						</button>
					</div>
				{/if}

				<!-- Step 2: Backstory -->
				{#if step === 2}
					<div class="space-y-6">
						<div class="form-control">
							<label class="label" for="backstory">
								<span class="label-text flex items-center gap-2">
									<IconBook size={20} />
									Предыстория
								</span>
							</label>
							<textarea
								id="backstory"
								class="textarea textarea-bordered h-32"
								placeholder="Расскажите историю вашего персонажа..."
								bind:value={backstory}
							></textarea>
							<label class="label">
								<span class="label-text-alt">{backstory.length} символов (минимум 20)</span>
							</label>
						</div>

						<div class="flex gap-4">
							<button type="button" class="btn btn-outline flex-1" onclick={prevStep}>
								Назад
							</button>
							<button type="button" class="skyrim-btn flex-1" onclick={nextStep}>
								Далее
							</button>
						</div>
					</div>
				{/if}

				<!-- Step 3: Attributes -->
				{#if step === 3}
					<div class="space-y-6">
						<div class="text-center mb-6">
							<p class="text-lg">
								Распределите очки характеристик
							</p>
							<p class="text-3xl font-bold text-skyrim-gold mt-2">
								{remainingPoints} / {maxAttributePoints}
							</p>
							<p class="text-sm opacity-70">очков осталось</p>
						</div>

						<div class="space-y-4">
							{#each Object.entries(attributes) as [key, value]}
								{@const attrKey = key as keyof typeof attributes}
								<div class="flex items-center gap-4">
									<div class="flex-1">
										<div class="font-bold capitalize">{key}</div>
									</div>
									<button
										type="button"
										class="btn btn-sm btn-circle"
										onclick={() => decrementAttribute(attrKey)}
										disabled={value <= 10}
									>
										-
									</button>
									<span class="text-2xl font-bold w-16 text-center">{value}</span>
									<button
										type="button"
										class="btn btn-sm btn-circle"
										onclick={() => incrementAttribute(attrKey)}
										disabled={remainingPoints <= 0}
									>
										+
									</button>
								</div>
								<progress
									class="progress progress-primary w-full"
									value={value}
									max="50"
								></progress>
							{/each}
						</div>

						<div class="flex gap-4">
							<button type="button" class="btn btn-outline flex-1" onclick={prevStep}>
								Назад
							</button>
							<button
								type="button"
								class="skyrim-btn flex-1"
								onclick={nextStep}
								disabled={remainingPoints !== 0}
							>
								Далее
							</button>
						</div>
					</div>
				{/if}

				<!-- Step 4: Deity -->
				{#if step === 4}
					<div class="space-y-6">
						<div class="form-control">
							<label class="label">
								<span class="label-text flex items-center gap-2">
									<IconSparkles size={20} />
									Божество-покровитель
								</span>
							</label>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
								{#each deities as deity}
									<label
										class="label cursor-pointer justify-start gap-3 p-4 border rounded-lg"
										class:border-primary={selectedDeity === deity.id}
										class:bg-base-300={selectedDeity === deity.id}
									>
										<input
											type="radio"
											name="deity"
											class="radio radio-primary"
											value={deity.id}
											bind:group={selectedDeity}
										/>
										<div>
											<div class="font-bold">{deity.name}</div>
											<div class="text-sm opacity-70">{deity.description}</div>
											<div class="text-xs text-primary mt-1">{deity.domain}</div>
										</div>
									</label>
								{/each}
							</div>
						</div>

						<div class="divider">Готово к приключениям?</div>

						<div class="flex gap-4">
							<button type="button" class="btn btn-outline flex-1" onclick={prevStep}>
								Назад
							</button>
							<button type="submit" class="skyrim-btn flex-1" disabled={loading}>
								{#if loading}
									<span class="loading loading-spinner"></span>
								{/if}
								Создать персонажа
							</button>
						</div>
					</div>
				{/if}
			</form>
		</div>
	</div>
</div>
