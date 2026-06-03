# =================================================================================================
#                                           Written by Ramin F.
#                                   for Tabiat Makan Industrial Group
# =================================================================================================

from fastapi import APIRouter, UploadFile, File, HTTPException
from faster_whisper import WhisperModel
import tempfile
import os

router = APIRouter(prefix="/api/speech", tags=["speech"])

# Load model once at startup - not on every request
# 'small' gives good Persian accuracy on server CPu
# change to 'tiny' if speed is more important than accuracy
print("Loading Whisper model...")
model = WhisperModel("medium", device="cpu", compute_type="int8")
print("Whisper model loaded")


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    # Validate file type
    if audio.content_type not in [
        "audio/webm",
        "audio/wav",
        "audio/mp4",
        "audio/mpeg",
        "audio/ogg",
        "audio/x-m4a",
        "application/octet-stream"
    ]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {audio.content_type}"
        )
    
    # Save to temp file - faster-whisper needs a file path
    suffix = ".webm"
    if audio.filename:
        _, ext = os.path.splitext(audio.filename)
        if ext:
            suffix = ext
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        segments, info = model.transcribe(
            tmp_path,
            language="fa",      # Persian
            beam_size=5,
            vad_filter=True,    # filter out silence
            vad_parameters={
                "min_silence_duration_ms": 500
            }
        )

        transcript = " ".join([seg.text for seg in segments]).strip()

        return {
            "transcript": transcript,
            "language": info.language,
            "duration": round(info.duration, 2)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Always clean up temp file
        os.unlink(tmp_path)