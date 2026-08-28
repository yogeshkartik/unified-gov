"""Expand reusable general profile fields."""
from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op
revision: str = "20260828_08"
down_revision: str | None = "20260828_07"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None
def upgrade() -> None:
    with op.batch_alter_table("profiles") as batch:
        for name, length in [("alternate_mobile",20),("marital_status",50),("guardian_name",255),("guardian_relationship",100),("ews_status",30),("ex_serviceman_status",30),("minority_status",30),("highest_qualification",100),("current_education_status",100),("current_course",255),("current_institution",255),("employment_status",50),("occupation",100),("annual_family_income_range",50),("preferred_language",20)]: batch.add_column(sa.Column(name, sa.String(length=length), nullable=True))
def downgrade() -> None: pass
