import os
import json
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
from openai import OpenAI
from models import PlannerRequest, PlannerResponse

load_dotenv()

router = APIRouter(prefix="/api/planner", tags=["planner"])


@router.post("/suggest", response_model=PlannerResponse)
async def suggest_crops(request: PlannerRequest):
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

    # Build Context String
    context = []
    if request.soil_type:
        context.append(f"Soil Type: {request.soil_type}")
    if request.acres:
        context.append(f"Land Area: {request.acres} acres")
    if request.location:
        context.append(f"Location: {request.location}")
    if request.water_availability:
        context.append(f"Water Availability: {request.water_availability}")
        
    mandi_info = ""
    if request.mandi_prices:
        mandi_info = "Current Market (Mandi) Prices in their area:\n"
        for crop, price in request.mandi_prices.items():
            mandi_info += f"- {crop}: {price}\n"
        context.append(mandi_info)

    context_str = "\n".join(context) if context else "No specific farm context provided."

    # Prompt
    prompt = f"""
You are an expert agricultural scientist and farming advisor.
Based on the following farm context, suggest the 3 best crops the farmer should plant next to maximize yield and profit.

CRITICAL INSTRUCTION FOR WATER: Analyze the provided 'Location' and evaluate whether it is considered a region with good water supply (like river basins/high rainfall) or if it is a drought-prone area. Factor this analysis and their declared 'Water Availability' heavily into your crop suggestions.

CRITICAL INSTRUCTION FOR CALCULATIONS: Using the provided 'Land Area' of {request.acres} acres, calculate the EXACT numerical total estimated yield and the EXACT total estimated seeds needed for the entire farm area.

FARM CONTEXT:
{context_str}

Respond ONLY with valid JSON in this exact format, with no markdown formatting or other text:
{{
    "suggestions": [
        {{
            "crop": "Crop Name",
            "season": "E.g. Kharif (Jun-Nov)",
            "duration": "E.g. 120-150 days",
            "yieldPerAcre": "E.g. 18-20 quintals",
            "waterNeeded": "E.g. 4-6 irrigations",
            "seedRate": "E.g. 40-50 kg/acre",
            "fertilizer": "E.g. Urea 50kg + DAP 25kg/acre",
            "bestSoil": "E.g. Loamy, Clay Loam",
            "emoji": "🌾",
            "reasoning": "A short 1-sentence reason why this crop is highly recommended based on their specific soil, location, water supply, or market prices.",
            "totalEstimatedYield": "E.g. 95 quintals",
            "totalEstimatedSeed": "E.g. 225 kg"
        }}
    ]
}}
"""

    try:
        response = client.chat.completions.create(
            model="google/gemma-3-27b-it:free",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0.3, # Slight temperature for variety but keeping JSON stable
        )

        text = response.choices[0].message.content.strip()

        # Remove markdown code fences if model adds them
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0]
            text = text.strip()

        result = json.loads(text)
        return PlannerResponse(**result)

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response as JSON. AI Output was: {text}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OpenRouter API error: {str(e)}",
        )
