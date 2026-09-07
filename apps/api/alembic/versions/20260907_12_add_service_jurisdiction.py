"""Add structured government level and jurisdiction metadata to services."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260907_12"
down_revision: str | None = "20260906_12"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("services", sa.Column("government_level", sa.String(length=30), nullable=False, server_default="CENTRAL"))
    op.add_column("services", sa.Column("jurisdiction_code", sa.String(length=10), nullable=False, server_default="IN"))
    op.execute("UPDATE services SET service_key = 'INCOME_CERTIFICATE' WHERE id = 'INCOME_CERTIFICATE_001'")
    op.execute("UPDATE services SET service_key = 'CASTE_CERTIFICATE' WHERE id = 'CASTE_CERTIFICATE_001'")
    op.execute("UPDATE services SET service_key = 'DOMICILE_CERTIFICATE' WHERE id = 'DOMICILE_CERTIFICATE_001'")
    op.execute("UPDATE services SET government_level = 'STATE', jurisdiction_code = 'WB' WHERE id = 'WBJEE_001'")
    op.create_index("ix_services_jurisdiction", "services", ["government_level", "jurisdiction_code"])


def downgrade() -> None:
    op.drop_index("ix_services_jurisdiction", table_name="services")
    op.drop_column("services", "jurisdiction_code")
    op.drop_column("services", "government_level")
