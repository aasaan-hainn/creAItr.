import asyncio
import edge_tts
import io

# Selected Voice: English (US) - Guy - Neural
# Alternatives: en-US-AriaNeural (Female), en-US-ChristopherNeural (Male)
VOICE = "en-US-GuyNeural"

async def _generate_audio(text):
    communicate = edge_tts.Communicate(text, VOICE)
    audio_stream = io.BytesIO()
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])
            
    audio_stream.seek(0)
    return audio_stream

def generate_tts_audio(text):
    """
    Synchronous wrapper to generate TTS audio bytes.
    Returns: BytesIO object containing MP3 data.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        audio = loop.run_until_complete(_generate_audio(text))
        return audio
    finally:
        loop.close()
