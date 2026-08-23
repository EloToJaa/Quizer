import { convexRef, runMutation } from '$lib/server/convex';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const create = convexRef<'mutation', { title: string; description?: string }, string>(
	'quizzes:create'
);
export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	return {};
};
export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) redirect(302, '/login');
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		if (!title) return fail(400, { message: 'Give your quiz a title.', title, description });
		const result = await runMutation(request, create, {
			title,
			...(description ? { description } : {})
		});
		if (result.isErr()) return fail(400, { message: result.error.message, title, description });
		redirect(303, `/dashboard/quizzes/${result.value}`);
	}
};
