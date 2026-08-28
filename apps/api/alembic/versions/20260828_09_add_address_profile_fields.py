"""Add reusable address persistence fields."""
from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op
revision: str = "20260828_09"
down_revision: str | None = "20260828_08"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None
def upgrade() -> None:
    with op.batch_alter_table("profiles") as batch:
        batch.add_column(sa.Column("current_address_same_as_permanent", sa.Boolean(), nullable=False, server_default=sa.false()))
    with op.batch_alter_table("addresses") as batch:
        batch.add_column(sa.Column("country", sa.String(length=100), nullable=False, server_default="India"))
def downgrade() -> None:
    with op.batch_alter_table("addresses") as batch: batch.drop_column("country")
    with op.batch_alter_table("profiles") as batch: batch.drop_column("current_address_same_as_permanent")
