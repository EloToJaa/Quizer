export type UploadMedia = {
	key: string;
	url: string;
	name: string;
	size: number;
	type?: string;
	alt?: string;
};

export type Answer = {
	_id: string;
	text: string;
	position: number;
	isCorrect: boolean;
	media?: UploadMedia;
};

export type Question = {
	_id: string;
	prompt: string;
	explanation?: string;
	position: number;
	media?: UploadMedia;
	answers: Answer[];
};

export type QuizSummary = {
	_id: string;
	title: string;
	slug: string;
	description?: string;
	cover?: UploadMedia;
	status: 'draft' | 'published';
	questionCount: number;
	updatedAt: number;
};

export type EditableQuiz = QuizSummary & { questions: Question[] };

export type PublishedQuiz = {
	quiz: Pick<QuizSummary, '_id' | 'title' | 'slug' | 'description' | 'cover' | 'questionCount'>;
	questions: Array<Omit<Question, 'answers'> & { answers: Array<Omit<Answer, 'isCorrect'>> }>;
};

export type AttemptResult = {
	attemptId: string | null;
	correctCount: number;
	totalQuestions: number;
	scorePercent: number;
	results: Array<{
		questionId: string;
		answerId: string;
		correct: boolean;
		correctAnswerId: string;
		explanation?: string;
	}>;
};
