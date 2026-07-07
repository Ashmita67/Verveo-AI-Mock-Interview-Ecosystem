import json
from datetime import datetime, timezone
from uuid import UUID

from app.ai.gemini_service import GeminiService
from app.core.exceptions import NotFoundException
from app.models.report import Report
from app.prompts.templates import REPORT_GENERATION_PROMPT
from app.repositories.interview_repository import InterviewRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.response_repository import ResponseRepository


class ReportGenerationService:
    def __init__(
        self,
        interview_repo: InterviewRepository,
        response_repo: ResponseRepository,
        report_repo: ReportRepository,
        gemini_service: GeminiService,
    ):
        self.interview_repo = interview_repo
        self.response_repo = response_repo
        self.report_repo = report_repo
        self.gemini_service = gemini_service

    def generate(self, *, user, interview_id: UUID) -> Report:
        interview = self.interview_repo.get(interview_id)
        if not interview or interview.user_id != user.id:
            raise NotFoundException("Interview not found")

        responses = self.response_repo.list_by_interview(interview.id)
        response_payload = [
            {
                "question_id": str(response.question_id),
                "score": response.score,
                "answer_type": response.answer_type,
                "answer_text": response.answer_text,
                "feedback": response.feedback,
            }
            for response in responses
        ]

        prompt = (
            f"{REPORT_GENERATION_PROMPT}\n"
            f"Interview: {interview.title}\n"
            f"Domain: {interview.domain.value}\n"
            f"Difficulty: {interview.difficulty.value}\n"
            f"Type: {interview.type.value}\n"
            f"Responses: {json.dumps(response_payload, default=str)}\n"
        )
        generated = self.gemini_service.generate_json(
            prompt,
            default={
                "overall_score": int(sum((response.score or 0) for response in responses) / max(len(responses), 1)),
                "technical_score": 80,
                "communication_score": 78,
                "problem_solving_score": 82,
                "strengths": ["Consistent interview participation"],
                "weaknesses": ["Needs sharper examples"],
                "recommendations": ["Practice structured answers", "Add metrics to examples"],
            },
        )

        report = self.report_repo.get_by_interview_id(interview.id)
        if report is None:
            report = Report(
                interview_id=interview.id,
                user_id=user.id,
                overall_score=int(generated.get("overall_score", 0)),
                technical_score=int(generated.get("technical_score", 0)),
                communication_score=int(generated.get("communication_score", 0)),
                problem_solving_score=int(generated.get("problem_solving_score", 0)),
                strengths=json.dumps(generated.get("strengths", [])),
                weaknesses=json.dumps(generated.get("weaknesses", [])),
                recommendations=json.dumps(generated.get("recommendations", [])),
                generated_at=datetime.now(timezone.utc),
            )
            return self.report_repo.create(report)

        report.technical_score = int(generated.get("technical_score", 0))
        report.overall_score = int(generated.get("overall_score", 0))
        report.communication_score = int(generated.get("communication_score", 0))
        report.problem_solving_score = int(generated.get("problem_solving_score", 0))
        report.strengths = json.dumps(generated.get("strengths", []))
        report.weaknesses = json.dumps(generated.get("weaknesses", []))
        report.recommendations = json.dumps(generated.get("recommendations", []))
        report.generated_at = datetime.now(timezone.utc)
        return self.report_repo.save(report)
