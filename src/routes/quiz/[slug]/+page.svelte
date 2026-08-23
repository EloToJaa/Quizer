<script lang="ts">
	import { resolve } from '$app/paths';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	const submitted = $derived(
		new Map(form?.responses?.map((response) => [response.questionId, response.answerId]) ?? [])
	);
	const resultByQuestion = $derived(
		new Map(form?.result?.results.map((result) => [result.questionId, result]) ?? [])
	);
</script>

<svelte:head
	><title>{data.published?.quiz.title ?? 'Quiz'} — Quizer</title><meta
		name="description"
		content={data.published?.quiz.description ?? 'Play this quiz on Quizer.'}
	/></svelte:head
>
<AppHeader user={data.user ?? undefined} />
{#if !data.published}
	<main class="narrow missing paper">
		<span aria-hidden="true">?</span>
		<h1>Nothing to answer here.</h1>
		<p>{data.serviceError ?? 'This quiz may be private, unpublished, or the link may be wrong.'}</p>
		<a class="button" href={resolve('/')}>Go to Quizer</a>
	</main>
{:else}
	<main class="play-shell">
		<header class="quiz-intro">
			{#if data.published.quiz.cover}<img
					src={data.published.quiz.cover.url}
					alt={data.published.quiz.cover.alt ?? `${data.published.quiz.title} cover`}
				/>{/if}
			<div>
				<p class="eyebrow">{data.published.quiz.questionCount} questions · one score</p>
				<h1>{data.published.quiz.title}</h1>
				{#if data.published.quiz.description}<p>{data.published.quiz.description}</p>{/if}
			</div>
		</header>

		{#if form?.result}
			<section class="paper score" aria-live="polite">
				<p class="eyebrow">Your result</p>
				<strong>{form.result.scorePercent}%</strong>
				<div>
					<h2>{form.result.correctCount} of {form.result.totalQuestions} correct</h2>
					<p>
						{form.result.scorePercent >= 80
							? 'A sharp performance. You knew your way around this one.'
							: form.result.scorePercent >= 50
								? 'A solid run. One more pass could tip the balance.'
								: 'Curiosity did its job. Now you know what to revisit.'}
					</p>
				</div>
				<a
					class="button secondary"
					href={resolve('/quiz/[slug]', { slug: data.published.quiz.slug })}>Try again</a
				>
			</section>
		{/if}

		<form class="quiz-form" method="post">
			{#each data.published.questions as question, index (question._id)}
				<fieldset class="paper question-card">
					<legend><span>Question</span> {String(index + 1).padStart(2, '0')}</legend>
					<h2>{question.prompt}</h2>
					{#if question.media}<img
							class="question-image"
							src={question.media.url}
							alt={question.media.alt ?? `Image for: ${question.prompt}`}
						/>{/if}
					<div class="play-answers">
						{#each question.answers as answer, answerIndex (answer._id)}
							{@const questionResult = resultByQuestion.get(question._id)}
							<label
								class:selected={submitted.get(question._id) === answer._id}
								class:correct={questionResult?.correctAnswerId === answer._id}
								class:wrong={Boolean(
									questionResult &&
									submitted.get(question._id) === answer._id &&
									!questionResult.correct
								)}
							>
								<input
									type="radio"
									name={`answer_${question._id}`}
									value={answer._id}
									checked={submitted.get(question._id) === answer._id}
									disabled={Boolean(form?.result)}
									required
								/>
								<span class="letter">{String.fromCharCode(65 + answerIndex)}</span>
								{#if answer.media}<img
										src={answer.media.url}
										alt={answer.media.alt ?? `Image for answer: ${answer.text}`}
									/>{/if}
								<strong>{answer.text}</strong>
								{#if questionResult?.correctAnswerId === answer._id}<b>Correct</b
									>{:else if questionResult && submitted.get(question._id) === answer._id}<b
										>Not quite</b
									>{/if}
							</label>
						{/each}
					</div>
					{#if resultByQuestion.get(question._id)?.explanation}
						<p class="explanation">
							<strong>Why:</strong>
							{resultByQuestion.get(question._id)?.explanation}
						</p>
					{/if}
				</fieldset>
			{/each}
			{#if form?.message}<div class="notice" role="alert">{form.message}</div>{/if}
			{#if !form?.result}<button class="button coral submit" type="submit">Check my answers</button
				>{/if}
		</form>
	</main>
{/if}

<style>
	.play-shell {
		width: min(900px, calc(100% - 2rem));
		margin: 2rem auto 8rem;
	}
	.quiz-intro {
		display: grid;
		grid-template-columns: minmax(220px, 0.72fr) 1.28fr;
		align-items: center;
		gap: clamp(2rem, 7vw, 5rem);
		padding: 2rem 0 4rem;
	}
	.quiz-intro > img {
		width: 100%;
		aspect-ratio: 4/3;
		object-fit: cover;
		border: 2px solid var(--ink);
		border-radius: 1.2rem 1.2rem 0.35rem 1.2rem;
		box-shadow: 8px 8px 0 var(--lemon);
	}
	.quiz-intro h1 {
		font-size: clamp(3rem, 8vw, 5.5rem);
		margin: 0.6rem 0 1rem;
	}
	.quiz-intro p:last-child {
		color: var(--muted);
		font-size: 1.05rem;
	}
	.quiz-form {
		display: grid;
		gap: 1.4rem;
	}
	.question-card {
		margin: 0;
		padding: clamp(1.2rem, 5vw, 2.5rem);
	}
	.question-card legend {
		margin-left: 0.4rem;
		padding: 0 0.7rem;
		color: var(--coral);
		font: 800 0.82rem var(--font-mono);
		text-transform: uppercase;
	}
	.question-card legend span {
		color: var(--muted);
	}
	.question-card h2 {
		margin: 0.3rem 0 1.6rem;
		font-size: clamp(1.5rem, 4vw, 2.2rem);
	}
	.question-image {
		width: 100%;
		max-height: 360px;
		object-fit: cover;
		border-radius: 1rem;
		margin-bottom: 1.2rem;
	}
	.play-answers {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.8rem;
	}
	.play-answers label {
		position: relative;
		min-height: 4.4rem;
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.8rem;
		align-items: center;
		padding: 0.8rem;
		border: 2px solid var(--line-strong);
		border-radius: 0.9rem;
		cursor: pointer;
		background: white;
		transition: 0.15s ease;
	}
	.play-answers label:has(input:checked),
	.play-answers label.selected {
		border-color: var(--ink);
		box-shadow: 3px 3px 0 var(--ink);
		background: var(--lemon);
		transform: translate(-1px, -1px);
	}
	.play-answers label:has(input:focus-visible) {
		outline: 3px solid color-mix(in srgb, var(--blue) 35%, transparent);
		outline-offset: 2px;
	}
	.play-answers label.correct {
		border-color: var(--success);
		background: #dcf8e9;
		box-shadow: 3px 3px 0 var(--success);
	}
	.play-answers label.wrong {
		border-color: var(--danger);
		background: #ffe6df;
		box-shadow: 3px 3px 0 var(--danger);
	}
	.play-answers input {
		position: absolute;
		opacity: 0;
	}
	.play-answers .letter {
		display: grid;
		place-items: center;
		width: 2.4rem;
		aspect-ratio: 1;
		border-radius: 0.6rem;
		background: var(--canvas);
		font: 800 0.8rem var(--font-mono);
	}
	.play-answers img {
		grid-column: 1/-1;
		width: 100%;
		height: 130px;
		object-fit: cover;
		border-radius: 0.6rem;
	}
	.play-answers strong {
		line-height: 1.3;
	}
	.play-answers b {
		font: 800 0.68rem var(--font-mono);
		text-transform: uppercase;
	}
	.explanation {
		margin: 1.2rem 0 0;
		padding: 1rem;
		border-left: 4px solid var(--blue);
		background: var(--canvas);
		color: var(--muted);
	}
	.explanation strong {
		color: var(--ink);
	}
	.submit {
		justify-self: center;
		min-width: min(100%, 280px);
		margin-top: 1rem;
	}
	.notice {
		padding: 1rem;
		border: 2px solid var(--danger);
		border-radius: 0.8rem;
		background: white;
		font-weight: 700;
	}
	.score {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 1.5rem;
		align-items: center;
		padding: 1.5rem 2rem;
		margin-bottom: 2rem;
		border-color: var(--success);
	}
	.score > .eyebrow {
		grid-column: 1/-1;
		margin: 0;
	}
	.score > strong {
		font: 800 clamp(3rem, 8vw, 5rem) var(--font-display);
		color: var(--success);
	}
	.score h2,
	.score p {
		margin-bottom: 0.35rem;
	}
	.score p {
		color: var(--muted);
	}
	.missing {
		margin-top: 8vh;
		padding: clamp(2rem, 6vw, 4rem);
		text-align: center;
	}
	.missing > span {
		font: 800 3rem var(--font-display);
		color: var(--coral);
	}
	.missing h1 {
		font-size: clamp(2.5rem, 7vw, 4rem);
		margin: 0.8rem 0;
	}
	.missing p {
		color: var(--muted);
	}
	@media (max-width: 680px) {
		.quiz-intro {
			grid-template-columns: 1fr;
			padding-top: 1rem;
		}
		.quiz-intro > img {
			max-height: 250px;
		}
		.play-answers {
			grid-template-columns: 1fr;
		}
		.score {
			grid-template-columns: 1fr;
			text-align: center;
		}
		.score > .eyebrow {
			grid-column: auto;
		}
		.score .button {
			justify-self: center;
		}
	}
</style>
