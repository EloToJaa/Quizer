<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const registerHref = resolve('/login?mode=register' as Pathname);
</script>

<svelte:head
	><title>Quizer — make questions worth answering</title><meta
		name="description"
		content="Create image-rich quizzes, publish them, and share one simple link."
	/></svelte:head
>
<AppHeader user={data.user ?? undefined} />
<main class="shell">
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">The curious person’s quiz maker</p>
			<h1>Make questions <em>worth answering.</em></h1>
			<p class="lede">
				Build sharp, image-rich quizzes without wrestling a form builder. Draft, publish, and share
				one memorable link.
			</p>
			<div class="actions">
				<a class="button coral" href={data.user ? resolve('/dashboard/new') : registerHref}
					>{data.user ? 'Create a quiz' : 'Make your first quiz'}</a
				>
				<a class="text-link" href={data.user ? resolve('/dashboard') : resolve('/login')}
					>{data.user ? 'Open dashboard' : 'I already have an account'} →</a
				>
			</div>
		</div>
		<div class="quiz-preview" aria-label="Example quiz question">
			<div class="preview-top"><span class="eyebrow">Question 04 / 08</span><span>60%</span></div>
			<h2>Which planet has the shortest day?</h2>
			<div class="answers">
				<div><b>A</b> Saturn</div>
				<div class="chosen"><b>B</b> Jupiter <span>✓</span></div>
				<div><b>C</b> Mars</div>
			</div>
		</div>
	</section>
	<section class="strip" aria-label="Product features">
		<article>
			<span>01</span>
			<div>
				<h3>Shape the story</h3>
				<p>Add as many questions and answers as your idea needs.</p>
			</div>
		</article>
		<article>
			<span>02</span>
			<div>
				<h3>Give it a face</h3>
				<p>Use cover and answer images when words are not enough.</p>
			</div>
		</article>
		<article>
			<span>03</span>
			<div>
				<h3>Send one link</h3>
				<p>Publish when it is ready. Scoring happens automatically.</p>
			</div>
		</article>
	</section>
</main>

<style>
	.hero {
		min-height: min(690px, calc(100vh - 6rem));
		display: grid;
		grid-template-columns: 1.06fr 0.94fr;
		align-items: center;
		gap: clamp(2rem, 7vw, 7rem);
		padding: 4rem 0 6rem;
	}
	h1 {
		max-width: 760px;
		margin: 0.8rem 0 1.5rem;
	}
	h1 em {
		color: var(--blue);
		font-style: normal;
		display: block;
	}
	.lede {
		max-width: 610px;
		font-size: clamp(1.05rem, 2vw, 1.25rem);
		color: var(--muted);
	}
	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 1.2rem;
		margin-top: 2rem;
	}
	.text-link {
		color: var(--ink);
		font-weight: 800;
		text-underline-offset: 0.25rem;
	}
	.quiz-preview {
		position: relative;
		padding: clamp(1.35rem, 4vw, 2.4rem);
		border: 2px solid var(--ink);
		border-radius: 1.5rem 1.5rem 0.4rem 1.5rem;
		background: white;
		box-shadow: 12px 12px 0 var(--blue);
		transform: rotate(1.5deg);
	}
	.quiz-preview::after {
		content: '';
		position: absolute;
		right: -2px;
		bottom: -2px;
		border-style: solid;
		border-width: 1.7rem 1.7rem 0 0;
		border-color: var(--ink) var(--canvas) transparent transparent;
	}
	.preview-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 1.2rem;
		border-bottom: 2px dashed var(--line);
		font: 800 0.72rem var(--font-mono);
	}
	.preview-top > span:last-child {
		color: var(--muted);
	}
	.quiz-preview h2 {
		margin: 2rem 0;
		font-size: clamp(1.7rem, 3.6vw, 2.65rem);
	}
	.answers {
		display: grid;
		gap: 0.75rem;
	}
	.answers > div {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.85rem;
		border: 2px solid var(--line);
		border-radius: 0.85rem;
		font-weight: 750;
	}
	.answers b {
		display: grid;
		place-items: center;
		width: 2rem;
		aspect-ratio: 1;
		border-radius: 0.55rem;
		background: var(--canvas);
		font-family: var(--font-mono);
	}
	.answers .chosen {
		border-color: var(--ink);
		background: var(--lemon);
		box-shadow: 3px 3px 0 var(--ink);
	}
	.chosen span {
		margin-left: auto;
	}
	.strip {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 2px solid var(--ink);
		padding: 2rem 0 4rem;
	}
	.strip article {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
		padding: 1.5rem;
		border-right: 1px solid var(--line-strong);
	}
	.strip article:last-child {
		border: 0;
	}
	.strip article > span {
		font: 800 0.75rem var(--font-mono);
		color: var(--coral);
	}
	.strip h3 {
		margin-bottom: 0.4rem;
		font-size: 1.05rem;
	}
	.strip p {
		margin: 0;
		font-size: 0.9rem;
		color: var(--muted);
	}
	@media (max-width: 820px) {
		.hero {
			grid-template-columns: 1fr;
			padding-top: 3rem;
		}
		.quiz-preview {
			transform: none;
		}
		.strip {
			grid-template-columns: 1fr;
		}
		.strip article {
			border-right: 0;
			border-bottom: 1px solid var(--line-strong);
		}
	}
</style>
