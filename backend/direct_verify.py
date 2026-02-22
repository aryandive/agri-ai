import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv(override=True)

# Manually construct the URL to bypass any buggy resolution logic in the env
RAW_URL = "postgresql+asyncpg://neondb_owner:npg_r82jLKpFqHfv@ep-dark-wave-aiklvq3x-pooler.c-4.us-east-1.aws.neon.tech/neondb?ssl=require&options=endpoint%3Dep-dark-wave-aiklvq3x-pooler"

async def check():
    print("Direct connection attempt...")
    engine = create_async_engine(RAW_URL)
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT clerk_id, subscription_tier FROM user_profiles"))
            rows = res.fetchall()
            if not rows:
                print("DB_EMPTY")
            for r in rows:
                print(f"USER: {r[0]} | TIER: {r[1]}")
    except Exception as e:
        print(f"DB_ERROR: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
