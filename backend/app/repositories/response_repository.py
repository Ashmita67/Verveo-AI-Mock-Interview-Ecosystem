from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.response import Response
from app.repositories.base import BaseRepository


class ResponseRepository(BaseRepository[Response]):
    def __init__(self, db: Session):
        super().__init__(Response, db)

    def list_by_interview(self, interview_id):
        stmt = select(Response).where(Response.interview_id == interview_id).order_by(Response.created_at.asc())
        return list(self.db.scalars(stmt).all())

    def get_for_question(self, interview_id, question_id):
        stmt = select(Response).where(
            Response.interview_id == interview_id,
            Response.question_id == question_id,
        )
        return self.db.scalar(stmt)
