import uuid

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import InterviewDifficultyEnum, InterviewDomainEnum, InterviewSourceEnum, InterviewStatusEnum, InterviewTypeEnum
from app.models.base import Base, TimestampMixin, UUIDMixin


class Interview(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "interviews"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[InterviewDomainEnum] = mapped_column(
        Enum(InterviewDomainEnum, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
    )
    difficulty: Mapped[InterviewDifficultyEnum] = mapped_column(
        Enum(InterviewDifficultyEnum, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
    )
    type: Mapped[InterviewTypeEnum] = mapped_column(
        Enum(InterviewTypeEnum, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
    )
    interview_source: Mapped[InterviewSourceEnum] = mapped_column(
        Enum(InterviewSourceEnum, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        default=InterviewSourceEnum.GENERIC,
        nullable=False,
    )
    interview_mode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    resume_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("resumes.id", ondelete="SET NULL"), index=True, nullable=True)
    current_question_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[InterviewStatusEnum] = mapped_column(
        Enum(InterviewStatusEnum, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        default=InterviewStatusEnum.CREATED,
        nullable=False,
    )
    overall_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="interviews")
    resume = relationship("Resume", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="interview", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="interview", uselist=False, cascade="all, delete-orphan")
