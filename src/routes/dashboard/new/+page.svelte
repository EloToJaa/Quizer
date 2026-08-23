<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Create a quiz — Quizer</title></svelte:head>
<AppHeader user={data.user ?? undefined} />
<main class="narrow create">
	<a class="back" href={resolve('/dashboard')}>← My quizzes</a>
	<section class="paper">
		<p class="eyebrow">New quiz</p>
		<h1>What are we asking?</h1>
		<p class="intro">
			Start with a title. You will add the questions, answers, and images on the next sheet.
		</p>
		<form method="post" use:enhance>
			<label class="field"
				><span>Quiz title</span><input
					name="title"
					value={form?.title ?? ''}
					maxlength="120"
					placeholder="e.g. Odd corners of the solar system"
					required
				/></label
			><label class="field"
				><span>Description <i>optional</i></span><textarea
					name="description"
					maxlength="2000"
					placeholder="Tell players what this quiz is about.">{form?.description ?? ''}</textarea
				></label
			>{#if form?.message}<p class="form-message" role="alert">{form.message}</p>{/if}<button
				class="button coral"
				type="submit">Create and add questions</button
			>
		</form>
	</section>
</main>

<style>
	.create {
		padding: 3rem 0 7rem;
	}
	.back {
		display: inline-block;
		margin-bottom: 1.5rem;
		color: var(--ink);
		font-weight: 800;
	}
	.paper {
		padding: clamp(1.4rem, 5vw, 3.5rem);
	}
	.paper h1 {
		font-size: clamp(2.4rem, 7vw, 4rem);
		margin: 0.7rem 0 1rem;
	}
	.intro {
		color: var(--muted);
		max-width: 570px;
	}
	.field i {
		color: var(--muted);
		font-style: normal;
		font-weight: 500;
	}
	form {
		display: grid;
		gap: 1.3rem;
		margin-top: 2rem;
	}
	form .button {
		justify-self: start;
	}
</style>
