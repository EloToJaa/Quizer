import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { ConvexError } from 'convex/values';

export const MAX_QUIZZES_PER_OWNER = 200;
export const MAX_QUESTIONS = 100;
export const MAX_ANSWERS = 12;

type DatabaseCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
type AuthCtx = Pick<QueryCtx, 'auth'> | Pick<MutationCtx, 'auth'>;

export const fail = (code: string, message: string): never => {
	throw new ConvexError({ code, message });
};

export const requireIdentity = async (ctx: AuthCtx) => {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		return fail('UNAUTHENTICATED', 'Sign in to continue');
	}

	return identity;
};

export const requireOwnedQuiz = async (
	ctx: DatabaseCtx & AuthCtx,
	quizId: Id<'quizzes'>
): Promise<Doc<'quizzes'>> => {
	const identity = await requireIdentity(ctx);
	const quiz = await ctx.db.get('quizzes', quizId);
	if (!quiz) {
		return fail('NOT_FOUND', 'Quiz not found');
	}
	if (quiz.ownerId !== identity.tokenIdentifier) {
		return fail('FORBIDDEN', 'You do not own this quiz');
	}

	return quiz;
};

export const requireDraftQuiz = async (
	ctx: DatabaseCtx & AuthCtx,
	quizId: Id<'quizzes'>
): Promise<Doc<'quizzes'>> => {
	const quiz = await requireOwnedQuiz(ctx, quizId);
	if (quiz.status !== 'draft') {
		return fail('QUIZ_PUBLISHED', 'Unpublish the quiz before editing it');
	}

	return quiz;
};

export const requireQuestion = async (
	ctx: DatabaseCtx & AuthCtx,
	questionId: Id<'questions'>
): Promise<{ question: Doc<'questions'>; quiz: Doc<'quizzes'> }> => {
	const question = await ctx.db.get('questions', questionId);
	if (!question) {
		return fail('NOT_FOUND', 'Question not found');
	}
	const quiz = await requireDraftQuiz(ctx, question.quizId);

	return { question, quiz };
};

export const requireAnswer = async (
	ctx: DatabaseCtx & AuthCtx,
	answerId: Id<'answers'>
): Promise<{ answer: Doc<'answers'>; question: Doc<'questions'>; quiz: Doc<'quizzes'> }> => {
	const answer = await ctx.db.get('answers', answerId);
	if (!answer) {
		return fail('NOT_FOUND', 'Answer not found');
	}
	const { question, quiz } = await requireQuestion(ctx, answer.questionId);

	return { answer, question, quiz };
};

export const requiredText = (value: string, field: string, maxLength: number) => {
	const normalized = value.trim();
	if (!normalized) {
		return fail('VALIDATION', `${field} is required`);
	}
	if (normalized.length > maxLength) {
		return fail('VALIDATION', `${field} must be at most ${maxLength} characters`);
	}

	return normalized;
};

export const optionalText = (value: string | undefined, field: string, maxLength: number) => {
	if (value === undefined) {
		return undefined;
	}
	const normalized = value.trim();
	if (normalized.length > maxLength) {
		return fail('VALIDATION', `${field} must be at most ${maxLength} characters`);
	}

	return normalized || undefined;
};

export const validateMedia = (
	media:
		| { key: string; url: string; name: string; size: number; type?: string; alt?: string }
		| null
		| undefined
) => {
	if (media === undefined || media === null) {
		return media;
	}
	if (!media.key.trim() || !media.name.trim() || media.type?.trim() === '') {
		return fail('VALIDATION', 'Uploaded file metadata is incomplete');
	}
	if (!Number.isSafeInteger(media.size) || media.size <= 0) {
		return fail('VALIDATION', 'Uploaded file size is invalid');
	}
	const alt = optionalText(media.alt, 'Image description', 240);
	const key = media.key.trim();
	let url: URL;
	try {
		url = new URL(media.url);
	} catch {
		return fail('VALIDATION', 'Uploaded file URL is invalid');
	}
	const isUploadThingHost = url.hostname.endsWith('.ufs.sh') || url.hostname === 'utfs.io';
	let fileIdentifier: string;
	try {
		fileIdentifier = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? '');
	} catch {
		return fail('VALIDATION', 'Uploaded file URL is invalid');
	}
	if (
		url.protocol !== 'https:' ||
		!isUploadThingHost ||
		url.port ||
		url.username ||
		url.password ||
		fileIdentifier !== key
	) {
		return fail('VALIDATION', 'Uploaded file URL does not match its UploadThing key');
	}

	return {
		...media,
		key,
		name: media.name.trim(),
		type: media.type?.trim(),
		alt
	};
};

export const assertExactOrder = <T extends string>(provided: T[], existing: T[], field: string) => {
	if (provided.length !== existing.length || new Set(provided).size !== provided.length) {
		return fail('VALIDATION', `${field} must contain each item exactly once`);
	}
	const existingIds = new Set(existing);
	if (provided.some((id) => !existingIds.has(id))) {
		return fail('VALIDATION', `${field} contains an item from another parent`);
	}
};
