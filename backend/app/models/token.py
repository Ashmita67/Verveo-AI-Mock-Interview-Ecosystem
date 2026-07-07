import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import OtpPurposeEnum, TokenTypeEnum
from app.models.base import Base, TimestampMixin, UUIDMixin


class RefreshToken(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_jti: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    token_type: Mapped[TokenTypeEnum] = mapped_column(
        Enum(TokenTypeEnum, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        default=TokenTypeEnum.REFRESH,
        nullable=False,
    )

    user = relationship("User", back_populates="refresh_tokens")


class OtpToken(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "otp_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    purpose: Mapped[OtpPurposeEnum] = mapped_column(
        Enum(OtpPurposeEnum, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
    )
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    meta: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="otp_tokens")
