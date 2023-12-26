﻿namespace Quizer.Contracts.Quiz;

public record QuizResponse(
    string Id,
    string UserId,
    string UserName,
    string Name,
    string Slug,
    string Description,
    double AverageRating,
    int NumberOfRatings,
    IReadOnlyList<QuestionResponse> Questions
    );

public record QuestionResponse(
    string Id,
    string Question,
    string Answer
    );
