"""add response transcript and skipped fields

Revision ID: 0003_response_transcript_skip
Revises: 0002_interview_session_fields
Create Date: 2026-07-02
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_response_transcript_skip"
down_revision = "0002_interview_session_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("responses", sa.Column("transcript", sa.Text(), nullable=True))
    op.add_column("responses", sa.Column("is_skipped", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("responses", "is_skipped")
    op.drop_column("responses", "transcript")
