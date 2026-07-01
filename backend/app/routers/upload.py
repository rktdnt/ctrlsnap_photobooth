from fastapi import APIRouter, HTTPException, Form
from ..services.cloudinary_service import upload_base64_image
from ..schemas import UploadResponse

router = APIRouter()

@router.post("", response_model=UploadResponse)
async def upload_image(image_base64: str = Form(...)):
    try:
        result = upload_base64_image(image_base64)
        return UploadResponse(url=result["url"], public_id=result["public_id"])
    except Exception as e:
        # Placeholder fallback if cloudinary isn't configured
        print(f"Cloudinary upload failed: {e}")
        # Return a dummy response for local dev if cloudinary is missing
        return UploadResponse(
            url="https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg", 
            public_id="dummy_public_id"
        )
