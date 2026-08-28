"""Add the reusable-document import flag.

Revision ID: 20260828_10
Revises: 20260828_09
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260828_10"
down_revision: str | None = "20260828_09"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("documents") as batch:
        batch.add_column(
            sa.Column("is_imported", sa.Boolean(), nullable=False, server_default=sa.true())
        )


def downgrade() -> None:
    with op.batch_alter_table("documents") as batch:
        batch.drop_column("is_imported")
