from pymongo import MongoClient
import config

# Initialize MongoDB Client
print(f"Connecting to MongoDB...")
mongo_client = MongoClient(config.MONGODB_URI)

# Get database and collections
db = mongo_client["qwenify"]
projects_collection = db["projects"]
users_collection = db["users"]

# Create unique index on email for users
users_collection.create_index("email", unique=True)

print("MongoDB connected successfully!")
