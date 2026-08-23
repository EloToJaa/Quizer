import { convexRef, runMutation, runQuery } from '$lib/server/convex';
import type { AttemptResult, PublishedQuiz } from '$lib/types/quizzes';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const getPublished = convexRef<'query', { slug: string }, PublishedQuiz | null>(
	'quizzes:getPublishedBySlug'
);
const submit = convexRef<
	'mutation',
	{ quizId: string; responses: Array<{ questionId: string; answerId: string }> },
	AttemptResult
>('attempts:submit');

export const load: PageServerLoad = async ({ params, request }) => {
	const result = await runQuery(request, getPublished, { slug: params.slug });
	return result.match(
		(quiz) => ({ published: quiz, serviceError: null }),
		(error) => ({ published: null, serviceError: error.message })
	);
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const quizResult = await runQuery(request, getPublished, { slug: params.slug });
		if (quizResult.isErr()) return fail(503, { message: quizResult.error.message });
		if (!quizResult.value) return fail(404, { message: 'This quiz is no longer available.' });

		const data = await request.formData();
		const responses = quizResult.value.questions.map((question) => ({
			questionId: question._id,
			answerId: String(data.get(`answer_${question._id}`) ?? '')
		}));
		if (responses.some((response) => !response.answerId))
			return fail(400, { message: 'Answer every question before checking your score.', responses });

		const result = await runMutation(request, submit, {
			quizId: quizResult.value.quiz._id,
			responses
		});
		if (result.isErr()) return fail(400, { message: result.error.message, responses });
		return { result: result.value, responses };
	}
};
