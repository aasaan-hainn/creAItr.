import json
import datetime
from flask import Flask, request, Response, stream_with_context, send_file
from flask_cors import CORS
from openai import OpenAI

import config
from database import collection
from news_ingest import fetch_and_store_news, fetch_newsapi_data, clear_existing_news
from pdf_ingest import ingest_local_pdfs
from tts import generate_tts_audio

# --- SERVER SETUP ---
app = Flask(__name__)
CORS(app)

print("Initializing NVIDIA Client...")
nvidia_client = OpenAI(base_url=config.NVIDIA_BASE_URL, api_key=config.NVIDIA_API_KEY)


# --- API ROUTES ---


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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.PORT, debug=True)

