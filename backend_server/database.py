import chromadb
import config

# Initialize Client
print(f"Connecting to ChromaDB at {config.DB_PATH}...")
try:
    chroma_client = chromadb.PersistentClient(path=config.DB_PATH)
    # Get Collection
    # Using default embedding function (all-MiniLM-L6-v2 via ONNX)
    collection = chroma_client.get_or_create_collection(name="news_storage")
    print("ChromaDB initialization successful.")
except Exception as e:
    print(f"Error initializing ChromaDB: {e}")
    # Fallback or null object if needed, but for now we let it fail or log
    # In production, we might want a mock collection if RAG is optional
    raise e
