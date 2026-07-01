from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class PhotoSession(Base):
    __tablename__ = "photo_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(64), index=True, nullable=True)
    layout_id = Column(String(32))
    frame_id = Column(String(32))
    session_mode = Column(String(16))  # 'trial' | 'premium'
    image_url = Column(String(512))
    public_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    deleted_at = Column(DateTime, nullable=True)
