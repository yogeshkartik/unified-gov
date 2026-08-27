"""Create mock payment records and application submission fields.

Revision ID: 20260827_06
Revises: 20260827_05
Create Date: 2026-08-27 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_06"
down_revision: str | None = "20260827_05"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("applications", sa.Column("government_reference_number", sa.String(length=100), nullable=True))
    op.add_column("applications", sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(
        "ix_applications_government_reference_number",
        "applications",
        ["government_reference_number"],
        unique=True,
    )
    op.create_table(
        "payments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("application_id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=100), nullable=False),
        sa.Column("transaction_id", sa.String(length=100), nullable=False),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("transaction_id"),
    )


def downgrade() -> None:
    op.drop_table("payments")
    op.drop_index("ix_applications_government_reference_number", table_name="applications")
    op.drop_column("applications", "submitted_at")
    op.drop_column("applications", "government_reference_number")
