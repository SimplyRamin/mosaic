# =================================================================================================
#                                           Written by Ramin F.
#                                   for Tabiat Makan Industrial Group
# =================================================================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import employees, speech, stats
from core.name_cache import load_names
from core.whisper_model import load_model
import threading


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    # Load name cache in background thread on startup
    thread = threading.Thread(target=load_names, daemon=True)
    thread.start()
    yield


app = FastAPI(title="Makan+ API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router)
app.include_router(speech.router)
app.include_router(stats.router)


@app.get("/health")
def health():
    return {"status": "ok"}