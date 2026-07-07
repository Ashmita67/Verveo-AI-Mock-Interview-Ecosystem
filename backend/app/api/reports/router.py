from uuid import UUID

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.dependencies.services import get_report_repository, get_report_service
from app.schemas.ai import ReportGenerationRequest
from app.schemas.report import ReportRead
from app.services.report_service import ReportService
from app.repositories.report_repository import ReportRepository

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
def list_reports(
    user=Depends(get_current_user),
    report_repo: ReportRepository = Depends(get_report_repository),
):
    return {"items": report_repo.list_by_user(user.id)}


@router.get("/{interview_id}", response_model=ReportRead)
def get_report(
    interview_id: UUID,
    user=Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_for_interview(user, interview_id)


@router.post("/generate", response_model=ReportRead)
def generate_report(
    payload: ReportGenerationRequest,
    user=Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.generate(user, payload.interview_id)
