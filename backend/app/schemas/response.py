from datetime import datetime
from uuid import UUID

from app.schemas.base import IDSchema, SchemaBase


class ResponseRead(IDSchema):
    interview_id: UUID
    question_id: UUID
    answer_type: str
    answer_text: str | None
    transcript: str | None
    audio_path: str | None
    video_path: str | None
    score: int | None
    feedback: str | None
    ideal_answer: str | None
    is_skipped: bool
    created_at: datetime
