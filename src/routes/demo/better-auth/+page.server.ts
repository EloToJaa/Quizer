import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

const clearAuthCookies = (event: RequestEvent, response: Response) => {
	for (const rawCookie of response.headers.getSetCookie()) {
		const separator = rawCookie.indexOf('=');
		const name = rawCookie.slice(0, separator);
		event.cookies.delete(name, { path: '/' });
	}
};

export const load: PageServerLoad = (event) => {
	if (!event.locals.user) {
		return redirect(302, '/demo/better-auth/login');
	}
	return { user: event.locals.user };
};

export const actions: Actions = {
	signOut: async (event) => {
		const response = await event.fetch('/api/auth/sign-out', { method: 'POST' });
		clearAuthCookies(event, response);

		return redirect(302, '/demo/better-auth/login');
	}
};
