"""Unify legacy profile photos with reusable Photograph documents.

Revision ID: 20260829_11
Revises: 20260828_10
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260829_11"
down_revision: str | None = "20260828_10"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    # Existing profile-photo rows are already singleton records created by the
    # old upload flow.  Retagging preserves their IDs and any application links.
    op.execute("UPDATE documents SET document_type = 'PHOTOGRAPH' WHERE document_type = 'PROFILE_PHOTO'")


def downgrade() -> None:
    # The new PHOTOGRAPH value is also used by service requirements, so it
    # cannot be safely distinguished from a newly uploaded reusable photo.
    pass
