<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { authStore } from '$stores/auth';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleRegister() {
		error = '';

		if (password !== confirmPassword) {
			error = 'Пароли не совпадают';
			return;
		}

		if (password.length < 6) {
			error = 'Пароль должен быть минимум 6 символов';
			return;
		}

		loading = true;

		try {
			const response = await fetch('http://localhost:5000/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ email, password })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Registration failed');
			}

			authStore.setUser(data.user);
			goto('/create-character');
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="hero min-h-screen bg-base-200">
	<div class="hero-content flex-col lg:flex-row-reverse">
		<div class="text-center lg:text-left">
			<h1 class="text-5xl font-bold text-skyrim-gold">{$_('auth.register')}</h1>
			<p class="py-6">
				Создайте аккаунт и начните свои приключения в мире The Elder Scrolls
			</p>
		</div>
		<div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
			<form class="card-body" onsubmit={handleRegister}>
				<div class="form-control">
					<label class="label" for="email">
						<span class="label-text">{$_('auth.email')}</span>
					</label>
					<input
						type="email"
						id="email"
						placeholder="email@example.com"
						class="input input-bordered"
						required
						bind:value={email}
					/>
				</div>
				<div class="form-control">
					<label class="label" for="password">
						<span class="label-text">{$_('auth.password')}</span>
					</label>
					<input
						type="password"
						id="password"
						placeholder="••••••••"
						class="input input-bordered"
						required
						bind:value={password}
					/>
				</div>
				<div class="form-control">
					<label class="label" for="confirmPassword">
						<span class="label-text">{$_('auth.confirmPassword')}</span>
					</label>
					<input
						type="password"
						id="confirmPassword"
						placeholder="••••••••"
						class="input input-bordered"
						required
						bind:value={confirmPassword}
					/>
				</div>

				{#if error}
					<div class="alert alert-error">
						<span>{error}</span>
					</div>
				{/if}

				<div class="form-control mt-6">
					<button type="submit" class="skyrim-btn" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner"></span>
						{/if}
						{$_('auth.register')}
					</button>
				</div>

				<div class="divider">или</div>

				<div class="text-center">
					<p class="text-sm">
						Уже есть аккаунт?
						<a href="/login" class="link link-primary">Войти</a>
					</p>
				</div>
			</form>
		</div>
	</div>
</div>
