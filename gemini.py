from google import genai
import tkinter as tk
from tkinter import filedialog
import os
import time

API_KEY = "AIzaSyBmSb5vv0k2ZC7oZ8Kym9tIroUtmwCTab8"
client = genai.Client(api_key=API_KEY)


def select_media_file():
    root = tk.Tk()
    root.withdraw()

    file_path = filedialog.askopenfilename(
        title="Select Image or Video",
        filetypes=[
            ("All Media", "*.jpg *.jpeg *.png *.webp *.mp4 *.mov *.avi *.mpeg *.mpg"),
            ("Images", "*.jpg *.jpeg *.png *.webp"),
            ("Videos", "*.mp4 *.mov *.avi *.mpeg *.mpg"),
        ],
    )

    if file_path:
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        print(f"✅ Selected: {os.path.basename(file_path)} ({size_mb:.2f} MB)")
        return file_path
    return None


def wait_for_file_active(file_name):
    """
    Loops until the file status is 'ACTIVE'.
    Essential for videos which take time to process.
    """
    print("⏳ Waiting for file processing...", end="", flush=True)

    while True:
        file_obj = client.files.get(name=file_name)
        current_state = str(file_obj.state)

        if "ACTIVE" in current_state:
            print("\n✅ File is ready!")
            return file_obj
        elif "FAILED" in current_state:
            raise Exception("File processing failed on Google's side.")

        print(".", end="", flush=True)
        time.sleep(5)


def analyze_media():
    print("\n--- 🧪 Unified Media Analysis ---")

    file_path = select_media_file()
    if not file_path:
        return

    uploaded_file = None

    try:
        print("🚀 Uploading to Gemini...")
        uploaded_file = client.files.upload(file=file_path)
        print(f"   URI: {uploaded_file.uri}")
        wait_for_file_active(uploaded_file.name)
        prompt = "Describe this media in detail. If it's a video, describe the action and audio."
        print("🧠 Analyzing content...")
        response = client.models.generate_content(
            model="gemini-3-flash-preview", contents=[uploaded_file, prompt]
        )

        print("\n✅ SUCCESS! API Response:\n")
        print("------------------------------------------------")
        print(response.text)
        print("------------------------------------------------")

    except Exception as e:
        print(f"\n❌ FAILED: {e}")

    finally:
        if uploaded_file:
            print("\n🧹 Cleaning up (Deleting remote file)...")
            try:
                client.files.delete(name=uploaded_file.name)
            except:
                pass


if __name__ == "__main__":
    analyze_media()
