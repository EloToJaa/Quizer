<script lang="ts">
	import { resolve } from '$app/paths';
	let { compact = false }: { compact?: boolean } = $props();
</script>

<a class:compact href={resolve('/')} aria-label="Quizer home">
	<span aria-hidden="true">Q</span>
	<strong>Quizer</strong>
</a>

<style>
	a {
		display: inline-flex;
		align-items: center;
		gap: 0.7rem;
		color: var(--ink);
		text-decoration: none;
		font-family: var(--font-display);
		font-size: 1.25rem;
	}
	span {
		display: grid;
		place-items: center;
		width: 2.25rem;
		aspect-ratio: 1;
		border: 2px solid var(--ink);
		border-radius: 0.7rem 0.7rem 0.2rem 0.7rem;
		background: var(--lemon);
		box-shadow: 3px 3px 0 var(--ink);
		font-size: 1.15rem;
	}
	.compact strong {
		display: none;
	}
</style>
