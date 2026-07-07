from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.interview import Interview
from app.repositories.base import BaseRepository


class InterviewRepository(BaseRepository[Interview]):
    def __init__(self, db: Session):
        super().__init__(Interview, db)

    def list_by_user(self, user_id: str):
        return list(self.db.scalars(select(Interview).where(Interview.user_id == user_id).order_by(Interview.created_at.desc())).all())
