import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, text
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
    
    parsed = urlparse(DATABASE_URL)
    query_params = dict(parse_qsl(parsed.query))
    if 'sslmode' in query_params:
        query_params['ssl'] = query_params.pop('sslmode')
    query_params.pop('options', None)
    query_params.pop('channel_binding', None)
    
    host_ip = parsed.hostname
    db_password = parsed.password
    
    # Pre-resolve to avoid Windows asyncpg hanging
    try:
        if parsed.hostname and not parsed.hostname.replace('.', '').isdigit():
            import urllib.request, json
            proxy_handler = urllib.request.ProxyHandler({})
            opener = urllib.request.build_opener(proxy_handler)
            urllib.request.install_opener(opener)
            
            req = urllib.request.Request(
                f"https://dns.google/resolve?name={parsed.hostname}",
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                host_ip = next((a['data'] for a in data.get('Answer', []) if a['type'] == 1), parsed.hostname)
            
            if host_ip != parsed.hostname:
                endpoint_id = parsed.hostname.split('.')[0].replace('-pooler', '')
                db_password = f"endpoint={endpoint_id};{parsed.password}" if parsed.password else ""
    except Exception as e:
        print(f"⚠️ DoH resolution skip: {e}")
        host_ip = parsed.hostname

    # Reconstruct final URL
    netloc = f"{parsed.username}:{db_password}@{host_ip}:{parsed.port or 5432}" if parsed.username else host_ip
    DATABASE_URL = urlunparse((
        "postgresql+asyncpg",
        netloc,
        parsed.path,
        parsed.params,
        urlencode(query_params),
        parsed.fragment
    ))

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # Test connections before using them
    pool_recycle=300,    # Recycle connections every 5 minutes
    pool_size=5,         # Small pool for low-traffic dev app
    max_overflow=10,
    connect_args={
        "command_timeout": 30,
        "timeout": 30,
    }
)
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
    subscription_tier = Column(String, default="free")
    crop_doctor_uses = Column(Integer, default=0)
    # Storing an array of dicts: [{"crop": "wheat", "planted_date": "2023-11-01"}]
    crops = Column(JSON, nullable=True)
    preferred_language = Column(String, default="en")
    # Address structure: {"street": "", "city": "", "state": "", "zip": "", "phone": ""}
    address = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


async def get_pg_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_pg_db():
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
        
        # Safe migration for missing columns
        try:
             await conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR DEFAULT 'en';"))
             await conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address JSON;"))
        except Exception as e:
            print(f"⚠️ Schema migration notice: {e}")
            
        print("✅ Neon PostgreSQL database configured and migrated")
