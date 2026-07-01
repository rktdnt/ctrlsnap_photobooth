from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import PhotoSession
from ..schemas import PhotoSessionCreate, PhotoSessionResponse

router = APIRouter()

@router.post("", response_model=PhotoSessionResponse)
def create_session(session_data: PhotoSessionCreate, db: Session = Depends(get_db)):
    db_session = PhotoSession(
        device_id=session_data.device_id,
        layout_id=session_data.layout_id,
        frame_id=session_data.frame_id,
        session_mode=session_data.session_mode,
        image_url=session_data.image_url,
        public_id=session_data.public_id
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("", response_model=List[PhotoSessionResponse])
def get_sessions(device_id: str, db: Session = Depends(get_db)):
    if not device_id:
        return []
    sessions = db.query(PhotoSession).filter(
        PhotoSession.device_id == device_id,
        PhotoSession.deleted_at == None
    ).order_by(PhotoSession.created_at.desc()).all()
    return sessions

@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(PhotoSession).filter(PhotoSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Session deleted"}
