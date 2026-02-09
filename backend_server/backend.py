import json
import datetime
import os
import time
import tempfile
import requests
from flask import Flask, request, Response, stream_with_context, send_file, jsonify
from flask_cors import CORS
from openai import OpenAI
from google import genai
from bson import ObjectId

import config
from database import collection
from mongodb import projects_collection, users_collection, chats_collection
from news_ingest import fetch_and_store_news, fetch_newsapi_data, clear_existing_news
from pdf_ingest import ingest_local_pdfs
from tts import generate_tts_audio
from auth import (
    hash_password,
    verify_password,
    generate_token,
    verify_token,
    token_required,
    verify_google_token,
)
from youtube_stats import (
    get_channel_stats,
    save_stats_snapshot,
    should_update_snapshot,
    calculate_growth,
    generate_growth_graph,
    get_stats_history,
)

# --- SERVER SETUP ---
app = Flask(__name__)
CORS(app)

print("Initializing NVIDIA Client...")
nvidia_client = OpenAI(base_url=config.NVIDIA_BASE_URL, api_key=config.NVIDIA_API_KEY)

print("Initializing Gemini Client...")
try:
    genai_client = genai.Client(api_key=config.GEMINI_API_KEY)
except Exception as e:
    print(f"Warning: Gemini Client failed to initialize: {e}")
    genai_client = None


# --- API ROUTES ---


# --- AUTHENTICATION ROUTES ---


@app.route("/auth/register", methods=["POST"])
def register():
    """Register a new user"""
    data = request.json

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirmPassword", "")
    social_accounts = data.get("socialAccounts", [])  # Array of {platform, handle}

    # Validation
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Check if user already exists
    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        return jsonify({"error": "Email already exists"}), 409

    # Create user
    hashed_password = hash_password(password)
    user = {
        "email": email,
        "password": hashed_password,
        "socialAccounts": social_accounts,  # Store as array
        "createdAt": datetime.datetime.now().isoformat(),
    }

    result = users_collection.insert_one(user)
    user_id = str(result.inserted_id)

    # Generate token
    token = generate_token(user_id, email)

    return jsonify(
        {
            "message": "User registered successfully",
            "token": token,
            "user": {"id": user_id, "email": email, "socialAccounts": social_accounts},
        }
    ), 201


@app.route("/auth/login", methods=["POST"])
def login():
    """Login user and return JWT token"""
    data = request.json

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Find user
    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    # Verify password
    if not verify_password(password, user["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    # Generate token
    user_id = str(user["_id"])
    token = generate_token(user_id, email)

    return jsonify(
        {
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user_id,
                "email": user["email"],
                "socialAccounts": user.get("socialAccounts", []),
            },
        }
    )


@app.route("/auth/google", methods=["POST"])
def google_login():
    """Login or register with Google"""
    data = request.json
    token = data.get("token")

    if not token:
        return jsonify({"error": "Token is required"}), 400

    id_info = verify_google_token(token)
    if not id_info:
        return jsonify({"error": "Invalid Google token"}), 401

    email = id_info.get("email").lower()

    # Check if user exists
    user = users_collection.find_one({"email": email})

    if not user:
        # Create new user
        user = {
            "email": email,
            "password": "",  # No password for Google users
            "socialAccounts": [],
            "createdAt": datetime.datetime.now().isoformat(),
            "googleId": id_info.get("id"),
            "name": id_info.get("name"),
            "picture": id_info.get("picture"),
        }
        result = users_collection.insert_one(user)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
        # Update google info if missing
        if "googleId" not in user:
            users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "googleId": id_info.get("id"),
                        "name": user.get("name") or id_info.get("name"),
                        "picture": user.get("picture") or id_info.get("picture"),
                    }
                },
            )

    # Generate JWT
    jwt_token = generate_token(user_id, email)

    return jsonify(
        {
            "message": "Login successful",
            "token": jwt_token,
            "user": {
                "id": user_id,
                "email": email,
                "socialAccounts": user.get("socialAccounts", []),
                "name": user.get("name") or id_info.get("name"),
                "picture": user.get("picture") or id_info.get("picture"),
            },
        }
    )


@app.route("/auth/verify", methods=["GET"])
def verify_auth():
    """Verify JWT token and return user data"""
    token = None

    if "Authorization" in request.headers:
        auth_header = request.headers["Authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return jsonify({"valid": False, "error": "No token provided"}), 401

    payload = verify_token(token)
    if not payload:
        return jsonify({"valid": False, "error": "Invalid or expired token"}), 401

    # Get user from database
    user = users_collection.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        return jsonify({"valid": False, "error": "User not found"}), 404

    return jsonify(
        {
            "valid": True,
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "socialAccounts": user.get("socialAccounts", []),
            },
        }
    )


@app.route("/auth/me", methods=["GET"])
@token_required
def get_current_user():
    """Get current logged-in user profile"""
    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(
        {
            "id": str(user["_id"]),
            "email": user["email"],
            "socialAccounts": user.get("socialAccounts", []),
            "createdAt": user.get("createdAt", ""),
        }
    )


# --- YOUTUBE STATS ROUTES ---


@app.route("/analytics", methods=["GET"])
@token_required
def get_analytics():
    """
    Get real YouTube Analytics data from database snapshots.
    Returns cumulative stats (total views, subscribers) for meaningful graph display.
    """
    from mongodb import channel_stats_collection

    # Fetch snapshots for this user
    snapshots = list(
        channel_stats_collection.find({"userId": request.user_id}).sort("recordedAt", 1)
    )

    if not snapshots:
        return jsonify(
            {
                "columns": ["day", "views", "watchTimeMinutes", "subscribersGained"],
                "rows": [],
            }
        )

    # Deduplicate snapshots by date (keep latest snapshot per day)
    seen_dates = {}
    for s in snapshots:
        day_str = s["recordedAt"].date().isoformat()
        seen_dates[day_str] = s  # Later entries overwrite earlier ones
    
    # Convert back to sorted list
    unique_snapshots = [seen_dates[key] for key in sorted(seen_dates.keys())]

    rows = []
    for i, s in enumerate(unique_snapshots):
        day_str = s["recordedAt"].date().isoformat()

        # Use cumulative totals for views (more meaningful for graphs)
        current_views = s.get("views", 0)
        current_subs = s.get("subscribers", 0)

        # Note: Watch time is not tracked in basic snapshots
        # Using cumulative totals for both views and subscribers to show meaningful data
        rows.append([day_str, current_views, 0, current_subs])

    return jsonify(
        {
            "columns": ["day", "views", "watchTimeMinutes", "subscribersGained"],
            "rows": rows,
        }
    )


@app.route("/stats/youtube/channel", methods=["GET"])
@token_required
def get_youtube_channel():
    """Get user's saved YouTube channel ID"""
    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(
        {
            "channelId": user.get("youtubeChannelId", ""),
            "lastStatsUpdate": user.get("lastStatsUpdate", "").isoformat()
            if user.get("lastStatsUpdate")
            else None,
        }
    )


@app.route("/stats/youtube/channel", methods=["POST"])
@token_required
def save_youtube_channel():
    """Save YouTube channel ID to user profile and take initial snapshot"""
    data = request.json
    channel_id = data.get("channelId", "").strip()

    if not channel_id:
        return jsonify({"error": "Channel ID is required"}), 400

    # Verify channel exists by fetching stats
    stats = get_channel_stats(channel_id)
    if not stats:
        return jsonify({"error": "Invalid channel ID or channel not found"}), 404

    # Save channel ID to user
    users_collection.update_one(
        {"_id": ObjectId(request.user_id)}, {"$set": {"youtubeChannelId": channel_id}}
    )

    # Take initial snapshot for new channel
    save_stats_snapshot(request.user_id, stats)

    return jsonify(
        {
            "message": "Channel saved successfully",
            "channelId": channel_id,
            "stats": stats,
        }
    )


@app.route("/stats/youtube/realtime", methods=["GET"])
@token_required
def get_realtime_stats():
    """Fetch real-time YouTube channel statistics"""
    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    channel_id = user.get("youtubeChannelId")
    if not channel_id:
        return jsonify({"error": "No YouTube channel configured"}), 400

    stats = get_channel_stats(channel_id)
    if not stats:
        return jsonify({"error": "Failed to fetch channel stats"}), 500

    # Check if we should save a new 30-day snapshot
    if should_update_snapshot(request.user_id):
        save_stats_snapshot(request.user_id, stats)

    return jsonify(stats)


@app.route("/stats/youtube/growth", methods=["GET"])
@token_required
def get_growth_stats():
    """Calculate and return growth percentages"""
    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    channel_id = user.get("youtubeChannelId")
    if not channel_id:
        return jsonify({"error": "No YouTube channel configured"}), 400

    # Get current stats
    current_stats = get_channel_stats(channel_id)
    if not current_stats:
        return jsonify({"error": "Failed to fetch channel stats"}), 500

    # Calculate growth
    growth = calculate_growth(request.user_id, current_stats)

    return jsonify(growth)


@app.route("/stats/youtube/graph", methods=["GET"])
@token_required
def get_growth_graph():
    """Generate and return growth graph as base64 image"""
    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.get("youtubeChannelId"):
        return jsonify({"error": "No YouTube channel configured"}), 400

    graph_data = generate_growth_graph(request.user_id)

    if not graph_data:
        return jsonify(
            {"error": "Not enough data for graph (need at least 2 snapshots)"}
        ), 400

    return jsonify({"graph": graph_data})


@app.route("/stats/youtube/history", methods=["GET"])
@token_required
def get_stats_history_route():
    """Get historical stats snapshots"""
    history = get_stats_history(request.user_id, limit=12)

    # Convert datetime objects to ISO strings
    for item in history:
        if "recordedAt" in item:
            item["recordedAt"] = item["recordedAt"].isoformat()

    return jsonify({"history": history})


# --- YOUTUBE ANALYTICS OAUTH & DATE RANGE ROUTES ---


@app.route("/auth/youtube/connect", methods=["GET"])
@token_required
def youtube_connect():
    """
    Redirect user to Google OAuth consent screen for YouTube Analytics access.
    """
    from urllib.parse import urlencode

    if not config.GOOGLE_CLIENT_ID or not config.GOOGLE_CLIENT_SECRET:
        return jsonify({"error": "OAuth not configured on server"}), 500

    # YouTube Analytics API scope
    scopes = [
        "https://www.googleapis.com/auth/yt-analytics.readonly",
        "https://www.googleapis.com/auth/youtube.readonly"
    ]

    params = {
        "client_id": config.GOOGLE_CLIENT_ID,
        "redirect_uri": config.YOUTUBE_ANALYTICS_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "consent",
        "state": request.user_id  # Pass user ID to callback
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return jsonify({"authUrl": auth_url})


@app.route("/auth/youtube/callback", methods=["GET"])
def youtube_callback():
    """
    Handle OAuth callback from Google and store tokens.
    """
    code = request.args.get("code")
    state = request.args.get("state")  # user_id
    error = request.args.get("error")

    if error:
        return f"<html><body><h2>Authorization Failed</h2><p>{error}</p><script>window.close();</script></body></html>"

    if not code or not state:
        return "<html><body><h2>Invalid callback</h2><script>window.close();</script></body></html>"

    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": config.GOOGLE_CLIENT_ID,
        "client_secret": config.GOOGLE_CLIENT_SECRET,
        "redirect_uri": config.YOUTUBE_ANALYTICS_REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    try:
        response = requests.post(token_url, data=token_data)
        tokens = response.json()

        if "error" in tokens:
            return f"<html><body><h2>Token Error</h2><p>{tokens.get('error_description', tokens['error'])}</p><script>window.close();</script></body></html>"

        # Store tokens in user document
        users_collection.update_one(
            {"_id": ObjectId(state)},
            {
                "$set": {
                    "youtubeAnalyticsTokens": {
                        "access_token": tokens["access_token"],
                        "refresh_token": tokens.get("refresh_token"),
                        "expires_at": datetime.datetime.utcnow() + datetime.timedelta(seconds=tokens.get("expires_in", 3600))
                    }
                }
            }
        )

        return """
        <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #22c55e;">✓ YouTube Analytics Connected!</h2>
            <p>You can close this window and refresh the dashboard.</p>
            <script>
                if (window.opener) {
                    window.opener.postMessage('youtube-analytics-connected', '*');
                }
                setTimeout(() => window.close(), 2000);
            </script>
        </body>
        </html>
        """

    except Exception as e:
        return f"<html><body><h2>Error</h2><p>{str(e)}</p><script>window.close();</script></body></html>"


@app.route("/auth/youtube/status", methods=["GET"])
@token_required
def youtube_status():
    """Check if user has connected YouTube Analytics."""
    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
    if not user:
        return jsonify({"connected": False})

    tokens = user.get("youtubeAnalyticsTokens")
    if not tokens or not tokens.get("access_token"):
        return jsonify({"connected": False})

    return jsonify({"connected": True})


def refresh_youtube_token(user_id):
    """Refresh YouTube Analytics access token if expired."""
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return None

    tokens = user.get("youtubeAnalyticsTokens")
    if not tokens:
        return None

    # Check if token is expired
    expires_at = tokens.get("expires_at")
    if expires_at and datetime.datetime.utcnow() < expires_at:
        return tokens["access_token"]

    # Refresh token
    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        return None

    token_url = "https://oauth2.googleapis.com/token"
    refresh_data = {
        "client_id": config.GOOGLE_CLIENT_ID,
        "client_secret": config.GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }

    try:
        response = requests.post(token_url, data=refresh_data)
        new_tokens = response.json()

        if "error" in new_tokens:
            return None

        # Update stored tokens
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "youtubeAnalyticsTokens.access_token": new_tokens["access_token"],
                    "youtubeAnalyticsTokens.expires_at": datetime.datetime.utcnow() + datetime.timedelta(seconds=new_tokens.get("expires_in", 3600))
                }
            }
        )

        return new_tokens["access_token"]

    except Exception:
        return None


@app.route("/analytics/range", methods=["GET"])
@token_required
def get_analytics_range():
    """
    Fetch YouTube Analytics data for a custom date range.
    Query params: startDate, endDate (YYYY-MM-DD format)
    """
    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")

    if not start_date or not end_date:
        return jsonify({"error": "startDate and endDate are required"}), 400

    # Validate date format
    try:
        datetime.datetime.strptime(start_date, "%Y-%m-%d")
        datetime.datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Get user's YouTube channel ID
    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    channel_id = user.get("youtubeChannelId")
    if not channel_id:
        return jsonify({"error": "No YouTube channel configured"}), 400

    # Get access token (refresh if needed)
    access_token = refresh_youtube_token(request.user_id)
    if not access_token:
        return jsonify({"error": "YouTube Analytics not connected. Please connect first."}), 401

    # Query YouTube Analytics API
    analytics_url = "https://youtubeanalytics.googleapis.com/v2/reports"
    params = {
        "ids": f"channel=={channel_id}",
        "startDate": start_date,
        "endDate": end_date,
        "metrics": "views,estimatedMinutesWatched,subscribersGained,subscribersLost",
        "dimensions": "day",
        "sort": "day"
    }
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    try:
        response = requests.get(analytics_url, params=params, headers=headers)
        data = response.json()

        if "error" in data:
            error_msg = data["error"].get("message", "Unknown error")
            return jsonify({"error": f"YouTube API error: {error_msg}"}), 400

        # Transform to our format
        columns = ["day", "views", "watchTimeMinutes", "subscribersGained"]
        rows = []

        for row in data.get("rows", []):
            # row: [date, views, watchTime, subsGained, subsLost]
            day = row[0]
            views = row[1] if len(row) > 1 else 0
            watch_time = row[2] if len(row) > 2 else 0
            subs_gained = row[3] if len(row) > 3 else 0
            subs_lost = row[4] if len(row) > 4 else 0
            net_subs = subs_gained - subs_lost

            rows.append([day, views, watch_time, net_subs])

        return jsonify({
            "columns": columns,
            "rows": rows,
            "source": "youtube_analytics_api"
        })

    except Exception as e:
        return jsonify({"error": f"Failed to fetch analytics: {str(e)}"}), 500


@app.route("/tts", methods=["POST"])
def tts_endpoint():
    data = request.json
    text = data.get("text", "")

    if not text:
        return {"error": "No text provided"}, 400

    audio_stream = generate_tts_audio(text)
    return send_file(audio_stream, mimetype="audio/mpeg")


@app.route("/update-news", methods=["POST"])
def update_news():
    """Trigger this button from frontend to refresh news & PDFS"""
    # 1. Clear old news to prevent stale data
    clear_existing_news()

    # 2. Fetch fresh data
    rss_titles = fetch_and_store_news()
    newsapi_titles = fetch_newsapi_data()
    pdf_files = ingest_local_pdfs()

    summary = rss_titles + newsapi_titles + [f"PDF: {f}" for f in pdf_files]
    return {"status": "success", "articles": summary}


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_query = data.get("message", "")
    history = data.get("history", [])

    def generate():
        # 1. RAG Search
        results = collection.query(query_texts=[user_query], n_results=3)

        context = "No context available."
        if results["documents"][0]:
            context = "\n".join(results["documents"][0])

        # 2. Prepare System Prompt
        today = datetime.datetime.now().strftime("%Y-%m-%d")

        system_instruction = f"""
        You are a helpful assistant for daily life.
        Today's Date: {today}

        INSTRUCTIONS:
        1. Check the provided CONTEXT below.
        2. If the CONTEXT contains information relevant to the user's QUESTION, use it to answer.
        
        CRITICAL RULE FOR NEWS:
        3. If the user asks for "latest news", "current events", "what happened today", or specific recent updates:
           - You MUST answer based ONLY on the provided CONTEXT.
           - If the CONTEXT is empty or does not contain the requested news, DO NOT use your internal training data.
           - Instead, explicitly state: "I don't have information on that in my local database. Please click 'Update News DB' to fetch the latest headlines."

        GENERAL KNOWLEDGE FALLBACK:
        4. For questions NOT related to news or current events (e.g., "how to cook pasta", "explain python code"), if the CONTEXT is empty, you MAY answer using your own internal knowledge.
        
        CONTEXT:
        {context}
        """

        # 3. Construct Message Chain
        messages_payload = [{"role": "system", "content": system_instruction}]

        for msg in history:
            role = "assistant" if msg["role"] == "ai" else "user"
            messages_payload.append({"role": role, "content": msg["content"]})

        messages_payload.append({"role": "user", "content": f"QUESTION:\n{user_query}"})

        # 4. Call NVIDIA (Stream)
        completion = nvidia_client.chat.completions.create(
            model=config.MODEL_NAME,
            messages=messages_payload,
            temperature=0.6,
            top_p=0.7,
            max_tokens=4096,
            stream=True,
        )

        # 5. Stream Response
        for chunk in completion:
            if not chunk.choices:
                continue

            reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
            if reasoning:
                yield f"data: {json.dumps({'type': 'thought', 'content': reasoning})}\n\n"

            content = chunk.choices[0].delta.content
            if content:
                yield f"data: {json.dumps({'type': 'answer', 'content': content})}\n\n"

        yield "data: [DONE]\n\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream")


@app.route("/generate-drawing", methods=["POST"])
def generate_drawing():
    """Generate Mermaid diagram from natural language prompt"""
    data = request.json
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    system_prompt = """You are a diagram generation assistant. Your ONLY job is to convert user descriptions into valid Mermaid diagram syntax.

CRITICAL RULES:
1. Output ONLY the Mermaid code - no markdown code blocks, no explanations, no extra text
2. Start directly with the diagram type (flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, pie, gantt)
3. Use simple, short labels (max 3-4 words per node)
4. Prefer flowchart TD (top-down) for general diagrams
5. Use proper Mermaid syntax with correct arrow types: -->, ---, -.->
6. For flowcharts, use shapes: [rectangle], (rounded), {diamond}, ([stadium]), [[subroutine]]

EXAMPLES OF VALID OUTPUT:

For "user login process":
flowchart TD
    A[User] --> B[Enter Credentials]
    B --> C{Valid?}
    C -->|Yes| D[Dashboard]
    C -->|No| E[Error Message]
    E --> B

For "API request flow":
sequenceDiagram
    Client->>Server: HTTP Request
    Server->>Database: Query
    Database-->>Server: Results
    Server-->>Client: HTTP Response

Remember: Output ONLY the Mermaid code, nothing else. Do NOT include any thinking or reasoning - just the diagram code."""

    try:
        completion = nvidia_client.chat.completions.create(
            model=config.MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create a diagram for: {prompt}"},
            ],
            temperature=0.3,
            top_p=0.9,
            max_tokens=1024,
            stream=False,
        )

        # Handle thinking models that may have None content
        message = completion.choices[0].message
        mermaid_code = message.content

        # If content is None, check for reasoning_content or other attributes
        if mermaid_code is None:
            # Try to get reasoning content for thinking models
            reasoning = getattr(message, "reasoning_content", None)
            if reasoning:
                # Extract mermaid code from reasoning if present
                mermaid_code = reasoning
            else:
                return jsonify(
                    {"error": "AI returned empty response. Please try again."}
                ), 500

        mermaid_code = mermaid_code.strip()

        # Clean up any markdown code blocks if present
        if mermaid_code.startswith("```"):
            lines = mermaid_code.split("\n")
            # Remove first and last lines if they're code block markers
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            mermaid_code = "\n".join(lines)

        # Validate that we have something that looks like Mermaid code
        valid_starts = [
            "flowchart",
            "sequenceDiagram",
            "classDiagram",
            "stateDiagram",
            "erDiagram",
            "pie",
            "gantt",
            "graph",
        ]
        if not any(mermaid_code.strip().startswith(start) for start in valid_starts):
            return jsonify(
                {
                    "error": "AI did not generate valid Mermaid diagram. Please try a different prompt."
                }
            ), 500

        return jsonify({"mermaid": mermaid_code})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/generate-writing", methods=["POST"])
def generate_writing():
    """Generate or edit text based on user prompt and context"""
    data = request.json
    prompt = data.get("prompt", "")
    selected_text = data.get("selectedText", "")
    full_text = data.get("fullText", "")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    # Base system instruction
    system_instruction = """You are an expert writing assistant. Your task is to generate or edit text based on the user's instructions.

CRITICAL RULES:
1. Return ONLY the resulting text. Do not add conversational filler like "Here is the text," "Sure," or "I've updated it."
2. Use markdown formatting (bold, italic, headers) where appropriate.
3. If the user asks for code, provide just the code.
"""

    user_content = f"Instruction: {prompt}"

    if selected_text:
        # Editing a specific selection
        system_instruction += "\n4. You are editing a specific SELECTION of text. Return ONLY the replacement for that selection. Maintain surrounding context implied by the instruction."
        user_content += f"\n\nContext/Selection to Edit:\n{selected_text}"

    elif full_text:
        # Editing the whole document
        system_instruction += "\n4. You are acting on the FULL DOCUMENT. You must return the COMPLETE updated document. Do not summarize or omit parts unless explicitly asked. If the user asks to add something, output the original text + the addition."
        user_content += f"\n\nFull Document Content:\n{full_text}"

    else:
        # Generating from scratch
        system_instruction += "\n4. Generate new text based on the instruction."

    try:
        completion = nvidia_client.chat.completions.create(
            model=config.MODEL_NAME,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_content},
            ],
            temperature=0.7,
            top_p=0.9,
            max_tokens=4096,  # Increased for full document handling
            stream=False,
        )

        # Handle thinking models
        message = completion.choices[0].message
        generated_text = message.content

        if generated_text is None:
            reasoning = getattr(message, "reasoning_content", None)
            if reasoning:
                generated_text = reasoning
            else:
                return jsonify({"error": "AI returned empty response"}), 500

        return jsonify({"text": generated_text.strip()})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analyze-media", methods=["POST"])
@token_required
def analyze_media():
    """Analyze image or video using Gemini API"""
    data = request.json
    media_url = data.get("mediaUrl")
    media_type = data.get("mediaType", "image")  # "image" or "video"
    prompt = data.get("prompt", "Describe this media in detail.")

    if not media_url:
        return jsonify({"error": "Media URL is required"}), 400

    if not config.GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key not configured"}), 500

    if not genai_client:
        return jsonify(
            {"error": "Gemini Client not initialized. Please check your API key."}
        ), 500

    temp_file_path = None
    uploaded_file = None

    try:
        # 1. Download media to temp file
        response = requests.get(media_url)
        if response.status_code != 200:
            return jsonify({"error": "Failed to download media from URL"}), 400

        suffix = ".mp4" if media_type == "video" else ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(response.content)
            temp_file_path = tmp.name

        # 2. Upload to Gemini
        uploaded_file = genai_client.files.upload(file=temp_file_path)

        # 3. Wait if video
        if media_type == "video":
            while True:
                file_obj = genai_client.files.get(name=uploaded_file.name)
                if "ACTIVE" in str(file_obj.state):
                    break
                elif "FAILED" in str(file_obj.state):
                    raise Exception("Gemini video processing failed")
                time.sleep(5)

        # 4. Generate content
        analysis_response = genai_client.models.generate_content(
            model="gemini-3-flash-preview", contents=[uploaded_file, prompt]
        )

        return jsonify({"analysis": analysis_response.text})

    except Exception as e:
        print(f"Error in analyze_media: {str(e)}")
        return jsonify({"error": str(e)}), 500

    finally:
        # 5. Cleanup
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass
        if uploaded_file:
            try:
                genai_client.files.delete(name=uploaded_file.name)
            except:
                pass


# --- PROJECT ROUTES ---


@app.route("/projects", methods=["GET"])
@token_required
def get_projects():
    """Get all projects for the logged-in user"""
    projects = list(
        projects_collection.find({"userId": request.user_id}).sort("created", -1)
    )
    # Convert ObjectId to string for JSON serialization
    for project in projects:
        project["_id"] = str(project["_id"])
    return jsonify(projects)


@app.route("/projects", methods=["POST"])
@token_required
def create_project():
    """Create a new project for the logged-in user"""
    data = request.json
    name = data.get("name", "Untitled Project")

    project = {
        "name": name,
        "userId": request.user_id,
        "created": datetime.datetime.now().isoformat(),
    }

    result = projects_collection.insert_one(project)
    project["_id"] = str(result.inserted_id)

    return jsonify(project), 201


@app.route("/projects/<project_id>", methods=["PUT"])
@token_required
def update_project(project_id):
    """Update a project (only if owned by user)"""
    data = request.json

    # Check ownership
    project = projects_collection.find_one(
        {"_id": ObjectId(project_id), "userId": request.user_id}
    )
    if not project:
        return jsonify({"error": "Project not found or access denied"}), 404

    update_data = {}
    if "name" in data:
        update_data["name"] = data["name"]

    if update_data:
        projects_collection.update_one(
            {"_id": ObjectId(project_id)}, {"$set": update_data}
        )

    project = projects_collection.find_one({"_id": ObjectId(project_id)})
    project["_id"] = str(project["_id"])
    return jsonify(project)


@app.route("/projects/<project_id>", methods=["DELETE"])
@token_required
def delete_project(project_id):
    """Delete a project (only if owned by user)"""
    result = projects_collection.delete_one(
        {"_id": ObjectId(project_id), "userId": request.user_id}
    )

    if result.deleted_count > 0:
        return jsonify({"status": "deleted"})

    return jsonify({"error": "Project not found or access denied"}), 404


# --- WORKSPACE ROUTES ---


@app.route("/projects/<project_id>/workspace/canvas", methods=["GET"])
def get_canvas(project_id):
    """Get canvas data for a project"""
    project = projects_collection.find_one({"_id": ObjectId(project_id)})
    if project:
        workspace = project.get("workspace", {})
        return jsonify({"canvas": workspace.get("canvas", "")})
    return jsonify({"error": "Project not found"}), 404


@app.route("/projects/<project_id>/workspace/canvas", methods=["PUT"])
def save_canvas(project_id):
    """Save canvas data for a project"""
    data = request.json
    canvas_data = data.get("canvas", "")

    projects_collection.update_one(
        {"_id": ObjectId(project_id)}, {"$set": {"workspace.canvas": canvas_data}}
    )
    return jsonify({"status": "saved"})


@app.route("/projects/<project_id>/workspace/writing", methods=["GET"])
def get_writing(project_id):
    """Get writing content for a project"""
    project = projects_collection.find_one({"_id": ObjectId(project_id)})
    if project:
        workspace = project.get("workspace", {})
        return jsonify({"writing": workspace.get("writing", "")})
    return jsonify({"error": "Project not found"}), 404


@app.route("/projects/<project_id>/workspace/writing", methods=["PUT"])
def save_writing(project_id):
    """Save writing content for a project"""
    data = request.json
    writing_content = data.get("writing", "")

    projects_collection.update_one(
        {"_id": ObjectId(project_id)}, {"$set": {"workspace.writing": writing_content}}
    )
    return jsonify({"status": "saved"})


@app.route("/projects/<project_id>/workspace/chat", methods=["GET"])
def get_chat_history(project_id):
    """Get chat history for a project"""
    project = projects_collection.find_one({"_id": ObjectId(project_id)})
    if project:
        workspace = project.get("workspace", {})
        return jsonify({"chatHistory": workspace.get("chatHistory", [])})
    return jsonify({"error": "Project not found"}), 404


@app.route("/projects/<project_id>/workspace/chat", methods=["POST"])
def add_chat_message(project_id):
    """Add a chat message to project history"""
    data = request.json
    message = {
        "role": data.get("role"),
        "content": data.get("content"),
        "thought": data.get("thought", ""),
        "timestamp": datetime.datetime.now().isoformat(),
    }

    projects_collection.update_one(
        {"_id": ObjectId(project_id)}, {"$push": {"workspace.chatHistory": message}}
    )
    return jsonify({"status": "added", "message": message})


@app.route("/projects/<project_id>/workspace/upload", methods=["POST"])
def upload_media(project_id):
    """Upload media to Cloudinary and save reference"""
    from cloudinary_config import upload_image, upload_video

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    media_type = request.form.get("type", "image")

    # Check file size
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning

    max_size = 100 * 1024 * 1024 if media_type == "video" else 10 * 1024 * 1024
    if file_size > max_size:
        limit = "100MB" if media_type == "video" else "10MB"
        return jsonify({"error": f"File too large. Max size is {limit}"}), 400

    try:
        if media_type == "video":
            result = upload_video(file, folder=f"qwenify/{project_id}/videos")
        else:
            result = upload_image(file, folder=f"qwenify/{project_id}/images")

        media_entry = {
            "type": media_type,
            "url": result["url"],
            "publicId": result["public_id"],
            "name": file.filename,
            "uploadedAt": datetime.datetime.now().isoformat(),
        }

        projects_collection.update_one(
            {"_id": ObjectId(project_id)}, {"$push": {"workspace.media": media_entry}}
        )

        return jsonify(media_entry), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/projects/<project_id>/workspace/media", methods=["GET"])
def get_media(project_id):
    """Get all media for a project"""
    project = projects_collection.find_one({"_id": ObjectId(project_id)})
    if project:
        workspace = project.get("workspace", {})
        return jsonify({"media": workspace.get("media", [])})
    return jsonify({"error": "Project not found"}), 404


# --- STANDALONE CHAT ROUTES ---


@app.route("/chats", methods=["GET"])
@token_required
def get_recent_chats():
    """Get all standalone chat sessions for the user"""
    chats = list(
        chats_collection.find({"userId": request.user_id}).sort("updatedAt", -1)
    )
    for chat in chats:
        chat["_id"] = str(chat["_id"])
    return jsonify(chats)


@app.route("/chats", methods=["POST"])
@token_required
def create_chat_session():
    """Create a new standalone chat session"""
    data = request.json
    title = data.get("title", "New Chat")

    chat_session = {
        "userId": request.user_id,
        "title": title,
        "messages": [],
        "createdAt": datetime.datetime.now().isoformat(),
        "updatedAt": datetime.datetime.now().isoformat(),
    }

    result = chats_collection.insert_one(chat_session)
    chat_session["_id"] = str(result.inserted_id)

    return jsonify(chat_session), 201


@app.route("/chats/<chat_id>", methods=["GET"])
@token_required
def get_chat_session(chat_id):
    """Get a specific chat session (if owned by user)"""
    chat = chats_collection.find_one(
        {"_id": ObjectId(chat_id), "userId": request.user_id}
    )
    if not chat:
        return jsonify({"error": "Chat session not found"}), 404

    chat["_id"] = str(chat["_id"])
    return jsonify(chat)


@app.route("/chats/<chat_id>/message", methods=["POST"])
@token_required
def add_chat_session_message(chat_id):
    """Add a message to a standalone chat session"""
    data = request.json
    message = {
        "role": data.get("role"),
        "content": data.get("content"),
        "thought": data.get("thought", ""),
        "timestamp": datetime.datetime.now().isoformat(),
    }

    # Update title if it's the first user message
    update_query = {
        "$push": {"messages": message},
        "$set": {"updatedAt": datetime.datetime.now().isoformat()},
    }

    chat = chats_collection.find_one(
        {"_id": ObjectId(chat_id), "userId": request.user_id}
    )
    if chat and len(chat.get("messages", [])) == 0 and message["role"] == "user":
        # Simple title generation from first message
        title = message["content"][:40] + (
            "..." if len(message["content"]) > 40 else ""
        )
        update_query["$set"]["title"] = title

    chats_collection.update_one(
        {"_id": ObjectId(chat_id), "userId": request.user_id}, update_query
    )

    return jsonify({"status": "added", "message": message})


@app.route("/chats/<chat_id>", methods=["DELETE"])
@token_required
def delete_chat_session(chat_id):
    """Delete a chat session"""
    result = chats_collection.delete_one(
        {"_id": ObjectId(chat_id), "userId": request.user_id}
    )

    if result.deleted_count > 0:
        return jsonify({"status": "deleted"})

    return jsonify({"error": "Chat session not found"}), 404


@app.route("/chats/<chat_id>", methods=["PATCH"])
@token_required
def rename_chat_session(chat_id):
    """Rename a chat session"""
    data = request.json
    title = data.get("title")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    result = chats_collection.update_one(
        {"_id": ObjectId(chat_id), "userId": request.user_id},
        {"$set": {"title": title, "updatedAt": datetime.datetime.now().isoformat()}},
    )

    if result.modified_count > 0:
        return jsonify({"status": "renamed", "title": title})

    return jsonify({"error": "Chat session not found or access denied"}), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.PORT, debug=True)
