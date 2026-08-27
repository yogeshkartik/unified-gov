from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.profile import Document, Education, Profile, User
from app.schemas.profile import EducationCreate, ProfileUpdate

DEMO_USER_EMAIL = "rahul.demo@example.com"


class ProfileNotFoundError(Exception):
    pass


def get_demo_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.email == DEMO_USER_EMAIL))
    if user is None:
        raise ProfileNotFoundError
    return user


def get_profile(db: Session) -> Profile:
    profile = db.scalar(
        select(Profile)
        .join(Profile.user)
        .where(User.email == DEMO_USER_EMAIL)
        .options(selectinload(Profile.user).selectinload(User.addresses))
    )
    if profile is None:
        raise ProfileNotFoundError
    return profile


def update_profile(db: Session, payload: ProfileUpdate) -> Profile:
    profile = get_profile(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    return get_profile(db)


def list_education(db: Session) -> list[Education]:
    user = get_demo_user(db)
    return list(
        db.scalars(select(Education).where(Education.user_id == user.id).order_by(Education.year)).all()
    )


def create_education(db: Session, payload: EducationCreate) -> Education:
    user = get_demo_user(db)
    education = Education(user_id=user.id, **payload.model_dump())
    db.add(education)
    db.commit()
    db.refresh(education)
    return education


def list_documents(db: Session) -> list[Document]:
    user = get_demo_user(db)
    return list(db.scalars(select(Document).where(Document.user_id == user.id).order_by(Document.name)).all())
