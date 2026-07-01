from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class GifRequest(BaseModel):
    frames: List[str]

class GifResponse(BaseModel):
    url: str

@router.post("/gif", response_model=GifResponse)
def create_gif(request: GifRequest):
    # Placeholder for GIF/Boomerang creation using Pillow
    # Since this is optional, we return a dummy URL for now
    return GifResponse(url="https://res.cloudinary.com/demo/image/upload/v1312461204/sample.gif")
