from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.token import OtpToken
from app.repositories.base import BaseRepository


class OtpRepository(BaseRepository[OtpToken]):
    def __init__(self, db: Session):
        super().__init__(OtpToken, db)

    def get_latest_for_user(self, user_id, purpose):
        stmt = (
            select(OtpToken)
            .where(OtpToken.user_id == user_id, OtpToken.purpose == purpose, OtpToken.used.is_(False))
            .order_by(OtpToken.created_at.desc())
        )
        return self.db.scalar(stmt)
