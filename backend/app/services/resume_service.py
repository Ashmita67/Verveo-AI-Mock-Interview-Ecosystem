from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import NotFoundException, UnauthorizedException
from app.models.resume import Resume
from app.repositories.resume_repository import ResumeRepository
from app.services.resume_intelligence_service import ResumeIntelligenceService
from app.utils.files import build_upload_path, generate_resume_alias, is_pdf


class ResumeService:
    def __init__(self, resume_repo: ResumeRepository, resume_intelligence_service: ResumeIntelligenceService):
        self.resume_repo = resume_repo
        self.resume_intelligence_service = resume_intelligence_service

    async def upload(self, user, file: UploadFile) -> Resume:
        if not is_pdf(file.filename or "", file.content_type):
            raise UnauthorizedException("Only PDF resumes are supported")

        upload_path = build_upload_path(settings.uploads_resumes_dir, file.filename or "resume.pdf")
        contents = await file.read()
        if len(contents) > settings.max_upload_size_mb * 1024 * 1024:
            raise UnauthorizedException("File size exceeds allowed limit")

        Path(upload_path).write_bytes(contents)
        resume = Resume(
            user_id=user.id,
            alias=generate_resume_alias(),
            file_path=str(upload_path),
            parsed_text=None,
            ats_score=None,
        )
        saved_resume = self.resume_repo.create(resume)
        return self.resume_repo.save(self.resume_intelligence_service.process(user=user, resume=saved_resume))

    def list_for_user(self, user):
        return self.resume_repo.list_by_user(user.id)

    def get_for_user(self, user, resume_id: UUID):
        resume = self.resume_repo.get(resume_id)
        if not resume or resume.user_id != user.id:
            raise NotFoundException("Resume not found")
        return resume

    def delete_for_user(self, user, resume_id: UUID):
        resume = self.get_for_user(user, resume_id)
        self.resume_repo.delete(resume)
