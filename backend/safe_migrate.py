import asyncio
import asyncpg
import os
from urllib.parse import urlparse

# Correct DATABASE_URL for Neon
DB_URL = "postgresql://neondb_owner:npg_r82jLKpFqHfv@ep-dark-wave-aiklvq3x-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

async def migrate():
    with open("migration_result.txt", "w") as f:
        f.write("Starting migration...\n")
        try:
            parsed = urlparse(DB_URL)
            conn = await asyncpg.connect(
                user=parsed.username,
                password=parsed.password,
                host=parsed.hostname,
                database=parsed.path.lstrip('/'),
                ssl='require'
            )
            f.write("Connected!\n")
            
            cols = [
                ("preferred_language", "VARCHAR DEFAULT 'en'"),
                ("address", "JSON")
            ]
            
            for col, dtype in cols:
                try:
                    await conn.execute(f"ALTER TABLE user_profiles ADD COLUMN {col} {dtype};")
                    f.write(f"Added column: {col}\n")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        f.write(f"Column {col} already exists.\n")
                    else:
                        f.write(f"Error adding {col}: {e}\n")
            
            await conn.close()
            f.write("Done!\n")
        except Exception as e:
            f.write(f"Connection failed: {e}\n")

if __name__ == "__main__":
    asyncio.run(migrate())
