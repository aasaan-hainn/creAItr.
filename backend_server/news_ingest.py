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
    for entry in feed.entries[:5]:
        text = f"[Published: {today_str}] Title: {entry.title}. Summary: {entry.summary}"
        # Store
        unique_id = f"news_{int(time.time())}_{feed.entries.index(entry)}"
        collection.upsert(
            ids=[unique_id], 
            documents=[text],
            metadatas=[{"type": "news", "title": entry.title, "date": today_str}]
        )
        news_data.append(entry.title)

    return news_data


def fetch_newsapi_data():
    print("Fetching data from NewsAPI...")
    all_articles = []
    
    # 1. Get Local News (West Bengal)
    local_url = f"https://newsapi.org/v2/everything?q=West+Bengal+scheme&sortBy=publishedAt&apiKey={config.NEWS_API_KEY}"
    try:
        local_resp = requests.get(local_url).json()
        if local_resp.get("status") == "ok":
            for article in local_resp["articles"][:3]: # Get top 3 local
                all_articles.append({
                    "title": article["title"],
                    "description": article["description"],
                    "content": article["content"],
                    "source": "Local News (West Bengal)",
                    "publishedAt": article.get("publishedAt", "")
                })
    except Exception as e:
        print(f"Error fetching local news: {e}")

    # 2. Get National News (India)
    national_url = f"https://newsapi.org/v2/top-headlines?country=in&category=general&apiKey={config.NEWS_API_KEY}"
    try:
        nat_resp = requests.get(national_url).json()
        if nat_resp.get("status") == "ok":
            for article in nat_resp["articles"][:3]: # Get top 3 national
                all_articles.append({
                    "title": article["title"],
                    "description": article["description"],
                    "content": article["content"],
                    "source": "National News (India)",
                    "publishedAt": article.get("publishedAt", "")
                })
    except Exception as e:
        print(f"Error fetching national news: {e}")

    # 3. Store in ChromaDB
    titles = []
    for idx, article in enumerate(all_articles):
        # Format Date
        pub_date = article['publishedAt'][:10] if article['publishedAt'] else datetime.datetime.now().strftime("%Y-%m-%d")
        
        full_text = f"""
        [Published: {pub_date}]
        SOURCE: {article['source']}
        TITLE: {article['title']}
        SUMMARY: {article['description']}
        CONTENT: {article['content']}
        """
        
        unique_id = f"newsapi_{int(time.time())}_{idx}"
        
        collection.upsert(
            ids=[unique_id],
            documents=[full_text],
            metadatas=[{"type": "news", "title": article['title'], "date": pub_date}]
        )
        titles.append(article['title'])
    
    return titles
