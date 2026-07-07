from datetime import datetime
from uuid import UUID

from app.schemas.base import IDSchema, SchemaBase, TimestampSchema


class ReportRead(IDSchema, TimestampSchema):
    interview_id: UUID
    user_id: UUID
    overall_score: int | None
    technical_score: int | None
    communication_score: int | None
    problem_solving_score: int | None
    strengths: str | None
    weaknesses: str | None
    recommendations: str | None
    generated_at: datetime
