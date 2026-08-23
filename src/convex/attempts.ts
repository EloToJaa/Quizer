import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { MAX_ANSWERS, MAX_QUESTIONS, fail, requireOwnedQuiz } from './quizModel';

const responseValidator = v.object({
	questionId: v.id('questions'),
	answerId: v.id('answers')
});

export const submit = mutation({
	args: {
		quizId: v.id('quizzes'),
		responses: v.array(responseValidator)
	},
	handler: async (ctx, args) => {
		const quiz = await ctx.db.get('quizzes', args.quizId);
		if (!quiz || quiz.status !== 'published') {
			return fail('NOT_FOUND', 'Published quiz not found');
		}
		if (args.responses.length > MAX_QUESTIONS) {
			return fail('DATA_LIMIT', `A quiz can contain at most ${MAX_QUESTIONS} questions`);
		}

		const questions = await ctx.db
			.query('questions')
			.withIndex('by_quizId_and_position', (q) => q.eq('quizId', quiz._id))
			.take(MAX_QUESTIONS + 1);
		if (questions.length > MAX_QUESTIONS) {
			return fail('DATA_LIMIT', 'Quiz contains too many questions');
		}
		if (args.responses.length !== questions.length) {
			return fail('VALIDATION', 'Submit exactly one answer for every question');
		}

		const responseByQuestion = new Map(
			args.responses.map((response) => [response.questionId, response])
		);
		if (responseByQuestion.size !== questions.length) {
			return fail('VALIDATION', 'Submit exactly one answer for every question');
		}

		const results = [];
		for (const question of questions) {
			const response = responseByQuestion.get(question._id);
			if (!response) {
				return fail('VALIDATION', 'An answer is missing for a question');
			}
			const selected = await ctx.db.get('answers', response.answerId);
			if (!selected || selected.questionId !== question._id || selected.quizId !== quiz._id) {
				return fail('VALIDATION', 'An answer does not belong to its question');
			}
			const answers = await ctx.db
				.query('answers')
				.withIndex('by_questionId_and_position', (q) => q.eq('questionId', question._id))
				.take(MAX_ANSWERS + 1);
			const correctAnswers = answers.filter((answer) => answer.isCorrect);
			if (correctAnswers.length !== 1) {
				return fail('INVALID_QUIZ', 'The quiz has an invalid answer key');
			}
			results.push({
				questionId: question._id,
				answerId: selected._id,
				correct: selected.isCorrect,
				correctAnswerId: correctAnswers[0]._id,
				explanation: question.explanation
			});
		}

		const identity = await ctx.auth.getUserIdentity();
		const correctCount = results.filter((result) => result.correct).length;
		const totalQuestions = questions.length;
		const scorePercent =
			totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);
		if (!identity) {
			return {
				attemptId: null,
				correctCount,
				totalQuestions,
				scorePercent,
				results
			};
		}

		const submittedAt = Date.now();
		const attemptId = await ctx.db.insert('attempts', {
			quizId: quiz._id,
			participantId: identity.tokenIdentifier,
			correctCount,
			totalQuestions,
			scorePercent,
			submittedAt
		});
		for (const result of results) {
			await ctx.db.insert('attemptAnswers', {
				attemptId,
				quizId: quiz._id,
				questionId: result.questionId,
				answerId: result.answerId,
				isCorrect: result.correct,
				createdAt: submittedAt
			});
		}

		return { attemptId, correctCount, totalQuestions, scorePercent, results };
	}
});

export const listForQuiz = query({
	args: { quizId: v.id('quizzes') },
	handler: async (ctx, args) => {
		await requireOwnedQuiz(ctx, args.quizId);
		return await ctx.db
			.query('attempts')
			.withIndex('by_quizId_and_submittedAt', (q) => q.eq('quizId', args.quizId))
			.order('desc')
			.take(200);
	}
});
