from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import ChatRequest, ChatResponse
from auth import get_current_user
from ai.gemini_agent import run_gemini_agent

router = APIRouter(prefix="/api/chat", tags=["AI Chatbot"])

@router.post("", response_model=ChatResponse)
def handle_chat_message(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history_dicts = [{"role": m.role, "content": m.content} for m in req.history or []]
    
    result = run_gemini_agent(
        db=db,
        user=current_user,
        user_message=req.message,
        conversation_history=history_dicts
    )

    return {
        "reply": result.get("reply", "No response generated"),
        "action_taken": result.get("action_taken"),
        "data": result.get("data"),
        "agent_routing": result.get("agent_routing")
    }
