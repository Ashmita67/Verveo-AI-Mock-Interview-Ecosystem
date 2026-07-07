"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-24
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


provider_enum = sa.Enum("local", "google", name="providerenum")
domain_enum = sa.Enum(
    "Software Development",
    "Machine Learning",
    "Data Science",
    "Full Stack Development",
    name="interviewdomainenum",
)
difficulty_enum = sa.Enum("Easy", "Medium", "Hard", name="interviewdifficultyenum")
type_enum = sa.Enum("Technical", "HR", "Behavioral", "Mixed", name="interviewtypeenum")
status_enum = sa.Enum("Created", "Active", "Completed", "Cancelled", name="interviewstatusenum")
generated_by_enum = sa.Enum("AI", "QuestionBank", name="questiongeneratedbyenum")
otp_purpose_enum = sa.Enum("register", "reset_password", name="otppurposeenum")
token_type_enum = sa.Enum("access", "refresh", name="tokentypeenum")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("provider", provider_enum, nullable=False, server_default=sa.text("'local'")),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "interviews",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("domain", domain_enum, nullable=False),
        sa.Column("difficulty", difficulty_enum, nullable=False),
        sa.Column("type", type_enum, nullable=False),
        sa.Column("status", status_enum, nullable=False, server_default=sa.text("'Created'")),
        sa.Column("overall_score", sa.Integer(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_interviews_user_id", "interviews", ["user_id"])

    op.create_table(
        "resumes",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("parsed_text", sa.Text(), nullable=True),
        sa.Column("ats_score", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"])

    op.create_table(
        "questions",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("interview_id", sa.Uuid(), sa.ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("question_type", sa.String(length=100), nullable=False),
        sa.Column("difficulty", difficulty_enum, nullable=False),
        sa.Column("generated_by", generated_by_enum, nullable=False),
        sa.Column("question_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_questions_interview_id", "questions", ["interview_id"])

    op.create_table(
        "responses",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("interview_id", sa.Uuid(), sa.ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", sa.Uuid(), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("answer_type", sa.String(length=30), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=True),
        sa.Column("audio_path", sa.String(length=500), nullable=True),
        sa.Column("video_path", sa.String(length=500), nullable=True),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("ideal_answer", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_responses_interview_id", "responses", ["interview_id"])
    op.create_index("ix_responses_question_id", "responses", ["question_id"])

    op.create_table(
        "reports",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("interview_id", sa.Uuid(), sa.ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("technical_score", sa.Integer(), nullable=True),
        sa.Column("communication_score", sa.Integer(), nullable=True),
        sa.Column("problem_solving_score", sa.Integer(), nullable=True),
        sa.Column("strengths", sa.Text(), nullable=True),
        sa.Column("weaknesses", sa.Text(), nullable=True),
        sa.Column("recommendations", sa.Text(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_reports_user_id", "reports", ["user_id"])

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_jti", sa.String(length=100), nullable=False, unique=True),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("token_type", token_type_enum, nullable=False, server_default=sa.text("'refresh'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])

    op.create_table(
        "otp_tokens",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("purpose", otp_purpose_enum, nullable=False),
        sa.Column("otp_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("meta", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_otp_tokens_user_id", "otp_tokens", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_otp_tokens_user_id", table_name="otp_tokens")
    op.drop_table("otp_tokens")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_index("ix_reports_user_id", table_name="reports")
    op.drop_table("reports")
    op.drop_index("ix_responses_question_id", table_name="responses")
    op.drop_index("ix_responses_interview_id", table_name="responses")
    op.drop_table("responses")
    op.drop_index("ix_questions_interview_id", table_name="questions")
    op.drop_table("questions")
    op.drop_index("ix_resumes_user_id", table_name="resumes")
    op.drop_table("resumes")
    op.drop_index("ix_interviews_user_id", table_name="interviews")
    op.drop_table("interviews")
    op.drop_table("users")

    otp_purpose_enum.drop(op.get_bind(), checkfirst=True)
    token_type_enum.drop(op.get_bind(), checkfirst=True)
    generated_by_enum.drop(op.get_bind(), checkfirst=True)
    status_enum.drop(op.get_bind(), checkfirst=True)
    type_enum.drop(op.get_bind(), checkfirst=True)
    difficulty_enum.drop(op.get_bind(), checkfirst=True)
    domain_enum.drop(op.get_bind(), checkfirst=True)
    provider_enum.drop(op.get_bind(), checkfirst=True)
