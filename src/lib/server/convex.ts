import { env as publicEnv } from '$env/dynamic/public';
import { getToken } from '@convex-dev/better-auth/utils';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference, type FunctionReference } from 'convex/server';
import { ResultAsync } from 'neverthrow';

const siteUrl = () => {
	const value = publicEnv.PUBLIC_CONVEX_SITE_URL;
	if (!value) return null;
	return value.replace(/\/$/, '');
};

const deploymentUrl = () => {
	const configured = publicEnv.PUBLIC_CONVEX_URL?.replace(/\/$/, '');
	if (configured) return configured;
	return siteUrl()?.replace(/\.convex\.site$/, '.convex.cloud') ?? null;
};

const client = async (request?: Request) => {
	const url = deploymentUrl();
	if (!url) return null;

	const convex = new ConvexHttpClient(url);
	if (!request) return convex;

	const site = siteUrl();
	if (!site) return convex;

	const { token } = await getToken(site, new Headers(request.headers));
	if (token) convex.setAuth(token);
	return convex;
};

export const convexRef = <
	Kind extends 'query' | 'mutation',
	Args extends Record<string, unknown>,
	Result
>(
	name: string
) => makeFunctionReference<Kind, Args, Result>(name);

export const runQuery = <Args extends Record<string, unknown>, Result>(
	request: Request | undefined,
	ref: FunctionReference<'query', 'public', Args, Result>,
	args: Args
) =>
	ResultAsync.fromPromise(
		client(request).then((convex) => {
			if (!convex) throw new Error('Convex is not configured.');
			const query = convex.query.bind(convex) as unknown as (
				reference: typeof ref,
				arguments_: Args
			) => Promise<Result>;
			return query(ref, args);
		}),
		(error) => (error instanceof Error ? error : new Error('The quiz service is unavailable.'))
	);

export const runMutation = <Args extends Record<string, unknown>, Result>(
	request: Request | undefined,
	ref: FunctionReference<'mutation', 'public', Args, Result>,
	args: Args
) =>
	ResultAsync.fromPromise(
		client(request).then((convex) => {
			if (!convex) throw new Error('Convex is not configured.');
			const mutation = convex.mutation.bind(convex) as unknown as (
				reference: typeof ref,
				arguments_: Args
			) => Promise<Result>;
			return mutation(ref, args);
		}),
		(error) => (error instanceof Error ? error : new Error('The quiz service is unavailable.'))
	);
