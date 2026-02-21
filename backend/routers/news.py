"""
News & Schemes API — Phase 5.
Endpoints for filtered news, schemes, translation, and manual fetch/summarize triggers.
"""
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Query, HTTPException
from database import get_db
from services.news_fetcher import fetch_all_news
from services.news_summarizer import summarize_unsummarized_articles, translate_article

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("/articles")
async def get_articles(
    state: str = Query(None, description="Filter by state (or 'national')"),
    category: str = Query(None, description="Filter by category"),
    search: str = Query(None, description="Search in title/summary"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Get news articles with region and category filtering."""
    db = await get_db()

    query = """
        SELECT id, title, original_source, source_type, summary, simplified_summary,
               key_points, region_tag, category, url, image_url, published_at, created_at
        FROM news_articles WHERE 1=1
    """
    params = []

    if state:
        # Show national + matching state
        query += " AND (LOWER(region_tag) = 'national' OR LOWER(region_tag) = ?)"
        params.append(state.lower())
    if category:
        query += " AND LOWER(category) = ?"
        params.append(category.lower())
    if search:
        query += " AND (LOWER(title) LIKE ? OR LOWER(summary) LIKE ?)"
        params.extend([f"%{search.lower()}%", f"%{search.lower()}%"])

    query += " ORDER BY published_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()

    # Get total count
    count_query = "SELECT COUNT(*) FROM news_articles WHERE 1=1"
    count_params = []
    if state:
        count_query += " AND (LOWER(region_tag) = 'national' OR LOWER(region_tag) = ?)"
        count_params.append(state.lower())
    if category:
        count_query += " AND LOWER(category) = ?"
        count_params.append(category.lower())

    cursor = await db.execute(count_query, count_params)
    total = (await cursor.fetchone())[0]

    await db.close()

    import json

    return {
        "total": total,
        "count": len(rows),
        "articles": [
            {
                "id": row[0],
                "title": row[1],
                "source": row[2],
                "source_type": row[3],
                "summary": row[4],
                "simplified_summary": row[5],
                "key_points": json.loads(row[6]) if row[6] else [],
                "region": row[7],
                "category": row[8],
                "url": row[9],
                "image_url": row[10],
                "published_at": row[11],
                "created_at": row[12],
            }
            for row in rows
        ],
    }


@router.get("/schemes")
async def get_schemes(
    state: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """Get government schemes with region filtering and urgency detection."""
    db = await get_db()

    query = """
        SELECT id, scheme_name, description, eligibility, benefits, deadline,
               region_tag, category, application_link, is_urgent, created_at
        FROM schemes WHERE 1=1
    """
    params = []

    if state:
        query += " AND (LOWER(region_tag) = 'national' OR LOWER(region_tag) = ?)"
        params.append(state.lower())

    query += " ORDER BY is_urgent DESC, deadline ASC LIMIT ?"
    params.append(limit)

    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    await db.close()

    return {
        "count": len(rows),
        "schemes": [
            {
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "eligibility": row[3],
                "benefits": row[4],
                "deadline": row[5],
                "region": row[6],
                "category": row[7],
                "application_link": row[8],
                "is_urgent": bool(row[9]),
                "created_at": row[10],
            }
            for row in rows
        ],
    }


@router.get("/categories")
async def get_categories():
    """Get unique categories."""
    db = await get_db()
    cursor = await db.execute("SELECT DISTINCT category FROM news_articles ORDER BY category")
    rows = await cursor.fetchall()
    await db.close()
    return {"categories": [row[0] for row in rows if row[0]]}


@router.get("/states")
async def get_states():
    """Get unique states/regions."""
    db = await get_db()
    cursor = await db.execute("SELECT DISTINCT region_tag FROM news_articles ORDER BY region_tag")
    rows = await cursor.fetchall()
    await db.close()
    return {"states": [row[0] for row in rows if row[0]]}


@router.post("/translate/{article_id}")
async def translate(article_id: int, language: str = Query("hi", description="Language code: hi, mr, ta, te, bn, gu, pa, kn")):
    """Translate an article to target language (cached)."""
    result = await translate_article(article_id, language)
    if not result:
        raise HTTPException(status_code=404, detail="Article not found or translation failed")
    return result


@router.post("/fetch")
async def trigger_fetch():
    """Manually trigger news fetch from all sources."""
    result = await fetch_all_news()
    return result


@router.post("/summarize")
async def trigger_summarize(limit: int = Query(20)):
    """Manually trigger Gemini summarization of unsummarized articles."""
    result = await summarize_unsummarized_articles(limit)
    return result


@router.post("/fetch-and-summarize")
async def fetch_and_summarize():
    """Fetch news + auto-summarize in one call."""
    fetch_result = await fetch_all_news()
    summarize_result = await summarize_unsummarized_articles(20)
    return {
        "fetch": fetch_result,
        "summarize": summarize_result,
    }


@router.post("/mark-urgent")
async def mark_urgent_schemes():
    """Auto-mark schemes with deadline within 15 days as urgent."""
    db = await get_db()
    today = datetime.now().strftime("%Y-%m-%d")
    cutoff = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")

    await db.execute("""
        UPDATE schemes SET is_urgent = 1
        WHERE deadline != '' AND deadline IS NOT NULL
        AND deadline >= ? AND deadline <= ?
    """, (today, cutoff))

    cursor = await db.execute("SELECT COUNT(*) FROM schemes WHERE is_urgent = 1")
    count = (await cursor.fetchone())[0]

    await db.commit()
    await db.close()
    return {"urgent_schemes": count}
