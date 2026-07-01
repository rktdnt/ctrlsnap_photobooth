from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PhotoSessionCreate(BaseModel):
    device_id: Optional[str] = None
    layout_id: str
    frame_id: str
    session_mode: str
    image_url: str

class PhotoSessionResponse(BaseModel):
    id: int
    device_id: Optional[str]
    layout_id: str
    frame_id: str
    session_mode: str
    image_url: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class QRCodeRequest(BaseModel):
    url: str

class QRCodeResponse(BaseModel):
    qr_data_url: str

class UploadImageRequest(BaseModel):
    image: str  # Base64 string from frontend
