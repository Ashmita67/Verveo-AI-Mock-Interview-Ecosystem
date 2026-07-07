from fastapi import APIRouter, Depends

from app.analytics.analytics_service import AnalyticsService
from app.dependencies.auth import get_current_user
from app.dependencies.services import get_analytics_service, get_interview_service, get_resume_service
from app.services.interview_service import InterviewService
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def dashboard_overview(
    user=Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
    interview_service: InterviewService = Depends(get_interview_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    return {
        "resumes": resume_service.list_for_user(user),
        "interviews": interview_service.list_for_user(user),
        "analytics": analytics_service.overview(user),
    }
