import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import InterviewDifficultyEnum, QuestionGeneratedByEnum
from app.models.base import Base, TimestampMixin, UUIDMixin


class Question(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "questions"

    interview_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interviews.id", ondelete="CASCADE"), index=True, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(100), nullable=False)
    difficulty: Mapped[InterviewDifficultyEnum] = mapped_column(
        Enum(InterviewDifficultyEnum, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
    )
    generated_by: Mapped[QuestionGeneratedByEnum] = mapped_column(
        Enum(QuestionGeneratedByEnum, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
    )
    question_order: Mapped[int] = mapped_column(Integer, nullable=False)

    interview = relationship("Interview", back_populates="questions")
    responses = relationship("Response", back_populates="question", cascade="all, delete-orphan")
