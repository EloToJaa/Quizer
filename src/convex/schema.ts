import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const mediaValidator = v.object({
	key: v.string(),
	url: v.string(),
	name: v.string(),
	size: v.number(),
	type: v.optional(v.string()),
	alt: v.optional(v.string())
});

export default defineSchema({
	quizzes: defineTable({
		ownerId: v.string(),
		slug: v.string(),
		title: v.string(),
		description: v.optional(v.string()),
		cover: v.optional(mediaValidator),
		status: v.union(v.literal('draft'), v.literal('published')),
		questionCount: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
		publishedAt: v.optional(v.number())
	})
		.index('by_ownerId_and_updatedAt', ['ownerId', 'updatedAt'])
		.index('by_slug', ['slug'])
		.index('by_status_and_publishedAt', ['status', 'publishedAt']),
	questions: defineTable({
		quizId: v.id('quizzes'),
		prompt: v.string(),
		explanation: v.optional(v.string()),
		media: v.optional(mediaValidator),
		position: v.number(),
		answerCount: v.number(),
		createdAt: v.number(),
		updatedAt: v.number()
	}).index('by_quizId_and_position', ['quizId', 'position']),
	answers: defineTable({
		quizId: v.id('quizzes'),
		questionId: v.id('questions'),
		text: v.string(),
		isCorrect: v.boolean(),
		media: v.optional(mediaValidator),
		position: v.number(),
		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index('by_quizId_and_position', ['quizId', 'position'])
		.index('by_questionId_and_position', ['questionId', 'position']),
	attempts: defineTable({
		quizId: v.id('quizzes'),
		participantId: v.optional(v.string()),
		correctCount: v.number(),
		totalQuestions: v.number(),
		scorePercent: v.number(),
		submittedAt: v.number()
	})
		.index('by_quizId_and_submittedAt', ['quizId', 'submittedAt'])
		.index('by_participantId_and_submittedAt', ['participantId', 'submittedAt']),
	attemptAnswers: defineTable({
		attemptId: v.id('attempts'),
		quizId: v.id('quizzes'),
		questionId: v.id('questions'),
		answerId: v.id('answers'),
		isCorrect: v.boolean(),
		createdAt: v.number()
	})
		.index('by_attemptId_and_questionId', ['attemptId', 'questionId'])
		.index('by_quizId_and_createdAt', ['quizId', 'createdAt'])
});
