from errors import BadRequestError
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse, Response
from responses import ok
from schemas.backup import BackupSummary
from services import backup as backup_service

router = APIRouter(prefix="/api", tags=["Backup"])


@router.get("/backup/export")
async def export_backup() -> Response:
    """Download a full backup of all application data as a .rebuilt file."""
    data = await backup_service.create_backup()
    return Response(
        content=data,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{backup_service.backup_filename()}"',
            "Content-Length": str(len(data)),
        },
    )


@router.post("/backup/import")
async def import_backup(file: UploadFile = File()) -> JSONResponse:
    """Replace all application data with the contents of an uploaded backup."""
    data = await file.read()
    if not data:
        raise BadRequestError("The uploaded backup file is empty.")
    summary: BackupSummary = await backup_service.restore_backup(data)
    return ok(summary, message="Backup restored.")


@router.delete("/data")
async def erase_all_data() -> JSONResponse:
    """Permanently delete all application data."""
    await backup_service.erase_all_data()
    return ok(message="All data erased.")
