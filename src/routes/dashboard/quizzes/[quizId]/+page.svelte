<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	let editor = $state<typeof data.editor>();
	let editorVersion = $state('');
	let openQuestion = $state<string | null>(null);
	$effect(() => {
		if (!data.editor) {
			editor = data.editor;
			editorVersion = '';
			return;
		}
		const nextVersion = JSON.stringify(data.editor);
		if (nextVersion === editorVersion) return;
		const previousOpenQuestion = openQuestion;
		editor = structuredClone(data.editor);
		editorVersion = nextVersion;
		openQuestion = editor.questions.some((question) => question._id === previousOpenQuestion)
			? previousOpenQuestion
			: (editor.questions[0]?._id ?? null);
	});
</script>

<svelte:head><title>{editor?.quiz.title ?? 'Quiz editor'} — Quizer</title></svelte:head>
<AppHeader user={data.user ?? undefined} />
{#if data.serviceError || !editor}
	<main class="narrow">
		<div class="paper fatal">
			<h1>That sheet is out of reach.</h1>
			<p>{data.serviceError ?? 'This quiz could not be found.'}</p>
			<a class="button" href={resolve('/dashboard')}>Back to my quizzes</a>
		</div>
	</main>
{:else}
	<main class="shell editor">
		<header class="editor-head">
			<div>
				<a href={resolve('/dashboard')}>← My quizzes</a>
				<p class="eyebrow">{editor.quiz.status} · {editor.questions.length} questions</p>
				<h1>{editor.quiz.title}</h1>
			</div>
			<div class="publish-box">
				{#if editor.quiz.status === 'published'}<a
						class="link"
						href={resolve('/quiz/[slug]', { slug: editor.quiz.slug })}>Open live quiz ↗</a
					>
					<form method="post" action="?/unpublish">
						<button class="button secondary" type="submit">Return to draft</button>
					</form>{:else}<form method="post" action="?/publish" use:enhance>
						<button class="button coral" type="submit">Publish quiz</button>
					</form>{/if}
			</div>
		</header>
		{#if form?.message}<div class="notice" role="alert">{form.message}</div>{/if}
		{#if form?.publishedSlug}<div class="notice success">
				Published. <a href={resolve('/quiz/[slug]', { slug: form.publishedSlug })}
					>Open the quiz ↗</a
				>
			</div>{/if}

		<section class="paper details">
			<div>
				<p class="eyebrow">Cover sheet</p>
				<h2>Quiz details</h2>
				<p>Set the context players see before question one.</p>
			</div>
			<form method="post" action="?/updateQuiz" use:enhance>
				<label class="field"
					><span>Title</span><input name="title" bind:value={editor.quiz.title} required /></label
				>
				<label class="field"
					><span>Description</span><textarea name="description" bind:value={editor.quiz.description}
					></textarea></label
				>
				<div class="field">
					<span>Cover image</span><ImageUpload
						endpoint="quizImage"
						bind:value={editor.quiz.cover}
						label="Upload a cover image"
					/><input type="hidden" name="cover" value={JSON.stringify(editor.quiz.cover ?? null)} />
				</div>
				<button class="button small" type="submit" disabled={editor.quiz.status === 'published'}
					>Save details</button
				>
			</form>
		</section>

		<section class="questions">
			<header>
				<div>
					<p class="eyebrow">Answer sheets</p>
					<h2>Questions</h2>
				</div>
				<span>{editor.questions.length}</span>
			</header>
			{#each editor.questions as question, index (question._id)}
				<article class="paper question" class:open={openQuestion === question._id}>
					<button
						class="question-title"
						type="button"
						onclick={() => (openQuestion = openQuestion === question._id ? null : question._id)}
						aria-expanded={openQuestion === question._id}
						><span>{String(index + 1).padStart(2, '0')}</span><strong>{question.prompt}</strong><i
							>{openQuestion === question._id ? '−' : '+'}</i
						></button
					>
					{#if openQuestion === question._id}
						<div class="question-body">
							<form class="question-form" method="post" action="?/updateQuestion" use:enhance>
								<input type="hidden" name="questionId" value={question._id} /><label class="field"
									><span>Question</span><textarea
										name="prompt"
										bind:value={question.prompt}
										required
									></textarea></label
								><label class="field"
									><span>Answer explanation <i>optional</i></span><textarea
										name="explanation"
										bind:value={question.explanation}
										placeholder="Shown in your saved quiz data."
									></textarea></label
								>
								<div class="field">
									<span>Question image <i>optional</i></span><ImageUpload
										endpoint="answerImage"
										bind:value={question.media}
									/><input
										type="hidden"
										name="media"
										value={JSON.stringify(question.media ?? null)}
									/>
								</div>
								<button class="button small" type="submit">Save question</button>
							</form>
							<div class="answer-section">
								<div class="answer-heading">
									<h3>Answers</h3>
									<span>Pick exactly one correct answer.</span>
								</div>
								{#if question.answers.length}
									<form class="correct-form" method="post" action="?/setCorrect" use:enhance>
										<input
											type="hidden"
											name="questionId"
											value={question._id}
										/>{#each question.answers as answer (answer._id)}<input
												type="hidden"
												name="answerIds"
												value={answer._id}
											/><label
												><input
													type="radio"
													name="correctAnswerId"
													value={answer._id}
													checked={answer.isCorrect}
													onchange={(event) => event.currentTarget.form?.requestSubmit()}
												/><span>{answer.text}</span><b>Correct</b></label
											>{/each}
									</form>
								{/if}
								<div class="answer-list">
									{#each question.answers as answer, answerIndex (answer._id)}<div
											class="answer-row"
										>
											<span class="answer-letter">{String.fromCharCode(65 + answerIndex)}</span>
											<form method="post" action="?/updateAnswer" use:enhance>
												<input type="hidden" name="answerId" value={answer._id} /><input
													aria-label={`Answer ${answerIndex + 1}`}
													name="text"
													bind:value={answer.text}
													required
												/><ImageUpload
													endpoint="answerImage"
													bind:value={answer.media}
													label="Add answer image"
												/><input
													type="hidden"
													name="media"
													value={JSON.stringify(answer.media ?? null)}
												/><button class="button small secondary" type="submit">Save answer</button>
											</form>
											<form method="post" action="?/removeAnswer" use:enhance>
												<input type="hidden" name="answerId" value={answer._id} /><button
													class="link danger"
													type="submit"
													aria-label={`Delete answer ${answerIndex + 1}`}>Delete</button
												>
											</form>
										</div>{/each}
								</div>
								<form class="add-answer" method="post" action="?/addAnswer" use:enhance>
									<input type="hidden" name="questionId" value={question._id} /><label class="field"
										><span>New answer</span><input
											name="text"
											maxlength="500"
											placeholder="Type another possible answer"
											required
										/></label
									><button class="button small" type="submit">Add answer</button>
								</form>
							</div>
							<form
								method="post"
								action="?/removeQuestion"
								use:enhance
								onsubmit={(event) =>
									!confirm('Delete this question and its answers?') && event.preventDefault()}
							>
								<input type="hidden" name="questionId" value={question._id} /><button
									class="link danger"
									type="submit">Delete this question</button
								>
							</form>
						</div>
					{/if}
				</article>
			{/each}
			<form class="paper new-question" method="post" action="?/addQuestion" use:enhance>
				<div>
					<span class="eyebrow"
						>Question {String(editor.questions.length + 1).padStart(2, '0')}</span
					>
					<h3>Add another question</h3>
				</div>
				<label class="field"
					><span>Question</span><textarea
						name="prompt"
						placeholder="What do you want to ask?"
						required
					></textarea></label
				><button class="button coral" type="submit">Add question</button>
			</form>
		</section>
	</main>
{/if}

<style>
	.editor {
		padding: 2.5rem 0 8rem;
	}
	.editor-head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 2rem;
		margin-bottom: 2rem;
	}
	.editor-head a {
		color: var(--ink);
		font-weight: 800;
	}
	.editor-head .eyebrow {
		margin: 1.8rem 0 0.5rem;
	}
	.editor-head h1 {
		font-size: clamp(2.5rem, 6vw, 4.5rem);
		margin: 0;
	}
	.publish-box {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.publish-box form {
		margin: 0;
	}
	.details {
		padding: clamp(1.3rem, 4vw, 2.5rem);
		display: grid;
		grid-template-columns: 0.7fr 1.3fr;
		gap: clamp(2rem, 7vw, 6rem);
	}
	.details > div > p:last-child {
		color: var(--muted);
	}
	.details form,
	.question-form {
		display: grid;
		gap: 1rem;
	}
	.field i {
		color: var(--muted);
		font-style: normal;
		font-weight: 500;
	}
	.questions {
		width: min(900px, 100%);
		margin: 4rem auto 0;
	}
	.questions > header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		margin-bottom: 1rem;
	}
	.questions > header h2 {
		margin: 0.4rem 0 0;
	}
	.questions > header > span {
		font: 800 2rem var(--font-mono);
		color: var(--blue);
	}
	.question {
		margin-bottom: 1rem;
		overflow: hidden;
	}
	.question-title {
		width: 100%;
		display: grid;
		grid-template-columns: 3rem 1fr auto;
		gap: 1rem;
		align-items: center;
		text-align: left;
		padding: 1.2rem;
		border: 0;
		background: white;
		cursor: pointer;
	}
	.question-title > span {
		font: 800 0.75rem var(--font-mono);
		color: var(--coral);
	}
	.question-title strong {
		font-family: var(--font-display);
		font-size: 1.15rem;
	}
	.question-title i {
		font: normal 1.7rem var(--font-mono);
	}
	.question-body {
		border-top: 2px dashed var(--line);
		padding: 1.3rem;
	}
	.answer-section {
		margin: 2rem 0;
		padding-top: 1.5rem;
		border-top: 2px solid var(--ink);
	}
	.answer-heading {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: baseline;
	}
	.answer-heading span {
		color: var(--muted);
		font-size: 0.82rem;
	}
	.correct-form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.6rem;
		margin: 1rem 0;
	}
	.correct-form label {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.6rem;
		padding: 0.7rem;
		border-radius: 0.7rem;
		background: var(--canvas);
		cursor: pointer;
	}
	.correct-form b {
		grid-column: 2;
		color: var(--success);
		font: 700 0.68rem var(--font-mono);
		opacity: 0;
	}
	.correct-form input:checked ~ b {
		opacity: 1;
	}
	.correct-form label:has(input:focus-visible) {
		outline: 3px solid color-mix(in srgb, var(--blue) 35%, transparent);
		outline-offset: 2px;
	}
	.answer-list {
		display: grid;
		gap: 0.8rem;
	}
	.answer-row {
		display: grid;
		grid-template-columns: 2.3rem 1fr auto;
		gap: 0.7rem;
		align-items: start;
		padding: 0.8rem;
		border: 2px solid var(--line);
		border-radius: 0.9rem;
	}
	.answer-letter {
		display: grid;
		place-items: center;
		width: 2.2rem;
		aspect-ratio: 1;
		border-radius: 0.55rem;
		background: var(--lemon);
		font: 800 0.8rem var(--font-mono);
	}
	.answer-row > form:first-of-type {
		display: grid;
		grid-template-columns: 1fr minmax(150px, 0.5fr) auto;
		gap: 0.7rem;
	}
	.add-answer {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: end;
		gap: 0.8rem;
		margin-top: 1rem;
	}
	.new-question {
		padding: 1.3rem;
		display: grid;
		grid-template-columns: 0.6fr 1.4fr auto;
		align-items: end;
		gap: 1rem;
		background: color-mix(in srgb, var(--lemon) 22%, white);
	}
	.new-question h3 {
		margin: 0.35rem 0 0;
	}
	.notice {
		margin-bottom: 1rem;
		padding: 1rem;
		border: 2px solid var(--danger);
		border-radius: 0.8rem;
		background: white;
		font-weight: 700;
	}
	.notice.success {
		border-color: var(--success);
	}
	.fatal {
		margin-top: 5rem;
		padding: 3rem;
	}
	.fatal h1 {
		font-size: 3rem;
	}
	.fatal p {
		color: var(--muted);
	}
	@media (max-width: 780px) {
		.editor-head,
		.details {
			display: grid;
			grid-template-columns: 1fr;
		}
		.publish-box {
			flex-wrap: wrap;
		}
		.new-question {
			grid-template-columns: 1fr;
		}
		.answer-row > form:first-of-type {
			grid-template-columns: 1fr;
		}
		.answer-row {
			grid-template-columns: 2.3rem 1fr;
		}
		.answer-row > form:last-child {
			grid-column: 2;
		}
		.correct-form {
			grid-template-columns: 1fr;
		}
		.answer-heading {
			display: block;
		}
	}
</style>
