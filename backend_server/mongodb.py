from pymongo import MongoClient
import config

# Initialize MongoDB Client
print(f"Connecting to MongoDB...")
mongo_client = MongoClient(config.MONGODB_URI)

# Get database and collections
db = mongo_client["qwenify"]
projects_collection = db["projects"]
users_collection = db["users"]
chats_collection = db["chats"]
channel_stats_collection = db["channel_stats"]
tasks_collection = db["tasks"]

try:
    print("Setting up MongoDB indices...")
    # Create unique index on email for users
    users_collection.create_index("email", unique=True)

    # Create index for channel stats queries
    channel_stats_collection.create_index([("userId", 1), ("recordedAt", -1)])
    print("MongoDB indices set up successfully.")
except Exception as e:
    print(f"Warning: Failed to set up MongoDB indices: {e}")
    print("Application will continue to start, but performance may be impacted.")

print("MongoDB initialization complete.")
