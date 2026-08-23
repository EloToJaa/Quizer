import { env as publicEnv } from '$env/dynamic/public';
import { getAuthSession } from '$lib/server/auth';
import { createUploadthing, UploadThingError, type FileRouter } from 'uploadthing/server';

const createFileRoute = createUploadthing();

export const requireUploadUser = async (
	request: Request,
	convexSiteUrl: string | undefined,
	readSession: typeof getAuthSession = getAuthSession
) => {
	const authSession = await readSession(request, convexSiteUrl);

	if (!authSession?.user?.id) {
		throw new UploadThingError({
			code: 'FORBIDDEN',
			message: 'You must be signed in to upload images.'
		});
	}

	return { userId: authSession.user.id };
};

const authenticatedImageRoute = () =>
	createFileRoute({
		image: {
			maxFileSize: '4MB',
			maxFileCount: 1
		}
	})
		.middleware(({ req }) => requireUploadUser(req, publicEnv.PUBLIC_CONVEX_SITE_URL))
		.onUploadComplete(({ file }) => ({
			key: file.key,
			url: file.ufsUrl,
			name: file.name,
			size: file.size
		}));

export const uploadRouter = {
	quizImage: authenticatedImageRoute(),
	answerImage: authenticatedImageRoute()
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
