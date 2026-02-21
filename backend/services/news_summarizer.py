"""
Gemini Summarization Engine — Phase 4.
Converts raw news articles into farmer-friendly simplified summaries.
"""
import os
import json
import aiosqlite
from database import DB_PATH

SUMMARIZE_PROMPT = """You are an agriculture news simplifier for Indian farmers.

Given a news article, return ONLY valid JSON (no markdown, no explanation):

{
  "simplified_summary": "Explain in simple farmer-friendly language (2-3 sentences max)",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "who_is_eligible": "Who can benefit (or empty string if not applicable)",
  "deadline": "Any deadline mentioned (or empty string)",
  "category": "One of: scheme, policy, weather, mandi, subsidy",
  "region_tag": "State name or 'national'"
}

Article Title: {title}
Article Content: {content}

IMPORTANT: Return ONLY the JSON object. No text before or after."""

TRANSLATE_PROMPT = """Translate the following text into {language}. 
Keep it simple and farmer-friendly. Return ONLY the translation, no explanation.

Title: {title}

Summary: {summary}

Return as JSON:
{{
  "translated_title": "...",
  "translated_summary": "..."
}}"""


async def summarize_unsummarized_articles(limit: int = 20) -> dict:
    """Find articles without simplified summaries and use Gemini to summarize them."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"status": "error", "message": "GEMINI_API_KEY not configured"}

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash-lite")
    except Exception as e:
        return {"status": "error", "message": f"Gemini init failed: {e}"}

    db = await aiosqlite.connect(DB_PATH)
    cursor = await db.execute(
        "SELECT id, title, summary FROM news_articles WHERE is_summarized = 0 ORDER BY created_at DESC LIMIT ?",
        (limit,)
    )
    articles = await cursor.fetchall()

    summarized = 0
    errors = 0

    for article in articles:
        art_id, title, content = article[0], article[1], article[2]
        try:
            prompt = SUMMARIZE_PROMPT.format(title=title, content=content or "No content available")
            response = model.generate_content(prompt)
            text = response.text.strip()

            # Clean markdown code block wrapper if present
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

            data = json.loads(text)

            simplified = data.get("simplified_summary", "")
            key_points = json.dumps(data.get("key_points", []))
            category = data.get("category", "")
            region = data.get("region_tag", "")

            await db.execute("""
                UPDATE news_articles
                SET simplified_summary = ?, key_points = ?, is_summarized = 1,
                    category = COALESCE(NULLIF(?, ''), category),
                    region_tag = COALESCE(NULLIF(?, ''), region_tag)
                WHERE id = ?
            """, (simplified, key_points, category, region, art_id))
            summarized += 1

            # If it detected scheme info, create a scheme entry
            eligibility = data.get("who_is_eligible", "")
            deadline = data.get("deadline", "")
            if eligibility or (category == "scheme" and deadline):
                await db.execute("""
                    INSERT OR IGNORE INTO schemes 
                    (scheme_name, description, eligibility, benefits, deadline, region_tag, category, source_article_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (title, simplified, eligibility, simplified, deadline,
                      region or "national", category or "scheme", art_id))

        except json.JSONDecodeError:
            errors += 1
            # Still mark as summarized to avoid re-processing
            await db.execute("UPDATE news_articles SET is_summarized = 1 WHERE id = ?", (art_id,))
        except Exception as e:
            errors += 1
            print(f"❌ Summarize error for article {art_id}: {e}")

    await db.commit()
    await db.close()

    print(f"🤖 Summarized {summarized} articles, {errors} errors")
    return {"status": "success", "summarized": summarized, "errors": errors}


async def translate_article(article_id: int, language: str) -> dict | None:
    """Translate an article's simplified summary into the target language."""
    db = await aiosqlite.connect(DB_PATH)

    # Check cache first
    cursor = await db.execute(
        "SELECT translated_title, translated_summary FROM translations WHERE article_id = ? AND language = ?",
        (article_id, language)
    )
    cached = await cursor.fetchone()
    if cached:
        await db.close()
        return {"title": cached[0], "summary": cached[1], "cached": True}

    # Get article
    cursor = await db.execute(
        "SELECT title, simplified_summary FROM news_articles WHERE id = ?", (article_id,)
    )
    article = await cursor.fetchone()
    if not article:
        await db.close()
        return None

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        await db.close()
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash-lite")

        lang_map = {"hi": "Hindi", "mr": "Marathi", "ta": "Tamil", "te": "Telugu",
                     "bn": "Bengali", "gu": "Gujarati", "pa": "Punjabi", "kn": "Kannada"}
        lang_name = lang_map.get(language, language)

        prompt = TRANSLATE_PROMPT.format(
            language=lang_name,
            title=article[0] or "",
            summary=article[1] or article[0] or ""
        )
        response = model.generate_content(prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        data = json.loads(text)
        t_title = data.get("translated_title", "")
        t_summary = data.get("translated_summary", "")

        # Cache translation
        await db.execute(
            "INSERT OR REPLACE INTO translations (article_id, language, translated_title, translated_summary) VALUES (?, ?, ?, ?)",
            (article_id, language, t_title, t_summary)
        )
        await db.commit()
        await db.close()

        return {"title": t_title, "summary": t_summary, "cached": False}

    except Exception as e:
        await db.close()
        print(f"❌ Translation error: {e}")
        return None
