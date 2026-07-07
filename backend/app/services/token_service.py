from datetime import datetime, timezone

from app.core.enums import TokenTypeEnum
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.utils.hashing import sha256_hexdigest


class TokenService:
    def create_access_token(self, subject: str, extra: dict | None = None) -> str:
        return create_access_token(subject, extra)

    def create_refresh_token(self, subject: str, extra: dict | None = None) -> str:
        return create_refresh_token(subject, extra)

    def create_pair(self, subject: str, extra: dict | None = None) -> tuple[str, str]:
        return self.create_access_token(subject, extra), self.create_refresh_token(subject, extra)

    def decode(self, token: str) -> dict:
        return decode_token(token)

    def token_hash(self, token: str) -> str:
        return sha256_hexdigest(token)

    def is_refresh_token_valid(self, payload: dict) -> bool:
        return payload.get("type") == TokenTypeEnum.REFRESH.value and int(payload.get("exp", 0)) > int(datetime.now(timezone.utc).timestamp())
