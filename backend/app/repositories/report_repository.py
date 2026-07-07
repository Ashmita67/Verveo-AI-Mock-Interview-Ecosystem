from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.report import Report
from app.repositories.base import BaseRepository


class ReportRepository(BaseRepository[Report]):
    def __init__(self, db: Session):
        super().__init__(Report, db)

    def get_by_interview_id(self, interview_id: str) -> Report | None:
        return self.db.scalar(select(Report).where(Report.interview_id == interview_id))

    def list_by_user(self, user_id: str) -> list[Report]:
        stmt = select(Report).where(Report.user_id == user_id).order_by(Report.generated_at.desc())
        return list(self.db.scalars(stmt).all())
