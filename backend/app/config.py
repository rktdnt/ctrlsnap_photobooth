import os
from dotenv import load_dotenv

load_dotenv()
# Also search in the parent root directory if not found in current directory
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
if os.path.exists(root_env):
    load_dotenv(root_env)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./photomatics.db")
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
APP_PUBLIC_BASE_URL = os.getenv("APP_PUBLIC_BASE_URL", "http://127.0.0.1:8000")
