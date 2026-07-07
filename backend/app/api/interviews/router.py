from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.config import settings
from app.dependencies.auth import get_current_user
from app.dependencies.services import (
    get_audio_evaluation_service,
    get_report_service,
    get_interview_engine_service,
    get_interview_service,
    get_response_repository,
    get_text_evaluation_service,
    get_video_evaluation_service,
)
from app.schemas.ai import (
    AudioEvaluationResponse,
    CompleteInterviewRequest,
    EvaluationResponsePayload,
    InterviewStartRequest,
    InterviewStartResponse,
    NextQuestionRequest,
    NextQuestionResponse,
    SkipQuestionRequest,
    TextEvaluationRequest,
    VideoEvaluationResponse,
)
from app.schemas.common import MessageResponse
from app.schemas.interview import InterviewCreate, InterviewDetailResponse, InterviewListResponse, InterviewUpdate
from app.evaluation.audio_evaluation_service import AudioEvaluationService
from app.evaluation.text_evaluation_service import TextEvaluationService
from app.evaluation.video_evaluation_service import VideoEvaluationService
from app.interview.interview_engine_service import InterviewEngineService
from app.repositories.response_repository import ResponseRepository
from app.services.interview_service import InterviewService
from app.services.report_service import ReportService

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.post("", response_model=InterviewDetailResponse)
def create_interview(
    payload: InterviewCreate,
    user=Depends(get_current_user),
    interview_service: InterviewService = Depends(get_interview_service),
):
    return interview_service.create(user, payload)


@router.get("", response_model=InterviewListResponse)
def list_interviews(user=Depends(get_current_user), interview_service: InterviewService = Depends(get_interview_service)):
    return {"items": interview_service.list_for_user(user)}


@router.get("/{interview_id}", response_model=InterviewDetailResponse)
def get_interview(
    interview_id: UUID,
    user=Depends(get_current_user),
    interview_service: InterviewService = Depends(get_interview_service),
):
    return interview_service.get_for_user(user, interview_id)


@router.patch("/{interview_id}", response_model=InterviewDetailResponse)
def update_interview(
    interview_id: UUID,
    payload: InterviewUpdate,
    user=Depends(get_current_user),
    interview_service: InterviewService = Depends(get_interview_service),
):
    return interview_service.update_for_user(user, interview_id, payload)


@router.delete("/{interview_id}", response_model=MessageResponse)
def delete_interview(
    interview_id: UUID,
    user=Depends(get_current_user),
    interview_service: InterviewService = Depends(get_interview_service),
):
    interview_service.delete_for_user(user, interview_id)
    return {"detail": "Interview deleted successfully"}


@router.post("/start", response_model=InterviewStartResponse)
def start_interview(
    payload: InterviewStartRequest,
    user=Depends(get_current_user),
    interview_engine: InterviewEngineService = Depends(get_interview_engine_service),
):
    return interview_engine.start(user=user, payload=payload)


@router.post("/evaluate-text", response_model=EvaluationResponsePayload)
def evaluate_text(
    payload: TextEvaluationRequest,
    user=Depends(get_current_user),
    evaluation_service: TextEvaluationService = Depends(get_text_evaluation_service),
):
    return evaluation_service.evaluate(
        user=user,
        interview_id=payload.interview_id,
        question_id=payload.question_id,
        answer_text=payload.answer_text,
        answer_type="text",
    )


@router.post("/skip-question", response_model=EvaluationResponsePayload)
def skip_question(
    payload: SkipQuestionRequest,
    user=Depends(get_current_user),
    evaluation_service: TextEvaluationService = Depends(get_text_evaluation_service),
):
    return evaluation_service.skip_question(
        user=user,
        interview_id=payload.interview_id,
        question_id=payload.question_id,
    )


@router.post("/evaluate-audio", response_model=AudioEvaluationResponse)
async def evaluate_audio(
    interview_id: UUID = Form(...),
    question_id: UUID = Form(...),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    evaluation_service: AudioEvaluationService = Depends(get_audio_evaluation_service),
):
    return await evaluation_service.evaluate(
        user=user,
        interview_id=interview_id,
        question_id=question_id,
        file=file,
        upload_dir=settings.uploads_audio_dir,
    )


@router.post("/evaluate-video", response_model=VideoEvaluationResponse)
async def evaluate_video(
    interview_id: UUID = Form(...),
    question_id: UUID = Form(...),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    evaluation_service: VideoEvaluationService = Depends(get_video_evaluation_service),
):
    return await evaluation_service.evaluate(
        user=user,
        interview_id=interview_id,
        question_id=question_id,
        file=file,
        upload_dir=settings.uploads_video_dir,
    )


@router.post("/next-question", response_model=NextQuestionResponse)
def next_question(
    payload: NextQuestionRequest,
    user=Depends(get_current_user),
    interview_service: InterviewService = Depends(get_interview_service),
    interview_engine: InterviewEngineService = Depends(get_interview_engine_service),
    response_repo: ResponseRepository = Depends(get_response_repository),
):
    interview = interview_service.get_for_user(user, payload.interview_id)
    responses = response_repo.list_by_interview(interview.id)
    latest_response = responses[-1] if responses else None
    return {
        "question": interview_engine.generate_next_question(
            interview=interview,
            last_score=latest_response.score if latest_response else None,
            last_answer=latest_response.answer_text if latest_response else None,
            mode=interview.interview_mode or "text",
            current_difficulty=payload.difficulty.value,
        )
    }


@router.post("/complete", response_model=InterviewDetailResponse)
def complete_interview(
    payload: CompleteInterviewRequest,
    user=Depends(get_current_user),
    interview_service: InterviewService = Depends(get_interview_service),
    report_service: ReportService = Depends(get_report_service),
):
    interview = interview_service.complete_for_user(user, payload.interview_id)
    report_service.generate(user=user, interview_id=interview.id)
    return interview
