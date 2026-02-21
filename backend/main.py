from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

# Load .env BEFORE importing routers (they read env vars at module level)
load_dotenv(override=True)

from routers import analyze, weather, mandi, news, users, planner
from database import init_db
from pg_database import init_pg_db
from scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    # Startup
    await init_db()  # SQLite
    try:
        await init_pg_db() # Neon PostgreSQL
    except Exception as e:
        print(f"⚠️ Neon PostgreSQL unavailable: {e}. User profile features will be disabled.")
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()

app = FastAPI(
    title="Agri AI Backend",
    description="Agricultural AI Assistant — Plant Disease Detection, Weather, Mandi Prices & News",
    version="1.1.0",
    lifespan=lifespan,
)

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(analyze.router)
app.include_router(weather.router)
app.include_router(mandi.router)
app.include_router(news.router)
app.include_router(users.router)
app.include_router(planner.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Agri AI Backend is running"}
