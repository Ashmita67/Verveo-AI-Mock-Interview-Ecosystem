from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.question import Question
from app.repositories.base import BaseRepository


class QuestionRepository(BaseRepository[Question]):
    def __init__(self, db: Session):
        super().__init__(Question, db)

    def list_by_interview(self, interview_id):
        stmt = select(Question).where(Question.interview_id == interview_id).order_by(Question.question_order.asc())
        return list(self.db.scalars(stmt).all())


