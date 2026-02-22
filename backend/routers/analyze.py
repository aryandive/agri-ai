import os
import json
import base64
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from models import AnalyzeResponse
from pg_database import get_pg_db, UserProfile

load_dotenv()

router = APIRouter(prefix="/api", tags=["analyze"])

LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "pa": "Punjabi",
    "te": "Telugu",
    "ta": "Tamil",
    "mr": "Marathi",
    "gu": "Gujarati"
}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_plant(
    image: UploadFile = File(...),
    description: str = Form(""),
    crop: str = Form(""),
    clerk_id: str = Form(""),
    user_role: str = Form("free_user"), # Default to free if not provided
    db: AsyncSession = Depends(get_pg_db)
):
    if not clerk_id:
        raise HTTPException(status_code=401, detail="Unauthorized. User ID missing.")
        
    # Check subscription & usage limits
    stmt = select(UserProfile).where(UserProfile.clerk_id == clerk_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found. Please complete onboarding.")

    # Only enforce limits if the user is NOT a premium subscriber/admin in Clerk
    role_to_check = (user_role or "").lower()
    is_premium = role_to_check in ["subscribed", "admin"]
        
    if not is_premium and user.crop_doctor_uses >= 3:
        raise HTTPException(
            status_code=403, 
            detail="limit_reached" # Specific keyword for frontend to show upgrade modal
        )
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY not configured in .env file.",
        )

    # Initialize OpenRouter client
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key
    )

    # 🔥 Read uploaded image
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file provided.")

    try:
        # 🔥 Open image
        img = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB (important for PNGs with transparency)
        if img.mode != "RGB":
            img = img.convert("RGB")

        # 🔥 Resize to max 512px
        max_size = 512
        img.thumbnail((max_size, max_size))

        # 🔥 Compress to JPEG
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=75, optimize=True)
        compressed_bytes = buffer.getvalue()

        # Encode to base64
        image_base64 = base64.b64encode(compressed_bytes).decode("utf-8")

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Image processing failed: {str(e)}",
        )

    # 🔥 Prompt
    prompt = """
You are an expert agricultural scientist and plant pathologist.
Analyze this plant/leaf image and provide a diagnosis.

Respond ONLY with valid JSON in this exact format:
{
    "disease_name": "Name of the disease or 'Healthy' if no disease",
    "confidence": "High / Medium / Low",
    "description": "Brief description of the disease and its effects",
    "cure_steps": ["Step 1", "Step 2", "Step 3"],
    "pesticides": ["Treatment 1", "Treatment 2"],
    "prevention_tips": ["Tip 1", "Tip 2", "Tip 3"]
}

IMPORTANT: All text values (description, cure_steps, pesticides, prevention_tips) MUST be written in {LANGUAGES.get(user.preferred_language, 'English')}.
The "disease_name" and "confidence" should remain in English.
"""

    if crop:
        prompt += f"\nCrop diagnosed: {crop}"
    if description:
        prompt += f"\nAdditional farmer context: {description}"

    try:
        response = client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            },
                        },
                    ],
                }
            ],
            temperature=0.1,
            max_tokens=2048,
        )

        text = response.choices[0].message.content.strip()

        # 🔥 Remove markdown code fences if model adds them
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0]
            text = text.strip()

        result = json.loads(text)

        # Increment usage counter
        if user.subscription_tier == "free":
            user.crop_doctor_uses += 1
            await db.commit()

        return AnalyzeResponse(**result)

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response as JSON: {str(e)}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenRouter API error: {str(e)}",
        )
