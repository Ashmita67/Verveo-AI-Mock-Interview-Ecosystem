from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.repositories.base import BaseRepository


class ResumeRepository(BaseRepository[Resume]):
    def __init__(self, db: Session):
        super().__init__(Resume, db)

    def list_by_user(self, user_id: str):
        return list(self.db.scalars(select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc())).all())
