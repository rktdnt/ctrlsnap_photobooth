from fastapi import APIRouter
from ..schemas import QRCodeRequest, QRCodeResponse
from ..services.qrcode_service import generate_qr_code_base64

router = APIRouter()

@router.post("", response_model=QRCodeResponse)
def generate_qr(request: QRCodeRequest):
    qr_data_url = generate_qr_code_base64(request.url)
    return QRCodeResponse(qr_data_url=qr_data_url)
