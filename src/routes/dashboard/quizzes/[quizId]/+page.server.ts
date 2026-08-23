import { convexRef, runMutation, runQuery } from '$lib/server/convex';
import type { Question, QuizSummary, UploadMedia } from '$lib/types/quizzes';
import { fail, redirect } from '@sveltejs/kit';
import { ok, Result } from 'neverthrow';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

type EditorData = { quiz: QuizSummary; questions: Question[] };
const getMine = convexRef<'query', { quizId: string }, EditorData | null>('quizzes:getMine');
const updateQuiz = convexRef<
	'mutation',
	{ quizId: string; title?: string; description?: string; cover?: UploadMedia | null },
	null
>('quizzes:update');
const publishQuiz = convexRef<'mutation', { quizId: string }, { quizId: string; slug: string }>(
	'quizzes:publish'
);
const unpublishQuiz = convexRef<'mutation', { quizId: string }, null>('quizzes:unpublish');
const createQuestion = convexRef<
	'mutation',
	{ quizId: string; prompt: string; explanation?: string; media?: UploadMedia },
	string
>('questions:create');
const updateQuestion = convexRef<
	'mutation',
	{ questionId: string; prompt?: string; explanation?: string; media?: UploadMedia | null },
	null
>('questions:update');
const removeQuestion = convexRef<'mutation', { questionId: string }, null>('questions:remove');
const createAnswer = convexRef<
	'mutation',
	{ questionId: string; text: string; isCorrect: boolean; media?: UploadMedia },
	string
>('answers:create');
const updateAnswer = convexRef<
	'mutation',
	{ answerId: string; text?: string; isCorrect?: boolean; media?: UploadMedia | null },
	null
>('answers:update');
const removeAnswer = convexRef<'mutation', { answerId: string }, null>('answers:remove');
const setCorrectAnswer = convexRef<'mutation', { questionId: string; answerId: string }, null>(
	'answers:setCorrect'
);

const text = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
const parseMedia = (data: FormData, key: string) => {
	const raw = text(data, key);
	if (!raw) return ok<UploadMedia | null, Error>(null);
	return Result.fromThrowable(
		(value: string) => JSON.parse(value) as UploadMedia | null,
		() => new Error('The uploaded image data is invalid.')
	)(raw);
};
const mutationFailure = <T>(
	result: Awaited<ReturnType<typeof runMutation<Record<string, unknown>, T>>>
) => (result.isErr() ? fail(400, { message: result.error.message }) : { success: true });
const requireUser = (event: RequestEvent) => {
	if (!event.locals.user) redirect(302, '/login');
};

export const load: PageServerLoad = async (event) => {
	requireUser(event);
	const result = await runQuery(event.request, getMine, { quizId: event.params.quizId });
	if (result.isErr()) return { editor: null, serviceError: result.error.message };
	if (!result.value) redirect(302, '/dashboard');
	return { editor: result.value, serviceError: null };
};

export const actions: Actions = {
	updateQuiz: async (event) => {
		requireUser(event);
		const data = await event.request.formData();
		const cover = parseMedia(data, 'cover');
		if (cover.isErr()) return fail(400, { message: cover.error.message });
		const title = text(data, 'title');
		if (!title) return fail(400, { message: 'Give your quiz a title.' });
		return mutationFailure(
			await runMutation(event.request, updateQuiz, {
				quizId: event.params.quizId,
				title,
				description: text(data, 'description'),
				cover: cover.value
			})
		);
	},
	addQuestion: async (event) => {
		requireUser(event);
		const data = await event.request.formData();
		const prompt = text(data, 'prompt');
		if (!prompt) return fail(400, { message: 'Write the question before adding it.' });
		return mutationFailure(
			await runMutation(event.request, createQuestion, { quizId: event.params.quizId, prompt })
		);
	},
	updateQuestion: async (event) => {
		requireUser(event);
		const data = await event.request.formData();
		const media = parseMedia(data, 'media');
		if (media.isErr()) return fail(400, { message: media.error.message });
		return mutationFailure(
			await runMutation(event.request, updateQuestion, {
				questionId: text(data, 'questionId'),
				prompt: text(data, 'prompt'),
				explanation: text(data, 'explanation'),
				media: media.value
			})
		);
	},
	removeQuestion: async (event) => {
		requireUser(event);
		const data = await event.request.formData();
		return mutationFailure(
			await runMutation(event.request, removeQuestion, { questionId: text(data, 'questionId') })
		);
	},
	addAnswer: async (event) => {
		requireUser(event);
		const data = await event.request.formData();
		const answer = text(data, 'text');
		if (!answer) return fail(400, { message: 'Write an answer before adding it.' });
		return mutationFailure(
			await runMutation(event.request, createAnswer, {
				questionId: text(data, 'questionId'),
				text: answer,
				isCorrect: false
			})
		);
	},
	updateAnswer: async (event) => {
		requireUser(event);
		const data = await event.request.formData();
		const media = parseMedia(data, 'media');
		if (media.isErr()) return fail(400, { message: media.error.message });
		return mutationFailure(
			await runMutation(event.request, updateAnswer, {
				answerId: text(data, 'answerId'),
				text: text(data, 'text'),
				media: media.value
			})
		);
	},
	removeAnswer: async (event) => {
		requireUser(event);
		const data = await event.request.formData();
		return mutationFailure(
			await runMutation(event.request, removeAnswer, { answerId: text(data, 'answerId') })
		);
	},
	setCorrect: async (event) => {
		requireUser(event);
		const data = await event.request.formData();
		const selected = text(data, 'correctAnswerId');
		const answerIds = data.getAll('answerIds').map(String);
		if (!selected || !answerIds.includes(selected))
			return fail(400, { message: 'Choose a valid correct answer.' });
		return mutationFailure(
			await runMutation(event.request, setCorrectAnswer, {
				questionId: text(data, 'questionId'),
				answerId: selected
			})
		);
	},
	publish: async (event) => {
		requireUser(event);
		const result = await runMutation(event.request, publishQuiz, { quizId: event.params.quizId });
		if (result.isErr()) return fail(400, { message: result.error.message });
		return { success: true, publishedSlug: result.value.slug };
	},
	unpublish: async (event) => {
		requireUser(event);
		return mutationFailure(
			await runMutation(event.request, unpublishQuiz, { quizId: event.params.quizId })
		);
	}
};
