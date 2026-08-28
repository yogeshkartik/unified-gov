from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import applications, consent, digilocker, documents, profile, services
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine, ensure_document_metadata_columns
from app.services.seed import seed_demo_citizen, seed_demo_services


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_document_metadata_columns()
    with SessionLocal() as session:
        seed_demo_citizen(session)
        seed_demo_services(session)
    yield

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(consent.router, prefix="/api")
app.include_router(digilocker.router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
