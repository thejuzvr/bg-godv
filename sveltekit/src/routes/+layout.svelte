<script lang="ts">
	import '../app.css';
	import '../lib/i18n';
	import { onMount } from 'svelte';
	import { authStore } from '$stores/auth';

	let { children } = $props();

	onMount(() => {
		// Check authentication status on mount
		// This will be handled by +layout.server.ts
	});
</script>

<div class="min-h-screen bg-base-100">
	{@render children()}
</div>
