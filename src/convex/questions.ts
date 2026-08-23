import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { mediaValidator } from './schema';
import {
	MAX_ANSWERS,
	MAX_QUESTIONS,
	assertExactOrder,
	fail,
	optionalText,
	requireDraftQuiz,
	requireQuestion,
	requiredText,
	validateMedia
} from './quizModel';

export const create = mutation({
	args: {
		quizId: v.id('quizzes'),
		prompt: v.string(),
		explanation: v.optional(v.string()),
		media: v.optional(mediaValidator)
	},
	handler: async (ctx, args) => {
		const quiz = await requireDraftQuiz(ctx, args.quizId);
		if (quiz.questionCount >= MAX_QUESTIONS) {
			return fail('DATA_LIMIT', `A quiz can contain at most ${MAX_QUESTIONS} questions`);
		}
		const now = Date.now();
		const questionId = await ctx.db.insert('questions', {
			quizId: args.quizId,
			prompt: requiredText(args.prompt, 'Question', 1_000),
			explanation: optionalText(args.explanation, 'Explanation', 2_000),
			media: validateMedia(args.media) ?? undefined,
			position: quiz.questionCount,
			answerCount: 0,
			createdAt: now,
			updatedAt: now
		});
		await ctx.db.patch('quizzes', args.quizId, {
			questionCount: quiz.questionCount + 1,
			updatedAt: now
		});
		return questionId;
	}
});

export const update = mutation({
	args: {
		questionId: v.id('questions'),
		prompt: v.optional(v.string()),
		explanation: v.optional(v.string()),
		media: v.optional(v.union(mediaValidator, v.null()))
	},
	handler: async (ctx, args) => {
		const { question } = await requireQuestion(ctx, args.questionId);
		const patch: {
			prompt?: string;
			explanation?: string;
			media?: Exclude<ReturnType<typeof validateMedia>, null>;
			updatedAt: number;
		} = { updatedAt: Date.now() };
		if (args.prompt !== undefined) patch.prompt = requiredText(args.prompt, 'Question', 1_000);
		if (args.explanation !== undefined) {
			patch.explanation = optionalText(args.explanation, 'Explanation', 2_000);
		}
		if (args.media !== undefined) patch.media = validateMedia(args.media) ?? undefined;

		await ctx.db.patch('questions', question._id, patch);
		await ctx.db.patch('quizzes', question.quizId, { updatedAt: Date.now() });
		return null;
	}
});

export const remove = mutation({
	args: { questionId: v.id('questions') },
	handler: async (ctx, args) => {
		const { question, quiz } = await requireQuestion(ctx, args.questionId);
		const answers = await ctx.db
			.query('answers')
			.withIndex('by_questionId_and_position', (q) => q.eq('questionId', args.questionId))
			.take(MAX_ANSWERS + 1);
		if (answers.length > MAX_ANSWERS) {
			return fail('DATA_LIMIT', 'Question contains too many answers to delete');
		}
		for (const answer of answers) await ctx.db.delete('answers', answer._id);
		await ctx.db.delete('questions', question._id);

		const following = await ctx.db
			.query('questions')
			.withIndex('by_quizId_and_position', (q) =>
				q.eq('quizId', quiz._id).gt('position', question.position)
			)
			.take(MAX_QUESTIONS);
		for (const item of following) {
			await ctx.db.patch('questions', item._id, { position: item.position - 1 });
		}
		await ctx.db.patch('quizzes', quiz._id, {
			questionCount: Math.max(0, quiz.questionCount - 1),
			updatedAt: Date.now()
		});
		return null;
	}
});

export const reorder = mutation({
	args: { quizId: v.id('quizzes'), questionIds: v.array(v.id('questions')) },
	handler: async (ctx, args) => {
		await requireDraftQuiz(ctx, args.quizId);
		if (args.questionIds.length > MAX_QUESTIONS) {
			return fail('DATA_LIMIT', `A quiz can contain at most ${MAX_QUESTIONS} questions`);
		}
		const questions = await ctx.db
			.query('questions')
			.withIndex('by_quizId_and_position', (q) => q.eq('quizId', args.quizId))
			.take(MAX_QUESTIONS + 1);
		assertExactOrder(
			args.questionIds,
			questions.map((question) => question._id),
			'questionIds'
		);
		for (const [position, questionId] of args.questionIds.entries()) {
			await ctx.db.patch('questions', questionId, { position, updatedAt: Date.now() });
		}
		await ctx.db.patch('quizzes', args.quizId, { updatedAt: Date.now() });
		return null;
	}
});
