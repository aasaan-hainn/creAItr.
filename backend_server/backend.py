import json
import datetime
from flask import Flask, request, Response, stream_with_context, send_file, jsonify
from flask_cors import CORS
from openai import OpenAI
from bson import ObjectId

import config
from database import collection
from mongodb import projects_collection, users_collection
from news_ingest import fetch_and_store_news, fetch_newsapi_data, clear_existing_news
from pdf_ingest import ingest_local_pdfs
from tts import generate_tts_audio
from auth import hash_password, verify_password, generate_token, verify_token, token_required

# --- SERVER SETUP ---
app = Flask(__name__)
CORS(app)

print("Initializing NVIDIA Client...")
nvidia_client = OpenAI(base_url=config.NVIDIA_BASE_URL, api_key=config.NVIDIA_API_KEY)


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
        "createdAt": datetime.datetime.now().isoformat()
    }
    
    result = users_collection.insert_one(user)
    user_id = str(result.inserted_id)
    
    # Generate token
    token = generate_token(user_id, email)
    
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "socialAccounts": social_accounts
        }
    }), 201


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
    
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user_id,
            "email": user["email"],
            "socialAccounts": user.get("socialAccounts", [])
        }
    })


@app.route("/auth/verify", methods=["GET"])
def verify_auth():
    """Verify JWT token and return user data"""
    token = None
    
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
    
    if not token:
        return jsonify({"valid": False, "error": "No token provided"}), 401
    
    payload = verify_token(token)
    if not payload:
        return jsonify({"valid": False, "error": "Invalid or expired token"}), 401
    
    # Get user from database
    user = users_collection.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        return jsonify({"valid": False, "error": "User not found"}), 404
    
    return jsonify({
        "valid": True,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "socialAccounts": user.get("socialAccounts", [])
        }
    })


@app.route("/auth/me", methods=["GET"])
@token_required
def get_current_user():
    """Get current logged-in user profile"""
    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": str(user["_id"]),
        "email": user["email"],
        "socialAccounts": user.get("socialAccounts", []),
        "createdAt": user.get("createdAt", "")
    })


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
            reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
            if reasoning:
                yield f"data: {json.dumps({'type': 'thought', 'content': reasoning})}\n\n"

            content = chunk.choices[0].delta.content
            if content:
                yield f"data: {json.dumps({'type': 'answer', 'content': content})}\n\n"

        yield "data: [DONE]\n\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream")


# --- PROJECT ROUTES ---

@app.route("/projects", methods=["GET"])
@token_required
def get_projects():
    """Get all projects for the logged-in user"""
    projects = list(projects_collection.find({"userId": request.user_id}).sort("created", -1))
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
        "created": datetime.datetime.now().isoformat()
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
    project = projects_collection.find_one({"_id": ObjectId(project_id), "userId": request.user_id})
    if not project:
        return jsonify({"error": "Project not found or access denied"}), 404
    
    update_data = {}
    if "name" in data:
        update_data["name"] = data["name"]
    
    if update_data:
        projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
    
    project = projects_collection.find_one({"_id": ObjectId(project_id)})
    project["_id"] = str(project["_id"])
    return jsonify(project)


@app.route("/projects/<project_id>", methods=["DELETE"])
@token_required
def delete_project(project_id):
    """Delete a project (only if owned by user)"""
    result = projects_collection.delete_one({"_id": ObjectId(project_id), "userId": request.user_id})
    
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
        {"_id": ObjectId(project_id)},
        {"$set": {"workspace.canvas": canvas_data}}
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
        {"_id": ObjectId(project_id)},
        {"$set": {"workspace.writing": writing_content}}
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
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$push": {"workspace.chatHistory": message}}
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
            "uploadedAt": datetime.datetime.now().isoformat()
        }
        
        projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$push": {"workspace.media": media_entry}}
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.PORT, debug=True)

