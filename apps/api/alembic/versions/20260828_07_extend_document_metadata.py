"""Extend reusable document metadata.

Revision ID: 20260828_07
Revises: 20260827_06
"""
from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op

revision: str = "20260828_07"
down_revision: str | None = "20260827_06"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

def upgrade() -> None:
    with op.batch_alter_table("documents") as batch:
        batch.add_column(sa.Column("display_name", sa.String(length=100), nullable=True))
        batch.add_column(sa.Column("original_filename", sa.String(length=255), nullable=True))
        batch.add_column(sa.Column("stored_filename", sa.String(length=255), nullable=True))
        batch.add_column(sa.Column("mime_type", sa.String(length=100), nullable=True))
        batch.add_column(sa.Column("size_bytes", sa.Integer(), nullable=True))

def downgrade() -> None:
    with op.batch_alter_table("documents") as batch:
        batch.drop_column("size_bytes"); batch.drop_column("mime_type"); batch.drop_column("stored_filename"); batch.drop_column("original_filename"); batch.drop_column("display_name")
