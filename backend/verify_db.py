import asyncio
from pg_database import engine
from sqlalchemy import text

async def verify():
    print("Connecting to Neon PostgreSQL...")
    try:
        async with engine.connect() as conn:
            print("Successfully connected. Fetching rows...")
            res = await conn.execute(text("SELECT clerk_id, subscription_tier FROM user_profiles"))
            rows = res.fetchall()
            if not rows:
                print("DATABASE IS EMPTY: No rows found in user_profiles.")
                return
                
            print(f"FOUND {len(rows)} USERS:")
            for r in rows:
                print(f"- Clerk ID: {r[0]} | Tier: {r[1]}")
    except Exception as e:
        print(f"DATABASE ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
