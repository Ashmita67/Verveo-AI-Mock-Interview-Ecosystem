import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.hash import bcrypt, pbkdf2_sha256

from app.core.config import settings
from app.core.enums import TokenTypeEnum

ALGORITHM = "HS256"
LEGACY_BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2x$", "$2y$")


def get_password_hash(password: str) -> str:
    return pbkdf2_sha256.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    if not password_hash:
        return False

    if password_hash.startswith(LEGACY_BCRYPT_PREFIXES):
        if len(plain_password.encode("utf-8")) > 72:
            return False
        try:
            return bcrypt.verify(plain_password, password_hash)
        except Exception:
            return False

    try:
        return pbkdf2_sha256.verify(plain_password, password_hash)
    except Exception:
        return False


def create_token(subject: str, token_type: TokenTypeEnum, expires_delta: timedelta, extra: dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type.value,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
        "jti": secrets.token_urlsafe(16),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    return create_token(
        subject=subject,
        token_type=TokenTypeEnum.ACCESS,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        extra=extra,
    )


def create_refresh_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    return create_token(
        subject=subject,
        token_type=TokenTypeEnum.REFRESH,
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
        extra=extra,
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
