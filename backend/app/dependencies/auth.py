from uuid import UUID

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.enums import TokenTypeEnum
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_token_payload(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> dict:
    if not credentials:
        raise UnauthorizedException("Missing access token")
    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        raise UnauthorizedException("Invalid access token") from exc
    if payload.get("type") != TokenTypeEnum.ACCESS.value:
        raise UnauthorizedException("Invalid access token")
    return payload


def get_current_user(
    token_payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> User:
    user_repo = UserRepository(db)
    try:
        user_id = UUID(token_payload["sub"])
    except Exception as exc:
        raise UnauthorizedException("Invalid token subject") from exc
    user = user_repo.get(user_id)
    if not user:
        raise UnauthorizedException("User not found")
    return user


def optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != TokenTypeEnum.ACCESS.value:
            return None
        user_id = UUID(payload["sub"])
    except Exception:
        return None
    return UserRepository(db).get(user_id)
