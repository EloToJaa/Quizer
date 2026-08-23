import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { mediaValidator } from './schema';
import {
	MAX_ANSWERS,
	assertExactOrder,
	fail,
	requireAnswer,
	requireQuestion,
	requiredText,
	validateMedia
} from './quizModel';

export const create = mutation({
	args: {
		questionId: v.id('questions'),
		text: v.string(),
		isCorrect: v.boolean(),
		media: v.optional(mediaValidator)
	},
	handler: async (ctx, args) => {
		const { question, quiz } = await requireQuestion(ctx, args.questionId);
		if (question.answerCount >= MAX_ANSWERS) {
			return fail('DATA_LIMIT', `A question can contain at most ${MAX_ANSWERS} answers`);
		}
		const now = Date.now();
		const answerId = await ctx.db.insert('answers', {
			quizId: quiz._id,
			questionId: question._id,
			text: requiredText(args.text, 'Answer', 500),
			isCorrect: args.isCorrect,
			media: validateMedia(args.media) ?? undefined,
			position: question.answerCount,
			createdAt: now,
			updatedAt: now
		});
		await ctx.db.patch('questions', question._id, {
			answerCount: question.answerCount + 1,
			updatedAt: now
		});
		await ctx.db.patch('quizzes', quiz._id, { updatedAt: now });
		return answerId;
	}
});

export const update = mutation({
	args: {
		answerId: v.id('answers'),
		text: v.optional(v.string()),
		isCorrect: v.optional(v.boolean()),
		media: v.optional(v.union(mediaValidator, v.null()))
	},
	handler: async (ctx, args) => {
		const { answer, quiz } = await requireAnswer(ctx, args.answerId);
		const patch: {
			text?: string;
			isCorrect?: boolean;
			media?: Exclude<ReturnType<typeof validateMedia>, null>;
			updatedAt: number;
		} = { updatedAt: Date.now() };
		if (args.text !== undefined) patch.text = requiredText(args.text, 'Answer', 500);
		if (args.isCorrect !== undefined) patch.isCorrect = args.isCorrect;
		if (args.media !== undefined) patch.media = validateMedia(args.media) ?? undefined;

		await ctx.db.patch('answers', answer._id, patch);
		await ctx.db.patch('quizzes', quiz._id, { updatedAt: Date.now() });
		return null;
	}
});

export const setCorrect = mutation({
	args: {
		questionId: v.id('questions'),
		answerId: v.id('answers')
	},
	handler: async (ctx, args) => {
		const { question, quiz } = await requireQuestion(ctx, args.questionId);
		const selectedAnswer = await ctx.db.get('answers', args.answerId);
		if (!selectedAnswer || selectedAnswer.questionId !== question._id) {
			return fail('VALIDATION', 'Answer does not belong to this question');
		}

		const answers = await ctx.db
			.query('answers')
			.withIndex('by_questionId_and_position', (q) => q.eq('questionId', question._id))
			.take(MAX_ANSWERS + 1);
		if (answers.length > MAX_ANSWERS) {
			return fail('DATA_LIMIT', `A question can contain at most ${MAX_ANSWERS} answers`);
		}

		const now = Date.now();
		for (const answer of answers) {
			const isCorrect = answer._id === selectedAnswer._id;
			if (answer.isCorrect === isCorrect) continue;
			await ctx.db.patch('answers', answer._id, { isCorrect, updatedAt: now });
		}
		await ctx.db.patch('questions', question._id, { updatedAt: now });
		await ctx.db.patch('quizzes', quiz._id, { updatedAt: now });
		return null;
	}
});

export const remove = mutation({
	args: { answerId: v.id('answers') },
	handler: async (ctx, args) => {
		const { answer, question, quiz } = await requireAnswer(ctx, args.answerId);
		await ctx.db.delete('answers', answer._id);
		const following = await ctx.db
			.query('answers')
			.withIndex('by_questionId_and_position', (q) =>
				q.eq('questionId', question._id).gt('position', answer.position)
			)
			.take(MAX_ANSWERS);
		for (const item of following) {
			await ctx.db.patch('answers', item._id, { position: item.position - 1 });
		}
		await ctx.db.patch('questions', question._id, {
			answerCount: Math.max(0, question.answerCount - 1),
			updatedAt: Date.now()
		});
		await ctx.db.patch('quizzes', quiz._id, { updatedAt: Date.now() });
		return null;
	}
});

export const reorder = mutation({
	args: { questionId: v.id('questions'), answerIds: v.array(v.id('answers')) },
	handler: async (ctx, args) => {
		const { question, quiz } = await requireQuestion(ctx, args.questionId);
		if (args.answerIds.length > MAX_ANSWERS) {
			return fail('DATA_LIMIT', `A question can contain at most ${MAX_ANSWERS} answers`);
		}
		const answers = await ctx.db
			.query('answers')
			.withIndex('by_questionId_and_position', (q) => q.eq('questionId', question._id))
			.take(MAX_ANSWERS + 1);
		assertExactOrder(
			args.answerIds,
			answers.map((answer) => answer._id),
			'answerIds'
		);
		for (const [position, answerId] of args.answerIds.entries()) {
			await ctx.db.patch('answers', answerId, { position, updatedAt: Date.now() });
		}
		await ctx.db.patch('quizzes', quiz._id, { updatedAt: Date.now() });
		return null;
	}
});
