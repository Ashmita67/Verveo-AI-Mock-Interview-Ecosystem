"""add interview session fields and resume aliases

Revision ID: 0002_interview_session_fields
Revises: 0001_initial
Create Date: 2026-07-02
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_interview_session_fields"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


interview_source_enum = sa.Enum("generic", "resume_based", name="interviewsourceenum")


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    interview_columns = {column["name"] for column in inspector.get_columns("interviews")}
    resume_columns = {column["name"] for column in inspector.get_columns("resumes")}

    interview_source_enum.create(op.get_bind(), checkfirst=True)

    if "alias" not in resume_columns:
        op.add_column("resumes", sa.Column("alias", sa.String(length=120), nullable=True))

    if "resume_id" not in interview_columns:
        op.add_column("interviews", sa.Column("resume_id", sa.Uuid(), sa.ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True))
    if "interview_source" not in interview_columns:
        op.add_column("interviews", sa.Column("interview_source", interview_source_enum, nullable=False, server_default=sa.text("'generic'")))
    if "interview_mode" not in interview_columns:
        op.add_column("interviews", sa.Column("interview_mode", sa.String(length=20), nullable=True))
    if "current_question_index" not in interview_columns:
        op.add_column("interviews", sa.Column("current_question_index", sa.Integer(), nullable=False, server_default=sa.text("0")))
    if "started_at" not in interview_columns:
        op.add_column("interviews", sa.Column("started_at", sa.DateTime(timezone=True), nullable=True))
    if "ended_at" not in interview_columns:
        op.add_column("interviews", sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True))
    existing_indexes = {index["name"] for index in inspector.get_indexes("interviews")}
    if "ix_interviews_resume_id" not in existing_indexes:
        op.create_index("ix_interviews_resume_id", "interviews", ["resume_id"])


def downgrade() -> None:
    op.drop_index("ix_interviews_resume_id", table_name="interviews")
    op.drop_column("interviews", "ended_at")
    op.drop_column("interviews", "started_at")
    op.drop_column("interviews", "current_question_index")
    op.drop_column("interviews", "interview_mode")
    op.drop_column("interviews", "interview_source")
    op.drop_column("interviews", "resume_id")
    op.drop_column("resumes", "alias")

    interview_source_enum.drop(op.get_bind(), checkfirst=True)
