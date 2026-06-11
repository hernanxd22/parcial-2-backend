from fastapi import APIRouter, UploadFile, File, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import get_current_user, require_roles
from app.modules.uploads.service import upload_image

router = APIRouter()


@router.post("/", summary="Subir imagen a Cloudinary")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "productos",
    _current_user=Depends(get_current_user),
    _allowed=Depends(require_roles("ADMIN", "STOCK")),
    _session: Session = Depends(get_session),
):
    contents = await file.read()
    result = upload_image(contents, folder=folder)
    return {
        "url": result["url"],
        "public_id": result["public_id"],
    }
