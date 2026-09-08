from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.application_progress import StartApplicationRequest, StartApplicationResponse
from app.services import application_engine, application_progress
from app.services.service_catalog import ServiceNotFoundError
from app.services.chat_service import ChatProviderError, chat

router = APIRouter(tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def send_chat_message(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    try:
        return chat(db, payload)
    except ChatProviderError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"code": "CHAT_UNAVAILABLE"}) from error


@router.post("/chat/actions/start-application", response_model=StartApplicationResponse)
def start_application(payload: StartApplicationRequest, db: Session = Depends(get_db)) -> StartApplicationResponse:
    try:
        result, application = application_engine.create_or_resume_application(db, payload.service_id)
        return StartApplicationResponse(
            result=result,
            application_id=application.id,
            progress=application_progress.get_application_progress(db, application.id),
        )
    except ServiceNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "SERVICE_NOT_FOUND"}) from error
    except application_engine.ServiceNotAvailableError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"code": "SERVICE_NOT_AVAILABLE"}) from error
    except application_engine.ServiceJurisdictionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "SERVICE_JURISDICTION_MISMATCH"}) from error
