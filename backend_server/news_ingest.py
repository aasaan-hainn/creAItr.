import time
import datetime
import feedparser
import requests
import config
from database import collection

def clear_existing_news():
    """Wipes old news to prevent stale data conflicts."""
    print("Clearing old news from database...")
    try:
        collection.delete(where={"type": "news"})
    except Exception as e:
        print(f"No existing news to clear or error: {e}")

def fetch_and_store_news():
    print("Scraping Google News...")
    feed = feedparser.parse(config.RSS_URL)
    news_data = []
    
    # Simple date string for today (since RSS pubDate parsing can be messy)
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")

    # Get top 5
    for idx, entry in enumerate(feed.entries[:5]):
        text = f"[Published: {today_str}] Title: {entry.title}. Summary: {entry.summary}"
        # Store
        unique_id = f"news_{int(time.time())}_{idx}"
        collection.upsert(
            ids=[unique_id], 
            documents=[text],
            metadatas=[{"type": "news", "title": entry.title, "date": today_str}]
        )
        news_data.append({
            "title": entry.title,
            "description": entry.summary,
            "content": entry.summary,
            "source": "Google News",
            "publishedAt": today_str
        })

    return news_data


def fetch_newsapi_data():
    return fetch_trends()

def fetch_trends(category=None, query=None):
    print(f"Fetching trends from NewsAPI (category={category}, query={query})...")
    all_articles = []
    
    # Base URL for NewsAPI
    if category and category != 'all':
        url = f"https://newsapi.org/v2/top-headlines?country=us&category={category}&apiKey={config.NEWS_API_KEY}"
    elif query:
        url = f"https://newsapi.org/v2/everything?q={query}&sortBy=publishedAt&apiKey={config.NEWS_API_KEY}"
    else:
        # Default to general top headlines if nothing specified
        url = f"https://newsapi.org/v2/top-headlines?country=us&category=general&apiKey={config.NEWS_API_KEY}"

    try:
        resp = requests.get(url).json()
        if resp.get("status") == "ok":
            for article in resp["articles"]:
                all_articles.append({
                    "title": article["title"],
                    "description": article["description"],
                    "content": article["content"],
                    "urlToImage": article.get("urlToImage"),
                    "url": article.get("url"),
                    "source": article.get("source", {}).get("name", "News"),
                    "publishedAt": article.get("publishedAt", "")
                })
    except Exception as e:
        print(f"Error fetching trends: {e}")

    return all_articles
