import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

type CookieOptions = Parameters<RequestEvent['cookies']['set']>[2];

const parseCookie = (cookie: string) => {
	const [nameValue, ...attributes] = cookie.split(';');
	const separator = nameValue.indexOf('=');
	const options: CookieOptions = { path: '/' };
	for (const attribute of attributes) {
		const [rawKey, ...rawValue] = attribute.trim().split('=');
		const key = rawKey.toLowerCase();
		const value = rawValue.join('=');
		if (key === 'path') options.path = value;
		if (key === 'domain') options.domain = value;
		if (key === 'max-age') options.maxAge = Number(value);
		if (key === 'expires') options.expires = new Date(value);
		if (key === 'httponly') options.httpOnly = true;
		if (key === 'secure') options.secure = true;
		if (key === 'samesite') options.sameSite = value.toLowerCase() as CookieOptions['sameSite'];
	}
	return { name: nameValue.slice(0, separator), value: nameValue.slice(separator + 1), options };
};

const authFetch = async (event: RequestEvent, path: string, body: object) => {
	const response = await event.fetch(path, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	for (const rawCookie of response.headers.getSetCookie()) {
		const cookie = parseCookie(rawCookie);
		event.cookies.set(cookie.name, cookie.value, cookie.options);
	}
	return response;
};

const authError = async (response: Response) => {
	if (!response.headers.get('content-type')?.includes('application/json'))
		return 'Could not continue. Check your details and try again.';
	const body = (await response.json()) as { message?: string };
	return body.message ?? 'Could not continue. Check your details and try again.';
};

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(302, '/dashboard');
	return { register: url.searchParams.get('mode') === 'register' };
};

export const actions: Actions = {
	signIn: async (event) => {
		const data = await event.request.formData();
		const response = await authFetch(event, '/api/auth/sign-in/email', {
			email: String(data.get('email') ?? ''),
			password: String(data.get('password') ?? ''),
			callbackURL: '/dashboard'
		});
		if (!response.ok)
			return fail(response.status, { message: await authError(response), mode: 'signin' });
		redirect(302, '/dashboard');
	},
	signUp: async (event) => {
		const data = await event.request.formData();
		const response = await authFetch(event, '/api/auth/sign-up/email', {
			name: String(data.get('name') ?? ''),
			email: String(data.get('email') ?? ''),
			password: String(data.get('password') ?? ''),
			callbackURL: '/dashboard'
		});
		if (!response.ok)
			return fail(response.status, { message: await authError(response), mode: 'register' });
		redirect(302, '/dashboard');
	}
};
