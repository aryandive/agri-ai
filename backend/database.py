import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "agri.db")


async def get_db():
    """Get a database connection."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Initialize all database tables and indexes."""
    db = await aiosqlite.connect(DB_PATH)

    # --- Mandi Prices ---
    await db.execute("""
        CREATE TABLE IF NOT EXISTS mandi_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            commodity TEXT NOT NULL,
            state TEXT,
            district TEXT,
            market TEXT,
            variety TEXT,
            min_price REAL,
            max_price REAL,
            modal_price REAL,
            date TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await db.execute("CREATE INDEX IF NOT EXISTS idx_commodity ON mandi_prices(commodity)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_mp_state ON mandi_prices(state)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_date ON mandi_prices(date)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_commodity_date ON mandi_prices(commodity, date)")

    # --- News Articles ---
    await db.execute("""
        CREATE TABLE IF NOT EXISTS news_articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            original_source TEXT,
            source_type TEXT DEFAULT 'RSS',
            summary TEXT,
            simplified_summary TEXT,
            key_points TEXT,
            region_tag TEXT DEFAULT 'national',
            category TEXT DEFAULT 'policy',
            url TEXT UNIQUE,
            url_hash TEXT UNIQUE,
            image_url TEXT,
            language TEXT DEFAULT 'en',
            is_summarized INTEGER DEFAULT 0,
            published_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await db.execute("CREATE INDEX IF NOT EXISTS idx_news_region ON news_articles(region_tag)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_news_source ON news_articles(source_type)")

    # --- Schemes ---
    await db.execute("""
        CREATE TABLE IF NOT EXISTS schemes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scheme_name TEXT NOT NULL,
            description TEXT,
            eligibility TEXT,
            benefits TEXT,
            deadline TEXT,
            region_tag TEXT DEFAULT 'national',
            category TEXT DEFAULT 'subsidy',
            application_link TEXT,
            is_urgent INTEGER DEFAULT 0,
            source_article_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_article_id) REFERENCES news_articles(id)
        )
    """)
    await db.execute("CREATE INDEX IF NOT EXISTS idx_scheme_region ON schemes(region_tag)")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_scheme_deadline ON schemes(deadline)")

    # --- Translations Cache ---
    await db.execute("""
        CREATE TABLE IF NOT EXISTS translations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER NOT NULL,
            language TEXT NOT NULL,
            translated_title TEXT,
            translated_summary TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(article_id, language),
            FOREIGN KEY (article_id) REFERENCES news_articles(id)
        )
    """)

    # --- User Profiles ---
    await db.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clerk_id TEXT UNIQUE NOT NULL,
            name TEXT,
            land_area_acres REAL,
            soil_type TEXT,
            location_lat REAL,
            location_lng REAL,
            crops TEXT DEFAULT '[]',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await db.execute("CREATE INDEX IF NOT EXISTS idx_clerk_id ON user_profiles(clerk_id)")

    await db.commit()
    await db.close()
    print("✅ Database initialized (mandi + news + schemes + translations + user_profiles)")
