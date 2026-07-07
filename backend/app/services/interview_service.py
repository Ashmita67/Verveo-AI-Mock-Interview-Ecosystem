from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.enums import InterviewSourceEnum, InterviewStatusEnum
from app.core.exceptions import NotFoundException
from app.models.interview import Interview
from app.repositories.interview_repository import InterviewRepository


class InterviewService:
    def __init__(self, interview_repo: InterviewRepository):
        self.interview_repo = interview_repo

    def create(
        self,
        user,
        payload,
        *,
        interview_source: InterviewSourceEnum = InterviewSourceEnum.GENERIC,
        interview_mode: str | None = None,
        resume_id: UUID | None = None,
        current_question_index: int = 0,
        started_at: datetime | None = None,
        ended_at: datetime | None = None,
        status: InterviewStatusEnum = InterviewStatusEnum.CREATED,
    ) -> Interview:
        interview = Interview(
            user_id=user.id,
            title=payload.title,
            domain=payload.domain,
            difficulty=payload.difficulty,
            type=payload.type,
            interview_source=interview_source,
            interview_mode=interview_mode,
            resume_id=resume_id,
            current_question_index=current_question_index,
            started_at=started_at,
            ended_at=ended_at,
            status=status,
            overall_score=None,
            completed_at=None,
        )
        return self.interview_repo.create(interview)

    def list_for_user(self, user):
        return self.interview_repo.list_by_user(user.id)

    def get_for_user(self, user, interview_id: UUID):
        stmt = (
            select(Interview)
            .where(Interview.id == interview_id, Interview.user_id == user.id)
            .options(selectinload(Interview.resume), selectinload(Interview.questions), selectinload(Interview.responses))
        )
        interview = self.interview_repo.db.scalar(stmt)
        if not interview or interview.user_id != user.id:
            raise NotFoundException("Interview not found")
        return interview

    def update_for_user(self, user, interview_id: UUID, payload):
        interview = self.get_for_user(user, interview_id)
        for field in [
            "title",
            "domain",
            "difficulty",
            "type",
            "interview_source",
            "interview_mode",
            "resume_id",
            "current_question_index",
            "started_at",
            "ended_at",
            "status",
            "overall_score",
        ]:
            value = getattr(payload, field, None)
            if value is not None:
                setattr(interview, field, value)
        if interview.status == InterviewStatusEnum.COMPLETED and not interview.completed_at:
            interview.completed_at = datetime.now(timezone.utc)
        return self.interview_repo.save(interview)

    def delete_for_user(self, user, interview_id: UUID):
        interview = self.get_for_user(user, interview_id)
        self.interview_repo.delete(interview)

    def complete_for_user(self, user, interview_id: UUID):
        interview = self.get_for_user(user, interview_id)
        interview.status = InterviewStatusEnum.COMPLETED
        interview.ended_at = datetime.now(timezone.utc)
        if not interview.completed_at:
            interview.completed_at = interview.ended_at
        return self.interview_repo.save(interview)
