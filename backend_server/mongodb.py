from pymongo import MongoClient
import config

# Initialize MongoDB Client
print(f"Connecting to MongoDB...")
mongo_client = MongoClient(config.MONGODB_URI)

# Get database and collection
db = mongo_client["qwenify"]
projects_collection = db["projects"]

print("MongoDB connected successfully!")
