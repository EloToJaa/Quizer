import { sequence } from '@sveltejs/kit/hooks';
import { env as publicEnv } from '$env/dynamic/public';
import { getAuthSession } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await getAuthSession(event.request, publicEnv.PUBLIC_CONVEX_SITE_URL);

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return resolve(event);
};

export const handle: Handle = sequence(handleParaglide, handleBetterAuth);
