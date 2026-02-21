import os
import httpx
import aiosqlite
from database import DB_PATH
from datetime import datetime

DATA_GOV_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"


async def fetch_mandi_prices():
    """
    Fetch daily mandi prices from data.gov.in API and store in SQLite.
    Deduplicates by (commodity, market, date) to avoid duplicate rows.
    """
    api_key = os.getenv("DATA_GOV_API_KEY")
    if not api_key:
        print("❌ DATA_GOV_API_KEY not set in .env")
        return {"status": "error", "message": "DATA_GOV_API_KEY not configured"}

    params = {
        "api-key": api_key,
        "format": "json",
        "limit": 500,
        "offset": 0,
    }

    total_inserted = 0
    total_skipped = 0

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Fetch multiple pages
            for page in range(3):  # Up to 1500 records
                params["offset"] = page * 500
                response = await client.get(DATA_GOV_API_URL, params=params)
                response.raise_for_status()
                data = response.json()

                records = data.get("records", [])
                if not records:
                    break

                db = await aiosqlite.connect(DB_PATH)

                for record in records:
                    commodity = record.get("commodity", "").strip()
                    state = record.get("state", "").strip()
                    district = record.get("district", "").strip()
                    market = record.get("market", "").strip()
                    variety = record.get("variety", "").strip()
                    min_price = _parse_price(record.get("min_price"))
                    max_price = _parse_price(record.get("max_price"))
                    modal_price = _parse_price(record.get("modal_price"))
                    arrival_date = record.get("arrival_date", "").strip()

                    # Parse date to standard format
                    date_str = _parse_date(arrival_date)
                    if not commodity or not date_str:
                        continue

                    # Check for duplicates
                    cursor = await db.execute(
                        "SELECT id FROM mandi_prices WHERE commodity = ? AND market = ? AND date = ? AND variety = ?",
                        (commodity, market, date_str, variety)
                    )
                    existing = await cursor.fetchone()

                    if existing:
                        total_skipped += 1
                        continue

                    await db.execute(
                        """INSERT INTO mandi_prices 
                           (commodity, state, district, market, variety, min_price, max_price, modal_price, date)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (commodity, state, district, market, variety, min_price, max_price, modal_price, date_str)
                    )
                    total_inserted += 1

                await db.commit()
                await db.close()

                print(f"📦 Page {page + 1}: {len(records)} records fetched")

        result = {
            "status": "success",
            "inserted": total_inserted,
            "skipped": total_skipped,
            "timestamp": datetime.now().isoformat()
        }
        print(f"✅ Mandi fetch complete: {total_inserted} inserted, {total_skipped} skipped")
        return result

    except httpx.HTTPStatusError as e:
        msg = f"API returned {e.response.status_code}"
        print(f"❌ Mandi fetch failed: {msg}")
        return {"status": "error", "message": msg}
    except Exception as e:
        msg = str(e)
        print(f"❌ Mandi fetch failed: {msg}")
        return {"status": "error", "message": msg}


def _parse_price(value) -> float | None:
    """Safely parse a price value to float."""
    if value is None:
        return None
    try:
        return float(str(value).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def _parse_date(date_str: str) -> str | None:
    """Parse various date formats to YYYY-MM-DD."""
    if not date_str:
        return None
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d %b %Y"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None
