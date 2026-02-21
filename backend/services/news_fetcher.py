"""
News Fetcher — Fetches agriculture news from RSS feeds and Google News.
Phase 2 + Phase 3 of the News system.
"""
import os
import hashlib
from datetime import datetime
import httpx
import feedparser
import aiosqlite
from database import DB_PATH

# --- RSS Feed Sources ---
RSS_FEEDS = [
    {
        "name": "PIB Agriculture",
        "url": "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
        "source_type": "PIB",
        "region_tag": "national",
    },
    {
        "name": "PIB Rural",
        "url": "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=102",
        "source_type": "PIB",
        "region_tag": "national",
    },
    {
        "name": "Google News - Agriculture India",
        "url": "https://news.google.com/rss/search?q=agriculture+india+farming+when:7d&hl=en-IN&gl=IN&ceid=IN:en",
        "source_type": "NewsAPI",
        "region_tag": "national",
    },
    {
        "name": "Google News - MSP Farmers",
        "url": "https://news.google.com/rss/search?q=MSP+farmers+india+when:7d&hl=en-IN&gl=IN&ceid=IN:en",
        "source_type": "NewsAPI",
        "region_tag": "national",
    },
    {
        "name": "Google News - Crop Insurance Subsidy",
        "url": "https://news.google.com/rss/search?q=crop+insurance+subsidy+india+when:7d&hl=en-IN&gl=IN&ceid=IN:en",
        "source_type": "NewsAPI",
        "region_tag": "national",
    },
    {
        "name": "Google News - Mandi Prices",
        "url": "https://news.google.com/rss/search?q=mandi+prices+agriculture+india+when:7d&hl=en-IN&gl=IN&ceid=IN:en",
        "source_type": "NewsAPI",
        "region_tag": "national",
    },
]

# Agriculture keywords filter
AGRI_KEYWORDS = [
    "agriculture", "farming", "farmer", "kisan", "crop", "harvest",
    "msp", "mandi", "subsidy", "irrigation", "fertilizer", "pesticide",
    "wheat", "rice", "cotton", "soybean", "tomato", "potato", "onion",
    "pm-kisan", "pm kisan", "crop insurance", "fasal bima",
    "rural", "agri", "tractor", "seed", "livestock", "dairy",
    "horticulture", "floriculture", "fisheries",
]

# State keywords for auto-tagging
STATE_KEYWORDS = {
    "Maharashtra": ["maharashtra", "mumbai", "pune", "nagpur", "nashik"],
    "Uttar Pradesh": ["uttar pradesh", "lucknow", "noida", "agra", "varanasi"],
    "Punjab": ["punjab", "ludhiana", "amritsar", "chandigarh"],
    "Haryana": ["haryana", "gurugram", "karnal", "hisar"],
    "Madhya Pradesh": ["madhya pradesh", "bhopal", "indore"],
    "Rajasthan": ["rajasthan", "jaipur", "jodhpur", "udaipur"],
    "Karnataka": ["karnataka", "bangalore", "bengaluru", "mysore"],
    "Tamil Nadu": ["tamil nadu", "chennai", "coimbatore", "madurai"],
    "Gujarat": ["gujarat", "ahmedabad", "surat", "vadodara"],
    "Andhra Pradesh": ["andhra pradesh", "hyderabad", "visakhapatnam", "vijayawada"],
    "Telangana": ["telangana", "hyderabad", "warangal"],
    "West Bengal": ["west bengal", "kolkata"],
    "Bihar": ["bihar", "patna"],
    "Odisha": ["odisha", "bhubaneswar"],
    "Kerala": ["kerala", "kochi", "thiruvananthapuram"],
    "Assam": ["assam", "guwahati"],
    "Jharkhand": ["jharkhand", "ranchi"],
    "Chhattisgarh": ["chhattisgarh", "raipur"],
}

# Category detection keywords
CATEGORY_KEYWORDS = {
    "scheme": ["scheme", "yojana", "pm-kisan", "fasal bima", "subsidy", "benefit", "application", "eligible"],
    "subsidy": ["subsidy", "grant", "aid", "relief", "compensation", "dbt"],
    "mandi": ["mandi", "msp", "market", "price", "commodity", "trade"],
    "weather": ["weather", "rainfall", "drought", "flood", "monsoon", "cyclone", "forecast"],
    "policy": ["policy", "act", "regulation", "reform", "bill", "ordinance", "ministry"],
}


def _url_hash(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()


def _detect_region(text: str) -> str:
    text_lower = text.lower()
    for state, keywords in STATE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return state
    return "national"


def _detect_category(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        scores[cat] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "policy"


def _is_agriculture_relevant(title: str, summary: str) -> bool:
    text = f"{title} {summary}".lower()
    return any(kw in text for kw in AGRI_KEYWORDS)


async def fetch_all_news() -> dict:
    """Fetch news from all RSS sources."""
    total_inserted = 0
    total_skipped = 0
    errors = []

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        for feed_config in RSS_FEEDS:
            try:
                resp = await client.get(feed_config["url"])
                resp.raise_for_status()
                feed = feedparser.parse(resp.text)

                db = await aiosqlite.connect(DB_PATH)

                for entry in feed.entries[:30]:  # Cap per feed
                    title = entry.get("title", "").strip()
                    summary = entry.get("summary", entry.get("description", "")).strip()
                    link = entry.get("link", "").strip()
                    published = entry.get("published", "")

                    if not title or not link:
                        continue

                    # Agriculture relevance filter
                    if feed_config["source_type"] == "NewsAPI":
                        if not _is_agriculture_relevant(title, summary):
                            total_skipped += 1
                            continue

                    # Parse publish date
                    pub_date = None
                    for fmt in ["%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S GMT",
                                "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"]:
                        try:
                            pub_date = datetime.strptime(published, fmt).strftime("%Y-%m-%d %H:%M")
                            break
                        except ValueError:
                            continue
                    if not pub_date:
                        pub_date = datetime.now().strftime("%Y-%m-%d %H:%M")

                    # Auto-detect region and category
                    full_text = f"{title} {summary}"
                    region = _detect_region(full_text)
                    category = _detect_category(full_text)
                    url_h = _url_hash(link)

                    # Check duplicate
                    cursor = await db.execute("SELECT id FROM news_articles WHERE url_hash = ?", (url_h,))
                    if await cursor.fetchone():
                        total_skipped += 1
                        continue

                    # Clean summary (strip HTML tags)
                    import re
                    clean_summary = re.sub(r"<[^>]+>", "", summary)[:500]

                    await db.execute("""
                        INSERT INTO news_articles
                        (title, original_source, source_type, summary, region_tag, category, url, url_hash, published_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (title, feed_config["name"], feed_config["source_type"],
                          clean_summary, region, category, link, url_h, pub_date))
                    total_inserted += 1

                await db.commit()
                await db.close()
                print(f"📰 {feed_config['name']}: processed")

            except Exception as e:
                errors.append(f"{feed_config['name']}: {str(e)}")
                print(f"❌ {feed_config['name']}: {e}")

    result = {
        "status": "success" if not errors else "partial",
        "inserted": total_inserted,
        "skipped": total_skipped,
        "errors": errors,
        "timestamp": datetime.now().isoformat(),
    }
    print(f"✅ News fetch: {total_inserted} inserted, {total_skipped} skipped, {len(errors)} errors")
    return result
