import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { mediaValidator } from './schema';
import type { Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import {
	MAX_ANSWERS,
	MAX_QUESTIONS,
	MAX_QUIZZES_PER_OWNER,
	fail,
	optionalText,
	requireDraftQuiz,
	requireIdentity,
	requireOwnedQuiz,
	requiredText,
	validateMedia
} from './quizModel';

const nestedQuiz = async (ctx: QueryCtx, quizId: Id<'quizzes'>) => {
	const quiz = await ctx.db.get('quizzes', quizId);
	if (!quiz) {
		return null;
	}
	const questions = await ctx.db
		.query('questions')
		.withIndex('by_quizId_and_position', (q) => q.eq('quizId', quiz._id))
		.take(MAX_QUESTIONS + 1);
	if (questions.length > MAX_QUESTIONS) {
		return fail('DATA_LIMIT', 'Quiz contains too many questions');
	}

	return {
		quiz,
		questions: await Promise.all(
			questions.map(async (question) => ({
				...question,
				answers: await ctx.db
					.query('answers')
					.withIndex('by_questionId_and_position', (q) => q.eq('questionId', question._id))
					.take(MAX_ANSWERS + 1)
			}))
		)
	};
};

const playQuiz = async (ctx: QueryCtx, quizId: Id<'quizzes'>) => {
	const result = await nestedQuiz(ctx, quizId);
	if (!result || result.quiz.status !== 'published') {
		return null;
	}
	const quiz = result.quiz;

	return {
		quiz: {
			_id: quiz._id,
			_creationTime: quiz._creationTime,
			slug: quiz.slug,
			title: quiz.title,
			description: quiz.description,
			cover: quiz.cover,
			questionCount: quiz.questionCount,
			createdAt: quiz.createdAt,
			updatedAt: quiz.updatedAt,
			publishedAt: quiz.publishedAt
		},
		questions: result.questions.map((question) => {
			return {
				_id: question._id,
				_creationTime: question._creationTime,
				quizId: question.quizId,
				prompt: question.prompt,
				media: question.media,
				position: question.position,
				createdAt: question.createdAt,
				updatedAt: question.updatedAt,
				answers: question.answers.map((answer) => ({
					_id: answer._id,
					_creationTime: answer._creationTime,
					questionId: answer.questionId,
					text: answer.text,
					media: answer.media,
					position: answer.position,
					createdAt: answer.createdAt,
					updatedAt: answer.updatedAt
				}))
			};
		})
	};
};

export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx);
		return await ctx.db
			.query('quizzes')
			.withIndex('by_ownerId_and_updatedAt', (q) => q.eq('ownerId', identity.tokenIdentifier))
			.order('desc')
			.take(MAX_QUIZZES_PER_OWNER);
	}
});

export const getMine = query({
	args: { quizId: v.id('quizzes') },
	handler: async (ctx, args) => {
		await requireOwnedQuiz(ctx, args.quizId);
		return await nestedQuiz(ctx, args.quizId);
	}
});

export const getPublished = query({
	args: { quizId: v.id('quizzes') },
	handler: async (ctx, args) => await playQuiz(ctx, args.quizId)
});

export const getPublishedBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const quiz = await ctx.db
			.query('quizzes')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.unique();
		if (!quiz) {
			return null;
		}

		return await playQuiz(ctx, quiz._id);
	}
});

export const create = mutation({
	args: {
		title: v.string(),
		description: v.optional(v.string()),
		cover: v.optional(mediaValidator)
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const existing = await ctx.db
			.query('quizzes')
			.withIndex('by_ownerId_and_updatedAt', (q) => q.eq('ownerId', identity.tokenIdentifier))
			.take(MAX_QUIZZES_PER_OWNER + 1);
		if (existing.length >= MAX_QUIZZES_PER_OWNER) {
			return fail('DATA_LIMIT', `You can create at most ${MAX_QUIZZES_PER_OWNER} quizzes`);
		}

		const title = requiredText(args.title, 'Title', 120);
		const baseSlug =
			title
				.toLowerCase()
				.normalize('NFKD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '')
				.slice(0, 48) || 'quiz';
		const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
		const now = Date.now();

		return await ctx.db.insert('quizzes', {
			ownerId: identity.tokenIdentifier,
			slug,
			title,
			description: optionalText(args.description, 'Description', 2_000),
			cover: validateMedia(args.cover) ?? undefined,
			status: 'draft',
			questionCount: 0,
			createdAt: now,
			updatedAt: now
		});
	}
});

export const update = mutation({
	args: {
		quizId: v.id('quizzes'),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		cover: v.optional(v.union(mediaValidator, v.null()))
	},
	handler: async (ctx, args) => {
		await requireDraftQuiz(ctx, args.quizId);
		const patch: {
			title?: string;
			description?: string;
			cover?: Exclude<ReturnType<typeof validateMedia>, null>;
			updatedAt: number;
		} = { updatedAt: Date.now() };
		if (args.title !== undefined) patch.title = requiredText(args.title, 'Title', 120);
		if (args.description !== undefined) {
			patch.description = optionalText(args.description, 'Description', 2_000);
		}
		if (args.cover !== undefined) patch.cover = validateMedia(args.cover) ?? undefined;

		await ctx.db.patch('quizzes', args.quizId, patch);
		return null;
	}
});

export const remove = mutation({
	args: { quizId: v.id('quizzes') },
	handler: async (ctx, args) => {
		await requireDraftQuiz(ctx, args.quizId);
		const existingAttempt = await ctx.db
			.query('attempts')
			.withIndex('by_quizId_and_submittedAt', (q) => q.eq('quizId', args.quizId))
			.first();
		if (existingAttempt) {
			return fail('QUIZ_HAS_ATTEMPTS', 'A quiz with submitted attempts cannot be deleted');
		}
		const questions = await ctx.db
			.query('questions')
			.withIndex('by_quizId_and_position', (q) => q.eq('quizId', args.quizId))
			.take(MAX_QUESTIONS + 1);
		const answers = await ctx.db
			.query('answers')
			.withIndex('by_quizId_and_position', (q) => q.eq('quizId', args.quizId))
			.take(MAX_QUESTIONS * MAX_ANSWERS + 1);
		if (questions.length > MAX_QUESTIONS || answers.length > MAX_QUESTIONS * MAX_ANSWERS) {
			return fail('DATA_LIMIT', 'Quiz is too large to delete in one operation');
		}
		for (const answer of answers) await ctx.db.delete('answers', answer._id);
		for (const question of questions) await ctx.db.delete('questions', question._id);
		await ctx.db.delete('quizzes', args.quizId);
		return null;
	}
});

export const publish = mutation({
	args: { quizId: v.id('quizzes') },
	handler: async (ctx, args) => {
		const quiz = await requireDraftQuiz(ctx, args.quizId);
		const questions = await ctx.db
			.query('questions')
			.withIndex('by_quizId_and_position', (q) => q.eq('quizId', args.quizId))
			.take(MAX_QUESTIONS + 1);
		if (!questions.length) {
			return fail('VALIDATION', 'Add at least one question before publishing');
		}
		if (questions.length > MAX_QUESTIONS) {
			return fail('DATA_LIMIT', 'Quiz contains too many questions');
		}
		for (const question of questions) {
			const answers = await ctx.db
				.query('answers')
				.withIndex('by_questionId_and_position', (q) => q.eq('questionId', question._id))
				.take(MAX_ANSWERS + 1);
			if (answers.length < 2) {
				return fail('VALIDATION', 'Every question needs at least two answers');
			}
			if (answers.length > MAX_ANSWERS) {
				return fail('DATA_LIMIT', 'A question contains too many answers');
			}
			if (answers.filter((answer) => answer.isCorrect).length !== 1) {
				return fail('VALIDATION', 'Every question needs exactly one correct answer');
			}
		}

		const now = Date.now();
		await ctx.db.patch('quizzes', args.quizId, {
			status: 'published',
			publishedAt: now,
			updatedAt: now
		});
		return { quizId: quiz._id, slug: quiz.slug };
	}
});

export const unpublish = mutation({
	args: { quizId: v.id('quizzes') },
	handler: async (ctx, args) => {
		const quiz = await requireOwnedQuiz(ctx, args.quizId);
		if (quiz.status === 'draft') {
			return null;
		}
		await ctx.db.patch('quizzes', args.quizId, {
			status: 'draft',
			publishedAt: undefined,
			updatedAt: Date.now()
		});
		return null;
	}
});
