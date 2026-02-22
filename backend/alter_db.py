import os
import asyncio
from dotenv import load_dotenv
from pg_database import engine

load_dotenv(override=True)

async def alter_db():
    try:
        async with engine.begin() as conn:
            # Add subscription_tier column
            await conn.execute(
                "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'free'"
            )
            # Add crop_doctor_uses column
            await conn.execute(
                "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS crop_doctor_uses INTEGER DEFAULT 0"
            )
        print("✅ Added 'subscription_tier' and 'crop_doctor_uses' to user_profiles table.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(alter_db())
