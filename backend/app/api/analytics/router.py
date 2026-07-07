from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.dependencies.services import get_analytics_service
from app.schemas.analytics import AnalyticsInterviewsResponse, AnalyticsOverviewResponse, AnalyticsSkillsResponse
from app.analytics.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("")
def analytics_index(
    user=Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    return {
        "overview": analytics_service.overview(user),
        "interviews": analytics_service.interview_history(user),
        "skills": analytics_service.skills(user),
    }


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def overview(
    user=Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    return analytics_service.overview(user)


@router.get("/interviews", response_model=AnalyticsInterviewsResponse)
def interviews(
    user=Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    return analytics_service.interview_history(user)


@router.get("/skills", response_model=AnalyticsSkillsResponse)
def skills(
    user=Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    return analytics_service.skills(user)
