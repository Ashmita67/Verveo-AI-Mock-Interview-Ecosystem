from fastapi import Depends
from sqlalchemy.orm import Session

from app.analytics.analytics_service import AnalyticsService
from app.ai.gemini_service import GeminiService
from app.evaluation.audio_evaluation_service import AudioEvaluationService
from app.evaluation.report_generation_service import ReportGenerationService
from app.evaluation.text_evaluation_service import TextEvaluationService
from app.evaluation.video_evaluation_service import VideoEvaluationService
from app.interview.adaptive_interview_service import AdaptiveInterviewService
from app.interview.interview_engine_service import InterviewEngineService
from app.parsers.ats_service import ATSService
from app.parsers.resume_parser_service import ResumeParserService
from app.parsers.speech_to_text_service import SpeechToTextService
from app.parsers.video_service import VideoService
from app.rag.chroma_service import ChromaDBService
from app.rag.chunking_service import ChunkingService
from app.rag.embedding_service import EmbeddingService
from app.rag.retrieval_service import RetrievalService
from app.db.session import get_db
from app.repositories.interview_repository import InterviewRepository
from app.repositories.otp_repository import OtpRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.response_repository import ResponseRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.resume_repository import ResumeRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.services.google_oauth_service import GoogleOAuthService
from app.services.interview_service import InterviewService
from app.services.otp_service import OtpService
from app.services.report_service import ReportService
from app.services.resume_intelligence_service import ResumeIntelligenceService
from app.services.resume_service import ResumeService
from app.services.token_service import TokenService
from app.services.user_service import UserService


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_resume_repository(db: Session = Depends(get_db)) -> ResumeRepository:
    return ResumeRepository(db)


def get_interview_repository(db: Session = Depends(get_db)) -> InterviewRepository:
    return InterviewRepository(db)


def get_question_repository(db: Session = Depends(get_db)) -> QuestionRepository:
    return QuestionRepository(db)


def get_response_repository(db: Session = Depends(get_db)) -> ResponseRepository:
    return ResponseRepository(db)


def get_report_repository(db: Session = Depends(get_db)) -> ReportRepository:
    return ReportRepository(db)


def get_otp_repository(db: Session = Depends(get_db)) -> OtpRepository:
    return OtpRepository(db)


def get_refresh_token_repository(db: Session = Depends(get_db)) -> RefreshTokenRepository:
    return RefreshTokenRepository(db)


def get_token_service() -> TokenService:
    return TokenService()


def get_email_service() -> EmailService:
    return EmailService()


def get_google_oauth_service() -> GoogleOAuthService:
    return GoogleOAuthService()


def get_gemini_service() -> GeminiService:
    return GeminiService()


def get_resume_parser_service() -> ResumeParserService:
    return ResumeParserService()


def get_ats_service() -> ATSService:
    return ATSService()


def get_chunking_service() -> ChunkingService:
    return ChunkingService()


def get_chroma_service() -> ChromaDBService:
    return ChromaDBService()


def get_otp_service(
    otp_repo: OtpRepository = Depends(get_otp_repository),
    email_service: EmailService = Depends(get_email_service),
) -> OtpService:
    return OtpService(otp_repo, email_service)


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repository),
    refresh_repo: RefreshTokenRepository = Depends(get_refresh_token_repository),
    otp_repo: OtpRepository = Depends(get_otp_repository),
    token_service: TokenService = Depends(get_token_service),
    otp_service: OtpService = Depends(get_otp_service),
    google_oauth_service: GoogleOAuthService = Depends(get_google_oauth_service),
) -> AuthService:
    return AuthService(user_repo, refresh_repo, otp_repo, token_service, otp_service, google_oauth_service)


def get_user_service(user_repo: UserRepository = Depends(get_user_repository)) -> UserService:
    return UserService(user_repo)


def get_embedding_service(gemini_service: GeminiService = Depends(get_gemini_service)) -> EmbeddingService:
    return EmbeddingService(gemini_service)


def get_retrieval_service(
    chroma_service: ChromaDBService = Depends(get_chroma_service),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
) -> RetrievalService:
    return RetrievalService(chroma_service, embedding_service)


def get_resume_intelligence_service(
    parser_service: ResumeParserService = Depends(get_resume_parser_service),
    ats_service: ATSService = Depends(get_ats_service),
    chunking_service: ChunkingService = Depends(get_chunking_service),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    chroma_service: ChromaDBService = Depends(get_chroma_service),
) -> ResumeIntelligenceService:
    return ResumeIntelligenceService(parser_service, ats_service, chunking_service, embedding_service, chroma_service)


def get_resume_service(
    resume_repo: ResumeRepository = Depends(get_resume_repository),
    resume_intelligence_service: ResumeIntelligenceService = Depends(get_resume_intelligence_service),
) -> ResumeService:
    return ResumeService(resume_repo, resume_intelligence_service)


def get_interview_service(
    interview_repo: InterviewRepository = Depends(get_interview_repository),
) -> InterviewService:
    return InterviewService(interview_repo)


def get_adaptive_interview_service() -> AdaptiveInterviewService:
    return AdaptiveInterviewService()


def get_interview_engine_service(
    interview_service: InterviewService = Depends(get_interview_service),
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    question_repo: QuestionRepository = Depends(get_question_repository),
    resume_repo: ResumeRepository = Depends(get_resume_repository),
    retrieval_service: RetrievalService = Depends(get_retrieval_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
    adaptive_service: AdaptiveInterviewService = Depends(get_adaptive_interview_service),
) -> InterviewEngineService:
    return InterviewEngineService(
        interview_service,
        interview_repo,
        question_repo,
        resume_repo,
        retrieval_service,
        gemini_service,
        adaptive_service,
    )


def get_text_evaluation_service(
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    question_repo: QuestionRepository = Depends(get_question_repository),
    response_repo: ResponseRepository = Depends(get_response_repository),
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> TextEvaluationService:
    return TextEvaluationService(interview_repo, question_repo, response_repo, gemini_service)


def get_speech_to_text_service() -> SpeechToTextService:
    return SpeechToTextService()


def get_video_service() -> VideoService:
    return VideoService()


def get_audio_evaluation_service(
    stt_service: SpeechToTextService = Depends(get_speech_to_text_service),
    text_evaluation_service: TextEvaluationService = Depends(get_text_evaluation_service),
) -> AudioEvaluationService:
    return AudioEvaluationService(stt_service, text_evaluation_service)


def get_video_evaluation_service(
    video_service: VideoService = Depends(get_video_service),
    stt_service: SpeechToTextService = Depends(get_speech_to_text_service),
    text_evaluation_service: TextEvaluationService = Depends(get_text_evaluation_service),
) -> VideoEvaluationService:
    return VideoEvaluationService(video_service, stt_service, text_evaluation_service)


def get_report_generation_service(
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    response_repo: ResponseRepository = Depends(get_response_repository),
    report_repo: ReportRepository = Depends(get_report_repository),
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> ReportGenerationService:
    return ReportGenerationService(interview_repo, response_repo, report_repo, gemini_service)


def get_report_service(
    report_repo: ReportRepository = Depends(get_report_repository),
    report_generation_service: ReportGenerationService = Depends(get_report_generation_service),
) -> ReportService:
    return ReportService(report_repo, report_generation_service)


def get_analytics_service(
    interview_repo: InterviewRepository = Depends(get_interview_repository),
    response_repo: ResponseRepository = Depends(get_response_repository),
    report_repo: ReportRepository = Depends(get_report_repository),
) -> AnalyticsService:
    return AnalyticsService(interview_repo, response_repo, report_repo)
