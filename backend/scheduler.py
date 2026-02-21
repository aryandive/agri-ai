from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from services.mandi_fetcher import fetch_mandi_prices
from services.news_fetcher import fetch_all_news
from services.news_summarizer import summarize_unsummarized_articles

scheduler = AsyncIOScheduler()


def start_scheduler():
    """Start the APScheduler with all cron jobs."""

    # Mandi prices — every 6 hours
    scheduler.add_job(
        fetch_mandi_prices,
        trigger=IntervalTrigger(hours=6),
        id="mandi_fetch_job",
        name="Fetch Mandi Prices",
        replace_existing=True,
    )

    # News fetch — every 6 hours
    scheduler.add_job(
        fetch_all_news,
        trigger=IntervalTrigger(hours=6),
        id="news_fetch_job",
        name="Fetch Agriculture News",
        replace_existing=True,
    )

    # Gemini summarization — every 6 hours (runs after news fetch)
    scheduler.add_job(
        summarize_unsummarized_articles,
        trigger=IntervalTrigger(hours=6, minutes=10),
        id="news_summarize_job",
        name="Summarize News Articles",
        replace_existing=True,
    )

    scheduler.start()
    print("⏰ Scheduler started — mandi/news fetch every 6h, summarization every 6h+10m")


def stop_scheduler():
    """Shut down the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        print("⏰ Scheduler stopped")
