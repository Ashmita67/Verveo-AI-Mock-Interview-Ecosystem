import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Resume(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "resumes"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    alias: Mapped[str | None] = mapped_column(String(120), nullable=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    parsed_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ats_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    user = relationship("User", back_populates="resumes")
    interviews = relationship("Interview", back_populates="resume")
