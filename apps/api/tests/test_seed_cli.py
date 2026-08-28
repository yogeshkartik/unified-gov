from pathlib import Path

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.database import Base
from app.models.profile import Document, DocumentType, Education, User
from app.models.service import Service
from app.services import seed
from app.services.profile_service import DEMO_USER_EMAIL


def test_seed_main_uses_configured_session_and_is_idempotent(tmp_path, monkeypatch) -> None:
    engine = create_engine(f"sqlite:///{tmp_path / 'seed-cli.db'}")
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    monkeypatch.setattr(seed, "SessionLocal", session_factory)
    metadata_updates = 0

    def ensure_metadata() -> None:
        nonlocal metadata_updates
        metadata_updates += 1

    monkeypatch.setattr(seed, "ensure_document_metadata_columns", ensure_metadata)

    seed.main()
    seed.main()

    assert metadata_updates == 2
    with session_factory() as db:
        user = db.scalar(select(User).where(User.email == DEMO_USER_EMAIL))
        assert user is not None
        assert db.scalar(select(func.count()).select_from(Service)) > 0
        assert db.scalar(select(func.count()).select_from(Education).where(Education.user_id == user.id)) == 1
        marksheet = db.scalar(
            select(Document).where(
                Document.user_id == user.id,
                Document.document_type == DocumentType.MARKSHEET,
            )
        )
        assert marksheet is not None
        assert marksheet.original_filename == seed.SEED_GENERIC_DOCUMENT_FILENAME
        assert (Path(settings.upload_dir) / str(marksheet.stored_filename)).is_file()
