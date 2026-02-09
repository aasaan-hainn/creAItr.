"""
YouTube Stats Module
Handles YouTube Data API integration for fetching channel statistics,
30-day growth tracking, and graph generation.
"""

import io
import base64
import datetime
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np

import config
from mongodb import users_collection, channel_stats_collection


def get_youtube_service():
    """Initialize YouTube Data API service"""
    if not config.YOUTUBE_API_KEY:
        raise ValueError("YouTube API key not configured")
    return build('youtube', 'v3', developerKey=config.YOUTUBE_API_KEY)


def get_channel_stats(channel_id: str) -> dict:
    """
    Fetch real-time channel statistics from YouTube API
    Returns: {subscribers, views, videoCount, subscriberHidden, title, thumbnail}
    """
    try:
        youtube = get_youtube_service()
        
        request = youtube.channels().list(
            part='statistics,snippet',
            id=channel_id
        )
        response = request.execute()
        
        if not response.get('items'):
            return None
        
        channel = response['items'][0]
        stats = channel['statistics']
        snippet = channel['snippet']
        
        return {
            'channelId': channel_id,
            'title': snippet.get('title', ''),
            'thumbnail': snippet.get('thumbnails', {}).get('default', {}).get('url', ''),
            'subscribers': int(stats.get('subscriberCount', 0)),
            'views': int(stats.get('viewCount', 0)),
            'videoCount': int(stats.get('videoCount', 0)),
            'subscriberHidden': stats.get('hiddenSubscriberCount', False)
        }
    except HttpError as e:
        print(f"YouTube API error: {e}")
        return None
    except Exception as e:
        print(f"Error fetching channel stats: {e}")
        return None


def save_stats_snapshot(user_id: str, stats: dict) -> bool:
    """
    Save a snapshot of channel stats to the database.
    Called when user first adds channel or every 30 days.
    """
    try:
        snapshot = {
            'userId': user_id,
            'channelId': stats['channelId'],
            'subscribers': stats['subscribers'],
            'views': stats['views'],
            'videoCount': stats['videoCount'],
            'recordedAt': datetime.datetime.utcnow()
        }
        channel_stats_collection.insert_one(snapshot)
        
        # Update user's last stats update time
        users_collection.update_one(
            {'_id': user_id} if isinstance(user_id, str) else {'_id': user_id},
            {'$set': {'lastStatsUpdate': datetime.datetime.utcnow()}}
        )
        return True
    except Exception as e:
        print(f"Error saving stats snapshot: {e}")
        return False


def should_update_snapshot(user_id: str) -> bool:
    """Check if a snapshot should be saved (once per day)"""
    from bson import ObjectId
    
    # Get the most recent snapshot
    last_snapshot = channel_stats_collection.find_one(
        {'userId': user_id},
        sort=[('recordedAt', -1)]
    )
    
    if not last_snapshot:
        return True  # No previous update, should save
    
    # Check if the last snapshot was on a different day
    last_update = last_snapshot.get('recordedAt')
    today = datetime.datetime.utcnow().date()
    
    return last_update.date() < today


def get_stats_history(user_id: str, limit: int = 12) -> list:
    """Get historical stats for a user (last N snapshots)"""
    from bson import ObjectId
    
    snapshots = list(channel_stats_collection.find(
        {'userId': user_id},
        {'_id': 0}
    ).sort('recordedAt', -1).limit(limit))
    
    # Reverse to get chronological order
    return list(reversed(snapshots))


def calculate_growth(user_id: str, current_stats: dict) -> dict:
    """
    Calculate 30-day growth percentages.
    Formula: ((today - 30_days_ago) / 30_days_ago) * 100
    """
    from bson import ObjectId
    
    # Get the snapshot from ~30 days ago
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    
    old_snapshot = channel_stats_collection.find_one(
        {
            'userId': user_id,
            'recordedAt': {'$lte': thirty_days_ago}
        },
        sort=[('recordedAt', -1)]
    )
    
    if not old_snapshot:
        # Try to get the oldest snapshot available
        old_snapshot = channel_stats_collection.find_one(
            {'userId': user_id},
            sort=[('recordedAt', 1)]
        )
    
    if not old_snapshot:
        return {
            'subscriberGrowth': 0,
            'viewGrowth': 0,
            'subscriberDiff': 0,
            'viewDiff': 0,
            'daysSinceSnapshot': 0
        }
    
    days_diff = (datetime.datetime.utcnow() - old_snapshot['recordedAt']).days
    
    old_subs = old_snapshot.get('subscribers', 0)
    old_views = old_snapshot.get('views', 0)
    current_subs = current_stats.get('subscribers', 0)
    current_views = current_stats.get('views', 0)
    
    # Calculate growth percentages (avoid division by zero)
    sub_growth = ((current_subs - old_subs) / old_subs * 100) if old_subs > 0 else 0
    view_growth = ((current_views - old_views) / old_views * 100) if old_views > 0 else 0
    
    return {
        'subscriberGrowth': round(sub_growth, 2),
        'viewGrowth': round(view_growth, 2),
        'subscriberDiff': current_subs - old_subs,
        'viewDiff': current_views - old_views,
        'daysSinceSnapshot': days_diff
    }


def generate_growth_graph(user_id: str) -> str:
    """
    Generate a growth graph showing subscriber and view trends.
    Returns base64 encoded PNG image.
    """
    history = get_stats_history(user_id, limit=12)
    
    if len(history) < 2:
        # Not enough data for a graph
        return None
    
    # Extract data
    dates = [h['recordedAt'] for h in history]
    subscribers = [h['subscribers'] for h in history]
    views = [h['views'] for h in history]
    
    # Create figure with dark theme
    plt.style.use('dark_background')
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6), facecolor='#0a0a0a')
    fig.patch.set_facecolor('#0a0a0a')
    
    # Subscriber graph
    ax1.set_facecolor('#0a0a0a')
    ax1.plot(dates, subscribers, color='#818cf8', linewidth=2, marker='o', markersize=4)
    ax1.fill_between(dates, subscribers, alpha=0.3, color='#818cf8')
    ax1.set_ylabel('Subscribers', color='#818cf8', fontsize=10)
    ax1.tick_params(axis='y', labelcolor='#818cf8')
    ax1.tick_params(axis='x', labelcolor='#6b7280')
    ax1.set_title('Subscriber Growth', color='white', fontsize=12, pad=10)
    ax1.grid(True, alpha=0.1, color='white')
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.spines['bottom'].set_color('#374151')
    ax1.spines['left'].set_color('#374151')
    
    # Format x-axis dates
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
    ax1.xaxis.set_major_locator(mdates.AutoDateLocator())
    
    # Views graph
    ax2.set_facecolor('#0a0a0a')
    ax2.plot(dates, views, color='#34d399', linewidth=2, marker='o', markersize=4)
    ax2.fill_between(dates, views, alpha=0.3, color='#34d399')
    ax2.set_ylabel('Views', color='#34d399', fontsize=10)
    ax2.tick_params(axis='y', labelcolor='#34d399')
    ax2.tick_params(axis='x', labelcolor='#6b7280')
    ax2.set_title('View Growth', color='white', fontsize=12, pad=10)
    ax2.grid(True, alpha=0.1, color='white')
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    ax2.spines['bottom'].set_color('#374151')
    ax2.spines['left'].set_color('#374151')
    
    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
    ax2.xaxis.set_major_locator(mdates.AutoDateLocator())
    
    plt.tight_layout(pad=2)
    
    # Save to bytes buffer
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight', facecolor='#0a0a0a')
    buffer.seek(0)
    plt.close(fig)
    
    # Encode to base64
    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{image_base64}"
