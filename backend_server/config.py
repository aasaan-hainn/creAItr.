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

# MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

# Cloudinary
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

# Server
PORT = int(os.getenv("PORT", 5000))

# JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-secret-change-me")

# YouTube
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
