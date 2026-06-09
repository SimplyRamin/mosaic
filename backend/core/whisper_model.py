# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

from faster_whisper import WhisperModel

model = None

def load_model():
    global model
    print("Loading Whisper model...")
    model = WhisperModel("medium", device="cpu", compute_type="int8")
    print("Whisper model loaded")

def get_model():
    return model