from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.token import RefreshToken
from app.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, db: Session):
        super().__init__(RefreshToken, db)

    def get_by_jti(self, token_jti: str) -> RefreshToken | None:
        return self.db.scalar(select(RefreshToken).where(RefreshToken.token_jti == token_jti))

    def list_by_user(self, user_id):
        stmt = select(RefreshToken).where(RefreshToken.user_id == user_id)
        return list(self.db.scalars(stmt).all())
