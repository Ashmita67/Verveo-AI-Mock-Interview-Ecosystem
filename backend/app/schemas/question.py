from uuid import UUID

from app.core.enums import InterviewDifficultyEnum, QuestionGeneratedByEnum
from app.schemas.base import IDSchema, SchemaBase, TimestampSchema


class QuestionRead(IDSchema, TimestampSchema):
    interview_id: UUID
    question_text: str
    question_type: str
    difficulty: InterviewDifficultyEnum
    generated_by: QuestionGeneratedByEnum
    question_order: int
