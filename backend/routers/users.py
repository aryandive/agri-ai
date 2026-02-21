import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import get_db


router = APIRouter(prefix="/api/users", tags=["users"])


class CropInput(BaseModel):
    crop: str
    planted_date: str
    soil_type: Optional[str] = None


class ProfileInput(BaseModel):
    clerk_id: str
    name: Optional[str] = None
    land_area_acres: Optional[float] = None
    soil_type: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    crops: Optional[List[CropInput]] = []


@router.post("/profile")
async def save_profile(data: ProfileInput):
    """Create or update a user profile in local SQLite."""
    db = await get_db()
    try:
        crops_json = json.dumps([c.dict() for c in data.crops] if data.crops else [])

        existing = await db.execute(
            "SELECT id FROM user_profiles WHERE clerk_id = ?", (data.clerk_id,)
        )
        row = await existing.fetchone()

        if row:
            await db.execute(
                """UPDATE user_profiles SET
                    name = COALESCE(?, name),
                    land_area_acres = COALESCE(?, land_area_acres),
                    soil_type = COALESCE(?, soil_type),
                    location_lat = COALESCE(?, location_lat),
                    location_lng = COALESCE(?, location_lng),
                    crops = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE clerk_id = ?""",
                (data.name, data.land_area_acres, data.soil_type,
                 data.location_lat, data.location_lng, crops_json, data.clerk_id)
            )
        else:
            await db.execute(
                """INSERT INTO user_profiles
                    (clerk_id, name, land_area_acres, soil_type, location_lat, location_lng, crops)
                VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (data.clerk_id, data.name, data.land_area_acres, data.soil_type,
                 data.location_lat, data.location_lng, crops_json)
            )

        await db.commit()
        return {"status": "success", "message": "Profile saved."}
    finally:
        await db.close()


@router.get("/profile/{clerk_id}")
async def get_profile(clerk_id: str):
    """Fetch user profile from local SQLite."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM user_profiles WHERE clerk_id = ?", (clerk_id,)
        )
        row = await cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")

        crops = json.loads(row["crops"] or "[]")

        return {
            "clerk_id": row["clerk_id"],
            "name": row["name"],
            "land_area_acres": row["land_area_acres"],
            "soil_type": row["soil_type"],
            "location_lat": row["location_lat"],
            "location_lng": row["location_lng"],
            "crops": crops,
        }
    finally:
        await db.close()
