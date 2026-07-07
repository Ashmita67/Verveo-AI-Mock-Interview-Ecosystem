from app.core.enums import InterviewDifficultyEnum


class AdaptiveInterviewService:
    difficulty_order = [
        InterviewDifficultyEnum.EASY.value,
        InterviewDifficultyEnum.MEDIUM.value,
        InterviewDifficultyEnum.HARD.value,
    ]

    def adjust_difficulty(self, current_difficulty: str, score: int | None) -> str:
        if score is None:
            return current_difficulty
        index = self.difficulty_order.index(current_difficulty) if current_difficulty in self.difficulty_order else 1
        if score >= 80 and index < len(self.difficulty_order) - 1:
            return self.difficulty_order[index + 1]
        if score <= 50 and index > 0:
            return self.difficulty_order[index - 1]
        return current_difficulty
