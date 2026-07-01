import base64
import io
import cloudinary
import cloudinary.uploader
import qrcode
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from app import models, schemas, config
from app.database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Photomatics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_ORIGIN, "https://localhost:3000", "http://localhost:5173", "*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Cloudinary
if config.CLOUDINARY_CLOUD_NAME and config.CLOUDINARY_API_KEY:
    cloudinary.config(
        cloud_name=config.CLOUDINARY_CLOUD_NAME,
        api_key=config.CLOUDINARY_API_KEY,
        api_secret=config.CLOUDINARY_API_SECRET
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to Photomatics API"}

@app.post("/api/upload")
def upload_image(req: schemas.UploadImageRequest):
    """
    Uploads a base64 image to Cloudinary and returns the URL.
    """
    if not config.CLOUDINARY_CLOUD_NAME:
        # Fallback if Cloudinary is not configured
        return {"url": req.image, "public_id": "local_mock"}
        
    try:
        # cloudinary handles data URIs directly
        upload_result = cloudinary.uploader.upload(req.image, folder="photomatics")
        return {
            "url": upload_result.get("secure_url"),
            "public_id": upload_result.get("public_id")
        }
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

@app.post("/api/qrcode", response_model=schemas.QRCodeResponse)
def generate_qrcode(req: schemas.QRCodeRequest):
    """
    Generates a real QR code PNG from a URL and returns as base64 data URI.
    """
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        # Prevent DataOverflowError if Cloudinary is not configured and a huge data URI is passed
        if req.url.startswith("data:"):
            qr.add_data("https://photomatics.app/cloudinary-not-configured")
        else:
            qr.add_data(req.url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return {"qr_data_url": f"data:image/png;base64,{img_str}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions", response_model=schemas.PhotoSessionResponse)
def create_session(session_in: schemas.PhotoSessionCreate, db: Session = Depends(get_db)):
    db_session = models.PhotoSession(
        device_id=session_in.device_id,
        layout_id=session_in.layout_id,
        frame_id=session_in.frame_id,
        session_mode=session_in.session_mode,
        image_url=session_in.image_url,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@app.get("/api/sessions", response_model=list[schemas.PhotoSessionResponse])
def get_sessions(device_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.PhotoSession).filter(models.PhotoSession.deleted_at == None)
    if device_id:
        query = query.filter(models.PhotoSession.device_id == device_id)
    return query.order_by(models.PhotoSession.created_at.desc()).all()

@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    db_session = db.query(models.PhotoSession).filter(models.PhotoSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Soft delete
    db_session.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Session deleted successfully"}

@app.post("/api/ai/remove-background")
def ai_remove_background(req: schemas.UploadImageRequest):
    """
    Stub endpoint for future AI background removal integration.
    Currently returns the original image.
    """
    return {
        "status": "not_implemented_yet",
        "image": req.image
    }
