import os
import datetime
from pypdf import PdfReader
import config
from database import collection

def ingest_local_pdfs():
    print(f"Scanning '{config.UPLOADS_DIR}' for PDFs...")
    processed_files = []
    
    if not os.path.exists(config.UPLOADS_DIR):
        os.makedirs(config.UPLOADS_DIR)
        return []
        
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")

    for root, dirs, files in os.walk(config.UPLOADS_DIR):
        for file in files:
            if file.lower().endswith(".pdf"):
                file_path = os.path.join(root, file)
                try:
                    reader = PdfReader(file_path)
                    print(f"Processing: {file}")
                    
                    for i, page in enumerate(reader.pages):
                        text = page.extract_text()
                        if text:
                            # Contextual ID: filename_page
                            rel_path = os.path.relpath(file_path, config.UPLOADS_DIR)
                            unique_id = f"pdf_{rel_path}_p{i}"
                            
                            document_text = f"""
                            [Ingested: {today_str}]
                            SOURCE: PDF Document ({rel_path}, Page {i+1})
                            CONTENT: {text}
                            """
                            
                            collection.upsert(
                                ids=[unique_id],
                                documents=[document_text],
                                metadatas=[{"type": "pdf", "source": rel_path, "page": i+1, "date": today_str}]
                            )
                    processed_files.append(file)
                except Exception as e:
                    print(f"Error processing {file}: {e}")
                    
    return processed_files
