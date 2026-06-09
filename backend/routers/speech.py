# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from core.whisper_model import get_model
from core.name_cache import find_closest_name
from core.auth import get_current_user
import tempfile
import os

router = APIRouter(prefix="/api/speech", tags=["speech"])


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
    ):
    model = get_model()
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="voice_search_unavailable"
        )

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
            initial_prompt="جستجوی نام کارمند. نام‌های فارسی مانند علی، محمد، فاطمه، رضا، زهرا، حسین، مریم، احمد، حسن",
            vad_filter=True,    # filter out silence
            vad_parameters={"min_silence_duration_ms": 500}
        )

        transcript = " ".join([seg.text for seg in segments]).strip()

        # Fuzzy match against employee names
        matches = find_closest_name(transcript)

        return {
            "transcript": transcript,
            "matched_name": matches[0]["name"] if matches else transcript,
            "match_score": matches[0]["score"] if matches else 0,
            "alternatives": matches[1:] if len(matches) > 1 else [],
            "language": info.language,
            "duration": round(info.duration, 2)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Always clean up temp file
        os.unlink(tmp_path)