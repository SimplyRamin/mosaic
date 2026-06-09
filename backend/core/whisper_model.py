# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

from faster_whisper import WhisperModel
from core.config import settings

model = None

def load_model():
    global model
    if not settings.enable_whisper:
        print("Whisper disabled — set ENABLE_WHISPER=true to enable voice search")
        return
    print("Loading Whisper model...")
    model = WhisperModel("medium", device="cpu", compute_type="int8")
    print("Whisper model loaded")

def get_model():
    return model