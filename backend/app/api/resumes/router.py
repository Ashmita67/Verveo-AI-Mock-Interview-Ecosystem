from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile

from app.dependencies.auth import get_current_user
from app.dependencies.services import get_resume_service
from app.schemas.common import MessageResponse
from app.schemas.resume import ResumeDetailResponse, ResumeListResponse, ResumeUploadResponse
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    resume = await resume_service.upload(user, file)
    return {
        "id": resume.id,
        "file_path": resume.file_path,
        "ats_score": resume.ats_score,
        "message": "Resume uploaded successfully.",
    }


@router.get("", response_model=ResumeListResponse)
def list_resumes(user=Depends(get_current_user), resume_service: ResumeService = Depends(get_resume_service)):
    return {"items": resume_service.list_for_user(user)}


@router.get("/{resume_id}", response_model=ResumeDetailResponse)
def get_resume(
    resume_id: UUID,
    user=Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    return resume_service.get_for_user(user, resume_id)


@router.delete("/{resume_id}", response_model=MessageResponse)
def delete_resume(
    resume_id: UUID,
    user=Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    resume_service.delete_for_user(user, resume_id)
    return {"detail": "Resume deleted successfully"}
