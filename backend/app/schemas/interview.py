from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.core.enums import InterviewDifficultyEnum, InterviewDomainEnum, InterviewSourceEnum, InterviewStatusEnum, InterviewTypeEnum
from app.schemas.base import IDSchema, SchemaBase, TimestampSchema
from app.schemas.question import QuestionRead
from app.schemas.response import ResponseRead
from app.schemas.resume import ResumeRead


class InterviewCreate(SchemaBase):
    title: str
    domain: InterviewDomainEnum
    difficulty: InterviewDifficultyEnum
    type: InterviewTypeEnum


class InterviewUpdate(SchemaBase):
    title: str | None = None
    domain: InterviewDomainEnum | None = None
    difficulty: InterviewDifficultyEnum | None = None
    type: InterviewTypeEnum | None = None
    interview_source: InterviewSourceEnum | None = None
    interview_mode: str | None = None
    resume_id: UUID | None = None
    current_question_index: int | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    status: InterviewStatusEnum | None = None
    overall_score: int | None = None


class InterviewRead(IDSchema, TimestampSchema):
    user_id: UUID
    title: str
    domain: InterviewDomainEnum
    difficulty: InterviewDifficultyEnum
    type: InterviewTypeEnum
    interview_source: InterviewSourceEnum
    interview_mode: str | None
    resume_id: UUID | None
    current_question_index: int
    started_at: datetime | None
    ended_at: datetime | None
    status: InterviewStatusEnum
    overall_score: int | None
    completed_at: datetime | None


class InterviewListResponse(SchemaBase):
    items: list[InterviewRead]


class InterviewDetailResponse(InterviewRead):
    resume: ResumeRead | None = None
    questions: list[QuestionRead] = Field(default_factory=list)
    responses: list[ResponseRead] = Field(default_factory=list)
