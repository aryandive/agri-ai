import os
from fastapi import APIRouter, Query, HTTPException
from database import get_db
from services.mandi_fetcher import fetch_mandi_prices

router = APIRouter(prefix="/api/mandi", tags=["mandi"])


@router.get("/prices")
async def get_prices(
    commodity: str = Query(None, description="Filter by commodity name"),
    state: str = Query(None, description="Filter by state"),
    market: str = Query(None, description="Filter by market"),
    limit: int = Query(100, ge=1, le=500),
):
    """Get latest mandi prices with optional filters."""
    db = await get_db()

    query = """
        SELECT commodity, state, district, market, variety,
               min_price, max_price, modal_price, date
        FROM mandi_prices
        WHERE 1=1
    """
    params = []

    if commodity:
        query += " AND LOWER(commodity) LIKE ?"
        params.append(f"%{commodity.lower()}%")
    if state:
        query += " AND LOWER(state) LIKE ?"
        params.append(f"%{state.lower()}%")
    if market:
        query += " AND LOWER(market) LIKE ?"
        params.append(f"%{market.lower()}%")

    query += " ORDER BY date DESC, commodity ASC LIMIT ?"
    params.append(limit)

    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    await db.close()

    return {
        "count": len(rows),
        "prices": [
            {
                "commodity": row[0],
                "state": row[1],
                "district": row[2],
                "market": row[3],
                "variety": row[4],
                "min_price": row[5],
                "max_price": row[6],
                "modal_price": row[7],
                "date": row[8],
            }
            for row in rows
        ],
    }


@router.get("/trend")
async def get_trend(
    commodity: str = Query(..., description="Commodity name"),
    days: int = Query(7, ge=1, le=90, description="Number of days for trend"),
    market: str = Query(None, description="Optional market filter"),
):
    """Get historical price trend for a commodity."""
    db = await get_db()

    query = """
        SELECT date, AVG(modal_price) as avg_price, 
               MIN(min_price) as low, MAX(max_price) as high,
               COUNT(*) as markets
        FROM mandi_prices
        WHERE LOWER(commodity) = ?
          AND date >= date('now', ?)
    """
    params = [commodity.lower(), f"-{days} days"]

    if market:
        query += " AND LOWER(market) LIKE ?"
        params.append(f"%{market.lower()}%")

    query += " GROUP BY date ORDER BY date ASC"

    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    await db.close()

    return {
        "commodity": commodity,
        "days": days,
        "trend": [
            {
                "date": row[0],
                "avg_price": round(row[1], 2) if row[1] else None,
                "low": row[2],
                "high": row[3],
                "markets": row[4],
            }
            for row in rows
        ],
    }


@router.get("/commodities")
async def get_commodities():
    """Get list of unique commodities in the database."""
    db = await get_db()
    cursor = await db.execute(
        "SELECT DISTINCT commodity FROM mandi_prices ORDER BY commodity ASC"
    )
    rows = await cursor.fetchall()
    await db.close()

    return {"commodities": [row[0] for row in rows]}


@router.get("/states")
async def get_states():
    """Get list of unique states in the database."""
    db = await get_db()
    cursor = await db.execute(
        "SELECT DISTINCT state FROM mandi_prices ORDER BY state ASC"
    )
    rows = await cursor.fetchall()
    await db.close()

    return {"states": [row[0] for row in rows]}


@router.post("/fetch")
async def trigger_fetch():
    """Manually trigger a mandi price fetch from data.gov.in."""
    result = await fetch_mandi_prices()
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return result
