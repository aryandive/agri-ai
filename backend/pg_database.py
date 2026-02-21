import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(override=True)

# We need an async connection string for asyncpg
# Neon provides postgresql:// user... we need postgresql+asyncpg://
import socket
from urllib.parse import urlparse, urlencode, parse_qsl, urlunparse

# Correct DATABASE_URL — guaranteed good value
_KNOWN_GOOD_DB_URL = (
    "postgresql://neondb_owner:npg_r82jLKpFqHfv"
    "@ep-dark-wave-aiklvq3x-pooler.c-4.us-east-1.aws.neon.tech"
    "/neondb?sslmode=require&channel_binding=require"
)

DATABASE_URL = os.getenv("DATABASE_URL") or _KNOWN_GOOD_DB_URL

# Auto-correct any typos in the hostname that may sneak in from bad env caches
# (e.g. 'tecch' -> 'tech', 'neonn.tech' -> 'neon.tech')
if DATABASE_URL:
    import re
    DATABASE_URL = re.sub(r'neon+\.tech', 'neon.tech', DATABASE_URL)
    DATABASE_URL = re.sub(r'tec+h', 'tech', DATABASE_URL)

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Parse the URL to safely modify query parameters
    parsed = urlparse(DATABASE_URL)
    query_params = dict(parse_qsl(parsed.query))
    
    # asyncpg expects 'ssl=require' instead of 'sslmode=require'
    if 'sslmode' in query_params:
        query_params['ssl'] = query_params.pop('sslmode')
    
    # asyncpg does not support all fallback query parameters like options or channel_binding
    query_params.pop('options', None)
    query_params.pop('channel_binding', None)
    
    # Handle Windows asyncpg getaddrinfo issue by pre-resolving the Neon host IP
    try:
        if parsed.hostname and not parsed.hostname.replace('.', '').isdigit():
            # It's a hostname, not an IP, let's resolve it
            host_ip = socket.gethostbyname(parsed.hostname)
            # Reconstruct netloc with the resolved IP
            netloc = f"{parsed.username}:{parsed.password}@{host_ip}:{parsed.port or 5432}"
        else:
            netloc = parsed.netloc
    except Exception as e:
        print(f"⚠️ Could not resolve database hostname {parsed.hostname}: {e}")
        netloc = parsed.netloc
    
    # Reconstruct the URL
    new_query = urlencode(query_params)
    DATABASE_URL = urlunparse(
        (parsed.scheme, netloc, parsed.path, parsed.params, new_query, parsed.fragment)
    )

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    clerk_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    land_area_acres = Column(Float, nullable=True)
    soil_type = Column(String, nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    # Storing an array of dicts: [{"crop": "wheat", "planted_date": "2023-11-01"}]
    crops = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


async def get_pg_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_pg_db():
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Neon PostgreSQL database configured")
