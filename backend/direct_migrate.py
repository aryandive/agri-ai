import asyncio
import asyncpg
import os
from urllib.parse import urlparse

# Correct DATABASE_URL for Neon
DB_URL = "postgresql://neondb_owner:npg_r82jLKpFqHfv@ep-dark-wave-aiklvq3x-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

async def migrate():
    print("Connecting directly to database...")
    try:
        # asyncpg needs the password passed separately or parsed correctly
        parsed = urlparse(DB_URL)
        conn = await asyncpg.connect(
            user=parsed.username,
            password=parsed.password,
            host=parsed.hostname,
            database=parsed.path.lstrip('/'),
            ssl='require'
        )
        print("Connected!")
        
        # Add columns
        cols = [
            ("preferred_language", "VARCHAR DEFAULT 'en'"),
            ("address", "JSON")
        ]
        
        for col, dtype in cols:
            try:
                await conn.execute(f"ALTER TABLE user_profiles ADD COLUMN {col} {dtype};")
                print(f"Added column: {col}")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"Column {col} already exists.")
                else:
                    print(f"Error adding {col}: {e}")
        
        await conn.close()
        print("Done!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
