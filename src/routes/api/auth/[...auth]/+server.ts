import { env as publicEnv } from '$env/dynamic/public';
import { proxyBetterAuthRequest } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) =>
	proxyBetterAuthRequest(request, publicEnv.PUBLIC_CONVEX_SITE_URL);

export const POST: RequestHandler = ({ request }) =>
	proxyBetterAuthRequest(request, publicEnv.PUBLIC_CONVEX_SITE_URL);
