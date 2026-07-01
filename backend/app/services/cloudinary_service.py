import cloudinary
import cloudinary.uploader
from ..config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET
    )

def upload_base64_image(base64_data: str):
    # Cloudinary automatically handles data:image/png;base64,... strings
    response = cloudinary.uploader.upload(base64_data, folder="photomatics")
    return {
        "url": response.get("secure_url"),
        "public_id": response.get("public_id")
    }
