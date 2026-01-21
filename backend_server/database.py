import chromadb
import config

# Initialize Client
print(f"Connecting to ChromaDB at {config.DB_PATH}...")
chroma_client = chromadb.PersistentClient(path=config.DB_PATH)

# Get Collection
# Using default embedding function (all-MiniLM-L6-v2 via ONNX)
collection = chroma_client.get_or_create_collection(name="news_storage")
