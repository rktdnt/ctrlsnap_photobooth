from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app import schemas, config
from app.database import engine, Base
from app import models
from app.routers import media, sessions, upload, qrcode_gen, ai_tools

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CTRL+Snap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        config.FRONTEND_ORIGIN,
        "http://localhost:3000",
        "http://localhost:5173",
        "https://ctrlsnap.rypl.my.id",
        "*",  # allow all — tighten in production if needed
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───
app.include_router(media.router, prefix="/api/media", tags=["media"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(qrcode_gen.router, prefix="/api/qrcode", tags=["qrcode"])
app.include_router(ai_tools.router, prefix="/api/ai", tags=["ai"])

# ─── Payment Mock Verification ───
from pydantic import BaseModel
from typing import Optional

class PaymentVerifyReq(BaseModel):
    session_id: Optional[str] = None

@app.post("/api/payments/verify")
def verify_payment(req: PaymentVerifyReq):
    # Server-side payment verification simulation
    # Return success directly to allow dynamic testing
    return {
        "status": "success",
        "message": "Payment verified on server",
        "amount": 10000,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to CTRL+Snap API"}


