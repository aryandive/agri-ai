import asyncio
from sqlalchemy import text
from pg_database import engine

async def migrate():
    print(f"Connecting to: {engine.url.render_as_string(hide_password=True)}")
    async with engine.begin() as conn:
        print("Starting migration...")
        
        # Add preferred_language column
        try:
            await conn.execute(text("ALTER TABLE user_profiles ADD COLUMN preferred_language VARCHAR DEFAULT 'en';"))
            print("Added column: preferred_language")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column preferred_language already exists.")
            else:
                print(f"Error adding preferred_language: {e}")

        # Add address column
        try:
            await conn.execute(text("ALTER TABLE user_profiles ADD COLUMN address JSON;"))
            print("Added column: address")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column address already exists.")
            else:
                print(f"Error adding address: {e}")
        
        print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
