import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# URLs & Endpoints
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL")
MODEL_NAME = os.getenv("MODEL_NAME")
RSS_URL = os.getenv("RSS_URL")

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.getenv("DB_PATH", os.path.join(BASE_DIR, "my_local_db"))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

# Server
PORT = int(os.getenv("PORT", 5000))
