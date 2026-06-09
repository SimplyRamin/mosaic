# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import employees, speech, stats, auth
from core.name_cache import load_names
from core.whisper_model import load_model
import threading


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    # Load name cache in background thread on startup
    thread = threading.Thread(target=load_names, daemon=True)
    thread.start()
    
    # Test Postgres connection
    try:
        from core.database import get_pg_connection
        conn = get_pg_connection()
        conn.close()
        print("Postgres connection: OK")
    except Exception as e:
        print(f"Postgres connection: FAILED - {e}")
    
    yield


app = FastAPI(title="Makan+ API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(speech.router)
app.include_router(stats.router)


@app.get("/health")
def health():
    return {"status": "ok"}