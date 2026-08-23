// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');
const ownerIdentity = { tokenIdentifier: 'https://auth.example.test|owner' };
const otherIdentity = { tokenIdentifier: 'https://auth.example.test|other' };

const createValidQuiz = async () => {
	const t = convexTest(schema, modules);
	const owner = t.withIdentity(ownerIdentity);
	const quizId = await owner.mutation(api.quizzes.create, {
		title: 'Space facts',
		description: 'A short astronomy quiz',
		cover: {
			key: 'cover-key',
			url: 'https://utfs.io/f/cover-key',
			name: 'cover.webp',
			size: 1024,
			alt: '  A field of stars  '
		}
	});
	const questionId = await owner.mutation(api.questions.create, {
		quizId,
		prompt: 'Which planet is closest to the Sun?',
		explanation: 'Mercury has the smallest orbit around the Sun.'
	});
	const correctAnswerId = await owner.mutation(api.answers.create, {
		questionId,
		text: 'Mercury',
		isCorrect: true,
		media: {
			key: 'mercury-key',
			url: 'https://utfs.io/f/mercury-key',
			name: 'mercury.png',
			size: 512
		}
	});
	const wrongAnswerId = await owner.mutation(api.answers.create, {
		questionId,
		text: 'Venus',
		isCorrect: false
	});

	return { t, owner, quizId, questionId, correctAnswerId, wrongAnswerId };
};

describe('quiz authoring', () => {
	test('requires authentication to create and normalizes input', async () => {
		const t = convexTest(schema, modules);
		await expect(t.mutation(api.quizzes.create, { title: 'Quiz' })).rejects.toThrow(
			'Sign in to continue'
		);

		const owner = t.withIdentity(ownerIdentity);
		const quizId = await owner.mutation(api.quizzes.create, {
			title: '  My Quiz  ',
			description: '   '
		});
		const result = await owner.query(api.quizzes.getMine, { quizId });

		expect(result?.quiz).toMatchObject({
			title: 'My Quiz',
			status: 'draft',
			questionCount: 0
		});
		expect(result?.quiz.slug).toMatch(/^my-quiz-[a-f0-9]{8}$/);
		expect(result?.quiz.description).toBeUndefined();
	});

	test('enforces ownership for reads and writes', async () => {
		const { t, quizId } = await createValidQuiz();
		const other = t.withIdentity(otherIdentity);

		await expect(other.query(api.quizzes.getMine, { quizId })).rejects.toThrow(
			'You do not own this quiz'
		);
		await expect(other.mutation(api.quizzes.update, { quizId, title: 'Stolen' })).rejects.toThrow(
			'You do not own this quiz'
		);
	});

	test('creates nested questions and answers with media and supports exact reordering', async () => {
		const { owner, quizId, questionId, correctAnswerId, wrongAnswerId } = await createValidQuiz();
		await owner.mutation(api.answers.reorder, {
			questionId,
			answerIds: [wrongAnswerId, correctAnswerId]
		});
		const result = await owner.query(api.quizzes.getMine, { quizId });

		expect(result?.quiz.cover).toMatchObject({
			key: 'cover-key',
			size: 1024,
			alt: 'A field of stars'
		});
		expect(result?.questions).toHaveLength(1);
		expect(result?.questions[0].answers.map((answer) => answer._id)).toEqual([
			wrongAnswerId,
			correctAnswerId
		]);
		expect(result?.questions[0].answers[1]).toMatchObject({
			isCorrect: true,
			media: { key: 'mercury-key' }
		});
		await expect(
			owner.mutation(api.quizzes.update, {
				quizId,
				cover: {
					key: 'tracking-pixel',
					url: 'https://tracker.example/f/tracking-pixel',
					name: 'pixel.gif',
					size: 1
				}
			})
		).rejects.toThrow('Uploaded file URL');

		await expect(
			owner.mutation(api.answers.reorder, {
				questionId,
				answerIds: [correctAnswerId, correctAnswerId]
			})
		).rejects.toThrow('must contain each item exactly once');
	});

	test('validates answer keys before publishing and hides them from public reads', async () => {
		const t = convexTest(schema, modules);
		const owner = t.withIdentity(ownerIdentity);
		const emptyQuizId = await owner.mutation(api.quizzes.create, { title: 'Empty' });
		await expect(owner.mutation(api.quizzes.publish, { quizId: emptyQuizId })).rejects.toThrow(
			'Add at least one question'
		);

		const questionId = await owner.mutation(api.questions.create, {
			quizId: emptyQuizId,
			prompt: 'Two plus two?'
		});
		const correctAnswerId = await owner.mutation(api.answers.create, {
			questionId,
			text: 'Four',
			isCorrect: false
		});
		await owner.mutation(api.answers.create, {
			questionId,
			text: 'Five',
			isCorrect: false
		});
		await expect(owner.mutation(api.quizzes.publish, { quizId: emptyQuizId })).rejects.toThrow(
			'exactly one correct answer'
		);
		await owner.mutation(api.answers.setCorrect, { questionId, answerId: correctAnswerId });
		const answerKey = await owner.query(api.quizzes.getMine, { quizId: emptyQuizId });
		expect(answerKey?.questions[0].answers.filter((answer) => answer.isCorrect)).toHaveLength(1);

		const otherQuizId = await owner.mutation(api.quizzes.create, { title: 'Other quiz' });
		const otherQuestionId = await owner.mutation(api.questions.create, {
			quizId: otherQuizId,
			prompt: 'Other question'
		});
		const otherAnswerId = await owner.mutation(api.answers.create, {
			questionId: otherQuestionId,
			text: 'Other answer',
			isCorrect: false
		});
		await expect(
			owner.mutation(api.answers.setCorrect, { questionId, answerId: otherAnswerId })
		).rejects.toThrow('Answer does not belong to this question');

		const published = await owner.mutation(api.quizzes.publish, { quizId: emptyQuizId });
		const publicQuiz = await t.query(api.quizzes.getPublishedBySlug, {
			slug: published.slug
		});

		expect(publicQuiz?.quiz).not.toHaveProperty('ownerId');
		expect(publicQuiz?.questions[0]).not.toHaveProperty('explanation');
		expect(publicQuiz?.questions[0].answers[0]).not.toHaveProperty('isCorrect');
		expect(publicQuiz?.questions[0].answers[1]).not.toHaveProperty('isCorrect');
		await expect(
			owner.mutation(api.questions.update, { questionId, prompt: 'Changed' })
		).rejects.toThrow('Unpublish the quiz before editing it');
	});
});

describe('quiz scoring', () => {
	test('scores anonymous attempts without storage and persists authenticated attempts', async () => {
		const { t, owner, quizId, questionId, correctAnswerId } = await createValidQuiz();
		await owner.mutation(api.quizzes.publish, { quizId });

		const anonymousResult = await t.mutation(api.attempts.submit, {
			quizId,
			responses: [{ questionId, answerId: correctAnswerId }]
		});
		expect(anonymousResult).toMatchObject({
			attemptId: null,
			correctCount: 1,
			totalQuestions: 1,
			scorePercent: 100
		});
		expect(anonymousResult.results).toEqual([
			{
				questionId,
				answerId: correctAnswerId,
				correct: true,
				correctAnswerId,
				explanation: 'Mercury has the smallest orbit around the Sun.'
			}
		]);
		expect(await owner.query(api.attempts.listForQuiz, { quizId })).toHaveLength(0);

		const participant = t.withIdentity({
			tokenIdentifier: 'https://auth.example.test|participant'
		});
		const authenticatedResult = await participant.mutation(api.attempts.submit, {
			quizId,
			responses: [{ questionId, answerId: correctAnswerId }]
		});
		const attempts = await owner.query(api.attempts.listForQuiz, { quizId });

		expect(authenticatedResult.attemptId).not.toBeNull();
		expect(attempts).toHaveLength(1);
		expect(attempts[0]).toMatchObject({ correctCount: 1, scorePercent: 100 });
	});

	test('rejects incomplete and cross-question responses', async () => {
		const { t, owner, quizId, questionId, wrongAnswerId } = await createValidQuiz();
		const secondQuestionId = await owner.mutation(api.questions.create, {
			quizId,
			prompt: 'Which object is a star?'
		});
		const sunId = await owner.mutation(api.answers.create, {
			questionId: secondQuestionId,
			text: 'The Sun',
			isCorrect: true
		});
		await owner.mutation(api.answers.create, {
			questionId: secondQuestionId,
			text: 'The Moon',
			isCorrect: false
		});
		await owner.mutation(api.quizzes.publish, { quizId });

		await expect(
			t.mutation(api.attempts.submit, {
				quizId,
				responses: [{ questionId, answerId: wrongAnswerId }]
			})
		).rejects.toThrow('Submit exactly one answer for every question');
		await expect(
			t.mutation(api.attempts.submit, {
				quizId,
				responses: [
					{ questionId, answerId: sunId },
					{ questionId: secondQuestionId, answerId: wrongAnswerId }
				]
			})
		).rejects.toThrow('does not belong to its question');
	});

	test('does not score unpublished quizzes', async () => {
		const { t, quizId, questionId, correctAnswerId } = await createValidQuiz();

		await expect(
			t.mutation(api.attempts.submit, {
				quizId,
				responses: [{ questionId, answerId: correctAnswerId }]
			})
		).rejects.toThrow('Published quiz not found');
	});
});

// Ensures helper signatures remain tied to Convex IDs rather than plain strings.
const _quizIdTypeCheck: Id<'quizzes'> | undefined = undefined;
void _quizIdTypeCheck;
