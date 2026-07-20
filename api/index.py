import sys
import os

# Add backend directory and root directory to Python path so imports resolve correctly
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app.main import app

