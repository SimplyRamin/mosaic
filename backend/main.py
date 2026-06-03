# =================================================================================================
#                                           Written by Ramin F.
#                                   for Tabiat Makan Industrial Group
# =================================================================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import employees, speech

app = FastAPI(title="Makan+ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router)
app.include_router(speech.router)

@app.get("/health")
def health():
    return {"status": "ok"}