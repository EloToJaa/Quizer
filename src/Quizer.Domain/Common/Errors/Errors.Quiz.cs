﻿using ErrorOr;

namespace Quizer.Domain.Common.Errors
{
    public static partial class Errors
    {
        public static class Quiz
        {
            public static Error NotFound => Error.NotFound(
                code: "Quiz.NotFound",
                description: "Quiz was not found");
        }
    }
}
