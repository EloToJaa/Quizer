<script lang="ts">
	import { resolve } from '$app/paths';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	const date = (timestamp: number) =>
		new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(
			timestamp
		);
</script>

<svelte:head><title>My quizzes — Quizer</title></svelte:head>
<AppHeader user={data.user ?? undefined} />
<main class="shell dashboard">
	<header class="page-head">
		<div>
			<p class="eyebrow">Your question desk</p>
			<h1>My quizzes</h1>
			<p>Welcome back, {data.user?.name ?? data.user?.email}.</p>
		</div>
		<a class="button coral" href={resolve('/dashboard/new')}>Create a quiz</a>
	</header>
	{#if data.serviceError}<div class="notice error" role="alert">
			<strong>Could not load your quizzes.</strong><span>{data.serviceError}</span>
		</div>{/if}
	{#if form?.message}<p class="form-message">{form.message}</p>{/if}
	{#if data.quizzes.length}
		<section class="quiz-grid" aria-label="Your quizzes">
			{#each data.quizzes as quiz (quiz._id)}
				<article class="paper quiz-card">
					{#if quiz.cover}<img src={quiz.cover.url} alt={quiz.cover.alt ?? ''} />{:else}<div
							class="cover-placeholder"
							aria-hidden="true"
						>
							?
						</div>{/if}
					<div class="card-body">
						<div class="meta">
							<span class:published={quiz.status === 'published'}>{quiz.status}</span><span
								>{quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}</span
							>
						</div>
						<h2>{quiz.title}</h2>
						<p>{quiz.description || 'No description yet.'}</p>
						<small>Edited {date(quiz.updatedAt)}</small>
					</div>
					<div class="card-actions">
						<a
							class="button small secondary"
							href={resolve('/dashboard/quizzes/[quizId]', { quizId: quiz._id })}>Edit quiz</a
						>{#if quiz.status === 'published'}<a
								class="link"
								href={resolve('/quiz/[slug]', { slug: quiz.slug })}>Play ↗</a
							>{:else}<form
								method="post"
								action="?/remove"
								onsubmit={(event) => !confirm(`Delete “${quiz.title}”?`) && event.preventDefault()}
							>
								<input type="hidden" name="quizId" value={quiz._id} /><button
									type="submit"
									class="link danger">Delete</button
								>
							</form>{/if}
					</div>
				</article>
			{/each}
		</section>
	{:else if !data.serviceError}
		<section class="paper empty">
			<span aria-hidden="true">Q?</span>
			<h2>Your first quiz is a blank sheet.</h2>
			<p>Give it a title now. Questions and images come next.</p>
			<a class="button" href={resolve('/dashboard/new')}>Create your first quiz</a>
		</section>
	{/if}
</main>

<style>
	.dashboard {
		padding: 3rem 0 7rem;
	}
	.page-head {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 2rem;
		margin-bottom: 2.5rem;
	}
	.page-head h1 {
		font-size: clamp(2.8rem, 6vw, 4.7rem);
		margin: 0.6rem 0 0.3rem;
	}
	.page-head p:last-child {
		margin: 0;
		color: var(--muted);
	}
	.quiz-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 310px), 1fr));
		gap: 1.5rem;
	}
	.quiz-card {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 430px;
	}
	.quiz-card > img,
	.cover-placeholder {
		width: 100%;
		height: 150px;
		object-fit: cover;
		border-bottom: 2px solid var(--ink);
	}
	.cover-placeholder {
		display: grid;
		place-items: center;
		background: var(--lemon);
		font: 800 4rem var(--font-display);
		color: color-mix(in srgb, var(--ink) 30%, transparent);
	}
	.card-body {
		padding: 1.2rem 1.2rem 0;
		flex: 1;
	}
	.meta {
		display: flex;
		gap: 0.5rem;
		font: 800 0.65rem var(--font-mono);
		text-transform: uppercase;
	}
	.meta span {
		padding: 0.25rem 0.45rem;
		border-radius: 0.3rem;
		background: var(--canvas);
	}
	.meta .published {
		color: var(--success);
		background: #dcf8e9;
	}
	.card-body h2 {
		margin: 0.9rem 0 0.5rem;
		font-size: 1.55rem;
	}
	.card-body p {
		color: var(--muted);
		font-size: 0.9rem;
	}
	.card-body small {
		font: 0.68rem var(--font-mono);
		color: var(--muted);
	}
	.card-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.2rem;
		gap: 1rem;
	}
	.card-actions form {
		margin: 0;
	}
	.empty {
		padding: clamp(2rem, 7vw, 5rem);
		text-align: center;
	}
	.empty > span {
		display: inline-grid;
		place-items: center;
		width: 5rem;
		aspect-ratio: 1;
		border: 2px solid var(--ink);
		border-radius: 1rem;
		background: var(--lemon);
		box-shadow: 5px 5px 0 var(--ink);
		font: 800 1.5rem var(--font-mono);
	}
	.empty h2 {
		margin: 2rem 0 0.6rem;
	}
	.empty p {
		color: var(--muted);
	}
	.notice {
		display: grid;
		gap: 0.25rem;
		padding: 1rem;
		margin-bottom: 1rem;
		background: white;
		border: 2px solid var(--danger);
		border-radius: 0.8rem;
	}
	@media (max-width: 620px) {
		.page-head {
			align-items: stretch;
			flex-direction: column;
		}
	}
</style>
