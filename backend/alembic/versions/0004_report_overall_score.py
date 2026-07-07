"""add overall score to reports

Revision ID: 0004_report_overall_score
Revises: 0003_response_transcript_skip
Create Date: 2026-07-03
"""

from alembic import op
import sqlalchemy as sa

revision = "0004_report_overall_score"
down_revision = "0003_response_transcript_skip"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("reports", sa.Column("overall_score", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("reports", "overall_score")
