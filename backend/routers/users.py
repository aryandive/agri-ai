import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pg_database import get_pg_db, UserProfile


router = APIRouter(prefix="/api/users", tags=["users"])


class CropInput(BaseModel):
    crop: str
    planted_date: str
    soil_type: Optional[str] = None


class AddressInput(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    phone: Optional[str] = None


class ProfileInput(BaseModel):
    clerk_id: str
    name: Optional[str] = None
    land_area_acres: Optional[float] = None
    soil_type: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    crops: Optional[List[CropInput]] = []
    preferred_language: Optional[str] = "en"
    address: Optional[AddressInput] = None


@router.post("/profile")
async def save_profile(data: ProfileInput, db: AsyncSession = Depends(get_pg_db)):
    """Create or update a user profile in Neon PostgreSQL."""
    stmt = select(UserProfile).where(UserProfile.clerk_id == data.clerk_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    crops_data = [c.dict() for c in (data.crops or [])]

    if user:
        user.name = data.name if data.name is not None else user.name
        user.land_area_acres = data.land_area_acres if data.land_area_acres is not None else user.land_area_acres
        user.soil_type = data.soil_type if data.soil_type is not None else user.soil_type
        user.location_lat = data.location_lat if data.location_lat is not None else user.location_lat
        user.location_lng = data.location_lng if data.location_lng is not None else user.location_lng
        user.crops = crops_data
        user.preferred_language = data.preferred_language if data.preferred_language is not None else user.preferred_language
        if data.address is not None:
             user.address = data.address.dict()
    else:
        user = UserProfile(
            clerk_id=data.clerk_id,
            name=data.name,
            land_area_acres=data.land_area_acres,
            soil_type=data.soil_type,
            location_lat=data.location_lat,
            location_lng=data.location_lng,
            crops=crops_data,
            preferred_language=data.preferred_language,
            address=data.address.dict() if data.address is not None else None
        )
        db.add(user)

    await db.commit()
    return {"status": "success", "message": "Profile saved."}


@router.get("/profile/{clerk_id}")
async def get_profile(clerk_id: str, db: AsyncSession = Depends(get_pg_db)):
    """Fetch user profile from Neon PostgreSQL."""
    stmt = select(UserProfile).where(UserProfile.clerk_id == clerk_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {
        "clerk_id": user.clerk_id,
        "name": user.name,
        "land_area_acres": user.land_area_acres,
        "soil_type": user.soil_type,
        "location_lat": user.location_lat,
        "location_lng": user.location_lng,
        "subscription_tier": user.subscription_tier,
        "crop_doctor_uses": user.crop_doctor_uses,
        "crops": user.crops or [],
        "preferred_language": user.preferred_language,
        "address": user.address or {},
    }
