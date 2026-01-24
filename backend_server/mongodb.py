from pymongo import MongoClient
import config

# Initialize MongoDB Client
print(f"Connecting to MongoDB...")
mongo_client = MongoClient(config.MONGODB_URI)

# Get database and collections
db = mongo_client["qwenify"]
projects_collection = db["projects"]
users_collection = db["users"]
channel_stats_collection = db["channel_stats"]

# Create unique index on email for users
users_collection.create_index("email", unique=True)

# Create index for channel stats queries
channel_stats_collection.create_index([("userId", 1), ("recordedAt", -1)])

print("MongoDB connected successfully!")
