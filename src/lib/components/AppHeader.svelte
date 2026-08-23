<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import BrandMark from './BrandMark.svelte';
	let {
		user,
		quiet = false
	}: { user?: { name?: string | null; email?: string | null }; quiet?: boolean } = $props();
	const registerHref = resolve('/login?mode=register' as Pathname);
</script>

<header>
	<BrandMark />
	{#if !quiet}
		<nav aria-label="Main navigation">
			{#if user}
				<a href={resolve('/dashboard')}>My quizzes</a>
				<form method="post" action="/dashboard?/signOut">
					<button class="link" type="submit">Sign out</button>
				</form>
			{:else}
				<a href={resolve('/login')}>Sign in</a>
				<a class="button small" href={registerHref}>Start creating</a>
			{/if}
		</nav>
	{/if}
</header>

<style>
	header {
		width: min(1180px, calc(100% - 2rem));
		min-height: 5.5rem;
		margin: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	nav {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	nav a,
	.link {
		color: var(--ink);
		text-decoration: none;
		font-weight: 750;
		font-size: 0.9rem;
	}
	form {
		margin: 0;
	}
	@media (max-width: 520px) {
		header {
			min-height: 4.75rem;
		}
		nav {
			gap: 0.55rem;
		}
		nav a,
		.link {
			font-size: 0.78rem;
		}
		.button.small {
			padding-inline: 0.65rem;
		}
	}
</style>
