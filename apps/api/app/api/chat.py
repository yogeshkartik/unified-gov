from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatProviderError, chat

router = APIRouter(tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def send_chat_message(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    try:
        return chat(db, payload)
    except ChatProviderError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"code": "CHAT_UNAVAILABLE"}) from error
