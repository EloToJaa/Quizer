import { convexRef, runMutation, runQuery } from '$lib/server/convex';
import type { QuizSummary } from '$lib/types/quizzes';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const listMine = convexRef<'query', Record<string, never>, QuizSummary[]>('quizzes:listMine');
const remove = convexRef<'mutation', { quizId: string }, null>('quizzes:remove');

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.user) redirect(302, '/login');
	const result = await runQuery(request, listMine, {});
	return result.match(
		(quizzes) => ({ quizzes, serviceError: null }),
		(error) => ({ quizzes: [], serviceError: error.message })
	);
};

export const actions: Actions = {
	signOut: async (event) => {
		const response = await event.fetch('/api/auth/sign-out', { method: 'POST' });
		for (const rawCookie of response.headers.getSetCookie()) {
			const name = rawCookie.slice(0, rawCookie.indexOf('='));
			event.cookies.delete(name, { path: '/' });
		}
		redirect(302, '/login');
	},
	remove: async ({ locals, request }) => {
		if (!locals.user) redirect(302, '/login');
		const data = await request.formData();
		const quizId = String(data.get('quizId') ?? '');
		if (!quizId) return fail(400, { message: 'Quiz id is missing.' });
		const result = await runMutation(request, remove, { quizId });
		if (result.isErr()) return fail(400, { message: result.error.message });
		return { message: 'Quiz deleted.' };
	}
};
