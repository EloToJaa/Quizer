import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

type CookieOptions = Parameters<RequestEvent['cookies']['set']>[2];

const parseCookie = (cookie: string) => {
	const [nameValue, ...attributes] = cookie.split(';');
	const separator = nameValue.indexOf('=');
	const name = nameValue.slice(0, separator);
	const value = nameValue.slice(separator + 1);
	const options: CookieOptions = { path: '/' };

	for (const attribute of attributes) {
		const [rawKey, ...rawValue] = attribute.trim().split('=');
		const key = rawKey.toLowerCase();
		const attrValue = rawValue.join('=');

		if (key === 'path') options.path = attrValue;
		if (key === 'domain') options.domain = attrValue;
		if (key === 'max-age') options.maxAge = Number(attrValue);
		if (key === 'expires') options.expires = new Date(attrValue);
		if (key === 'httponly') options.httpOnly = true;
		if (key === 'secure') options.secure = true;
		if (key === 'samesite') options.sameSite = attrValue.toLowerCase() as CookieOptions['sameSite'];
	}

	return { name, value, options };
};

const authFetch = async (event: RequestEvent, path: string, body: object) => {
	const response = await event.fetch(path, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});

	for (const rawCookie of response.headers.getSetCookie()) {
		const { name, value, options } = parseCookie(rawCookie);
		event.cookies.set(name, value, options);
	}

	return response;
};

const authError = async (response: Response, fallback: string) => {
	const contentType = response.headers.get('content-type');

	if (!contentType?.includes('application/json')) {
		return fallback;
	}

	const body = (await response.json()) as { message?: string };
	return body.message ?? fallback;
};

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		return redirect(302, '/demo/better-auth');
	}
	return {};
};

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const response = await authFetch(event, '/api/auth/sign-in/email', {
			email,
			password,
			callbackURL: '/demo/better-auth'
		});

		if (!response.ok) {
			return fail(response.status, { message: await authError(response, 'Signin failed') });
		}

		return redirect(302, '/demo/better-auth');
	},
	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';
		const response = await authFetch(event, '/api/auth/sign-up/email', {
			email,
			password,
			name,
			callbackURL: '/demo/better-auth'
		});

		if (!response.ok) {
			return fail(response.status, { message: await authError(response, 'Registration failed') });
		}

		return redirect(302, '/demo/better-auth');
	}
};
