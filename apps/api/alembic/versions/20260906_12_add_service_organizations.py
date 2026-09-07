"""Add service organizations and canonical service keys.

This restores the historical revision already applied to deployed databases.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260906_12"
down_revision: str | None = "20260829_11"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("short_name", sa.String(length=50), nullable=True),
        sa.Column("slug", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("government_level", sa.String(length=20), nullable=False),
        sa.Column("state_code", sa.String(length=10), nullable=True),
        sa.Column("organization_type", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"])
    with op.batch_alter_table("services") as batch:
        batch.add_column(sa.Column("organization_id", sa.String(length=100), nullable=True))
        batch.add_column(sa.Column("service_key", sa.String(length=100), nullable=True))
        batch.create_index("ix_services_organization_id", ["organization_id"])
        batch.create_index("ix_services_service_key", ["service_key"])
        batch.create_foreign_key("fk_services_organization", "organizations", ["organization_id"], ["id"], ondelete="RESTRICT")


def downgrade() -> None:
    with op.batch_alter_table("services") as batch:
        batch.drop_constraint("fk_services_organization", type_="foreignkey")
        batch.drop_index("ix_services_service_key")
        batch.drop_index("ix_services_organization_id")
        batch.drop_column("service_key")
        batch.drop_column("organization_id")
    op.drop_index("ix_organizations_slug", table_name="organizations")
    op.drop_table("organizations")
