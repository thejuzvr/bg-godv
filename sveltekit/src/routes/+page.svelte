<script lang="ts">
	import { _ } from 'svelte-i18n';
</script>

<div class="hero min-h-screen bg-base-200">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="text-5xl font-bold text-skyrim-gold">Elder Scrolls Game</h1>
			<p class="py-6">
				Добро пожаловать в игру в духе Godville, вдохновленную миром The Elder Scrolls
			</p>
			<div class="flex gap-4 justify-center">
				<a href="/login" class="skyrim-btn">
					{$_('auth.login')}
				</a>
				<a href="/register" class="btn btn-outline">
					{$_('auth.register')}
				</a>
			</div>
		</div>
	</div>
</div>
