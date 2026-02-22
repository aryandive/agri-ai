import os
import asyncio
from dotenv import load_dotenv
from pg_database import engine

load_dotenv(override=True)

from sqlalchemy import text

async def upgrade_me(clerk_id):
    try:
        async with engine.begin() as conn:
            stmt = text(f"UPDATE user_profiles SET subscription_tier = 'premium' WHERE clerk_id = '{clerk_id}'")
            await conn.execute(stmt)
            print(f"✅ Successfully upgraded {clerk_id} to Premium!")
    except Exception as e:
        print(f"❌ Upgrade failed: {e}")

if __name__ == "__main__":
    asyncio.run(upgrade_me("user_39yH1pRRgB1Pl1eZN3hZAhCGB7c"))
