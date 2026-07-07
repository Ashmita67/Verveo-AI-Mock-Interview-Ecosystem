from uuid import UUID

from pydantic import Field

from app.core.enums import InterviewDifficultyEnum, InterviewDomainEnum, InterviewSourceEnum, InterviewTypeEnum
from app.schemas.base import SchemaBase
from app.schemas.interview import InterviewDetailResponse
from app.schemas.question import QuestionRead
from app.schemas.response import ResponseRead


class InterviewStartRequest(SchemaBase):
    title: str
    domain: InterviewDomainEnum
    difficulty: InterviewDifficultyEnum
    type: InterviewTypeEnum
    interview_mode: str = Field(pattern="^(text|audio|video)$")
    interview_source: InterviewSourceEnum = InterviewSourceEnum.GENERIC
    resume_id: UUID | None = None


class InterviewStartResponse(SchemaBase):
    interview_id: UUID
    interview: InterviewDetailResponse
    interview_mode: str
    interview_source: InterviewSourceEnum
    resume_id: UUID | None
    question: QuestionRead
    questions: list[QuestionRead]


class TextEvaluationRequest(SchemaBase):
    interview_id: UUID
    question_id: UUID
    answer_text: str


class AudioEvaluationResponse(SchemaBase):
    transcript: str
    score: int
    strengths: list[str]
    weaknesses: list[str]
    missing_concepts: list[str]
    ideal_answer: str


class VideoEvaluationResponse(SchemaBase):
    transcript: str
    score: int
    confidence_metrics: dict
    strengths: list[str]
    weaknesses: list[str]
    missing_concepts: list[str]
    ideal_answer: str


class EvaluationResponsePayload(SchemaBase):
    score: int
    strengths: list[str]
    weaknesses: list[str]
    missing_concepts: list[str]
    ideal_answer: str
    response: ResponseRead


class NextQuestionRequest(SchemaBase):
    interview_id: UUID
    difficulty: InterviewDifficultyEnum


class NextQuestionResponse(SchemaBase):
    question: dict


class SkipQuestionRequest(SchemaBase):
    interview_id: UUID
    question_id: UUID


class CompleteInterviewRequest(SchemaBase):
    interview_id: UUID


class ReportGenerationRequest(SchemaBase):
    interview_id: UUID


class AnalyticsOverviewResponse(SchemaBase):
    interview_history_count: int
    average_score: float
    best_score: int
    strongest_skills: list[str]
    weakest_skills: list[str]
    strongest_domains: list[str]
    weakest_domains: list[str]
    recent_interview_history: list[dict]
    score_progression: list[dict]


class AnalyticsInterviewsResponse(SchemaBase):
    interviews: list[dict]


class AnalyticsSkillsResponse(SchemaBase):
    strongest_skills: list[str]
    weakest_skills: list[str]
