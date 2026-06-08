type AuthSession = {
	session: App.Locals['session'];
	user: App.Locals['user'];
};

const normalizeConvexSiteUrl = (convexSiteUrl: string) => {
	if (!convexSiteUrl) {
		throw new Error('PUBLIC_CONVEX_SITE_URL is not set.');
	}

	if (convexSiteUrl.endsWith('.convex.cloud')) {
		throw new Error('PUBLIC_CONVEX_SITE_URL must use the Convex site URL ending in .convex.site.');
	}

	return convexSiteUrl;
};

const forwardedHeaders = (request: Request, convexSiteUrl: string) => {
	const requestUrl = new URL(request.url);
	const headers = new Headers(request.headers);

	headers.delete('transfer-encoding');
	headers.delete('content-length');
	headers.delete('connection');
	headers.set('accept-encoding', 'identity');
	headers.set('host', new URL(convexSiteUrl).host);
	headers.set('x-forwarded-host', requestUrl.host);
	headers.set('x-forwarded-proto', requestUrl.protocol.slice(0, -1));
	headers.set('x-better-auth-forwarded-host', requestUrl.host);
	headers.set('x-better-auth-forwarded-proto', requestUrl.protocol.slice(0, -1));

	return headers;
};

export const proxyBetterAuthRequest = (request: Request, convexSiteUrl: string) => {
	const siteUrl = normalizeConvexSiteUrl(convexSiteUrl);
	const requestUrl = new URL(request.url);

	return fetch(`${siteUrl}${requestUrl.pathname}${requestUrl.search}`, {
		method: request.method,
		headers: forwardedHeaders(request, siteUrl),
		redirect: 'manual',
		body: request.body,
		duplex: 'half'
	} as RequestInit & { duplex: 'half' });
};

export const getAuthSession = async (request: Request, convexSiteUrl: string) => {
	const siteUrl = normalizeConvexSiteUrl(convexSiteUrl);
	const requestUrl = new URL(request.url);
	const sessionUrl = new URL('/api/auth/get-session', siteUrl);
	const headers = forwardedHeaders(request, siteUrl);

	headers.set('x-forwarded-host', requestUrl.host);

	const response = await fetch(sessionUrl, {
		method: 'GET',
		headers,
		redirect: 'manual'
	});

	if (!response.ok) {
		return null;
	}

	return (await response.json()) as AuthSession | null;
};
