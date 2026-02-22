import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from pg_database import get_pg_db, UserProfile
from sqlalchemy import select

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

class AssistantRequest(BaseModel):
    clerk_id: str
    message: str
    language: str = "en"

LANG_NAMES = {
    "en": "English",
    "hi": "Hindi"
}

@router.post("/chat")
async def chat_with_assistant(req: AssistantRequest, db: AsyncSession = Depends(get_pg_db)):
    if not req.message:
        raise HTTPException(status_code=400, detail="Message is required")

    api_key = os.getenv("OPENROUTER_API_KEY")
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key
    )

    # Get user context
    stmt = select(UserProfile).where(UserProfile.clerk_id == req.clerk_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    context = ""
    if user:
        context = f"Farmer Name: {user.name}, Soil: {user.soil_type}, Crops: {user.crops}"

    system_prompt = f"""
    You are Agri AI, a helpful voice-assisted farming companion.
    User Context: {context}
    The user is speaking in {LANG_NAMES.get(req.language, 'English')}.
    Respond concisely and naturally, as your response will be read aloud.
    Always respond in {LANG_NAMES.get(req.language, 'English')}.
    """

    try:
        response = client.chat.completions.create(
            model="google/gemini-2.0-flash-lite-001",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        return {"response": response.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
