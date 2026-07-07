import tempfile
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.db.base  # noqa: F401
from app.db.base import Base
from app.core.enums import InterviewDifficultyEnum, InterviewDomainEnum, InterviewSourceEnum, InterviewTypeEnum, ProviderEnum
from app.core.exceptions import BadRequestException
from app.interview.adaptive_interview_service import AdaptiveInterviewService
from app.interview.interview_engine_service import InterviewEngineService
from app.models.interview import Interview
from app.models.resume import Resume
from app.models.response import Response
from app.models.user import User
from app.repositories.interview_repository import InterviewRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.resume_repository import ResumeRepository
from app.repositories.user_repository import UserRepository
from app.schemas.ai import InterviewStartRequest
from app.services.interview_service import InterviewService


class DummyGeminiService:
    def generate_json(self, prompt: str, *, default: dict | None = None) -> dict:
        return default or {}


class RepeatingGeminiService:
    def generate_json(self, prompt: str, *, default: dict | None = None) -> dict:
        return {
            "questions": [
                {
                    "question_text": "Tell me about a project or experience that is relevant to Software Development.",
                    "question_type": "Technical",
                    "difficulty": "Medium",
                    "generated_by": "AI",
                    "question_order": 1,
                }
            ]
        }


class DummyRetrievalService:
    def __init__(self):
        self.retrieve_calls = []

    def build_query(self, *, domain: str, difficulty: str, interview_type: str, mode: str, resume_text: str | None = None) -> str:
        return f"{domain}|{difficulty}|{interview_type}|{mode}|{resume_text or ''}"

    def retrieve(self, *, query_text: str, user_id: str, resume_id: str | None = None, n_results: int = 5) -> list[dict]:
        self.retrieve_calls.append((query_text, user_id, resume_id, n_results))
        return [{"document": "resume chunk", "metadata": {"resume_id": resume_id}}]


def build_engine(db_session, *, gemini_service=None):
    interview_repo = InterviewRepository(db_session)
    question_repo = QuestionRepository(db_session)
    resume_repo = ResumeRepository(db_session)
    interview_service = InterviewService(interview_repo)
    retrieval_service = DummyRetrievalService()
    engine = InterviewEngineService(
        interview_service,
        interview_repo,
        question_repo,
        resume_repo,
        retrieval_service,
        gemini_service or DummyGeminiService(),
        AdaptiveInterviewService(),
    )
    return engine, interview_repo, resume_repo, question_repo, retrieval_service


def test_start_interview_generates_first_question_for_generic_and_resume_based():
    tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp_db.close()
    engine = create_engine(f"sqlite:///{tmp_db.name}", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

    try:
        with SessionLocal() as db:
            user_repo = UserRepository(db)
            user = user_repo.create(
                User(
                    name="Test User",
                    email="test@example.com",
                    provider=ProviderEnum.LOCAL,
                    is_verified=True,
                )
            )
            resume = Resume(
                user_id=user.id,
                alias="Swift Atlas 1A2B",
                file_path="/tmp/resume.pdf",
                parsed_text="Experience working on frontend systems.",
                ats_score=88,
            )
            db.add(resume)
            db.commit()
            db.refresh(resume)

            engine_service, interview_repo, _resume_repo, question_repo, retrieval = build_engine(db)

            generic_payload = InterviewStartRequest(
                title="Frontend Loop",
                domain=InterviewDomainEnum.SOFTWARE_DEVELOPMENT,
                difficulty=InterviewDifficultyEnum.MEDIUM,
                type=InterviewTypeEnum.TECHNICAL,
                interview_mode="text",
                interview_source=InterviewSourceEnum.GENERIC,
            )
            generic_result = engine_service.start(user=user, payload=generic_payload)

            assert generic_result["interview_id"] is not None
            assert generic_result["interview"].interview_source == InterviewSourceEnum.GENERIC
            assert len(generic_result["questions"]) == 1
            assert generic_result["question"].question_order == 1

            resume_payload = InterviewStartRequest(
                title="Resume Loop",
                domain=InterviewDomainEnum.SOFTWARE_DEVELOPMENT,
                difficulty=InterviewDifficultyEnum.EASY,
                type=InterviewTypeEnum.BEHAVIORAL,
                interview_mode="text",
                interview_source=InterviewSourceEnum.RESUME_BASED,
                resume_id=resume.id,
            )
            resume_result = engine_service.start(user=user, payload=resume_payload)

            assert resume_result["resume_id"] == resume.id
            assert resume_result["interview"].resume_id == resume.id
            assert resume_result["interview"].current_question_index == 0
            assert len(retrieval.retrieve_calls) == 1
            assert interview_repo.list_by_user(user.id)
            assert question_repo.list_by_interview(resume_result["interview_id"])

    finally:
        Path(tmp_db.name).unlink(missing_ok=True)


def test_next_question_does_not_repeat_existing_question_text():
    tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp_db.close()
    engine = create_engine(f"sqlite:///{tmp_db.name}", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

    try:
        with SessionLocal() as db:
            user_repo = UserRepository(db)
            user = user_repo.create(
                User(
                    name="Test User",
                    email="test-repeat@example.com",
                    provider=ProviderEnum.LOCAL,
                    is_verified=True,
                )
            )
            engine_service, interview_repo, _resume_repo, question_repo, _retrieval = build_engine(db, gemini_service=RepeatingGeminiService())

            for mode in ("text", "audio", "video"):
                generic_payload = InterviewStartRequest(
                    title=f"Frontend Loop {mode}",
                    domain=InterviewDomainEnum.SOFTWARE_DEVELOPMENT,
                    difficulty=InterviewDifficultyEnum.MEDIUM,
                    type=InterviewTypeEnum.TECHNICAL,
                    interview_mode=mode,
                    interview_source=InterviewSourceEnum.GENERIC,
                )
                generic_result = engine_service.start(user=user, payload=generic_payload)
                interview = interview_repo.get(generic_result["interview_id"])
                first_question = question_repo.list_by_interview(interview.id)[0]

                db.add(
                    Response(
                        interview_id=interview.id,
                        question_id=first_question.id,
                        answer_type=mode,
                        answer_text="An answer that should move the flow forward.",
                        score=80,
                        feedback='{"strengths": [], "weaknesses": [], "missing_concepts": []}',
                        ideal_answer="",
                    )
                )
                db.commit()

                next_question = engine_service.generate_next_question(
                    interview=interview,
                    last_score=80,
                    last_answer="An answer that should move the flow forward.",
                    mode=mode,
                    current_difficulty=InterviewDifficultyEnum.MEDIUM.value,
                )

                assert next_question["question_order"] == 2
                assert next_question["question_text"] != first_question.question_text
                assert len(question_repo.list_by_interview(interview.id)) == 2
    finally:
        Path(tmp_db.name).unlink(missing_ok=True)


def test_resume_based_start_requires_resume_id():
    tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp_db.close()
    engine = create_engine(f"sqlite:///{tmp_db.name}", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

    try:
        with SessionLocal() as db:
            user_repo = UserRepository(db)
            user = user_repo.create(
                User(
                    name="Test User",
                    email="test2@example.com",
                    provider=ProviderEnum.LOCAL,
                    is_verified=True,
                )
            )
            engine_service, *_ = build_engine(db)

            payload = InterviewStartRequest(
                title="Resume Loop",
                domain=InterviewDomainEnum.SOFTWARE_DEVELOPMENT,
                difficulty=InterviewDifficultyEnum.EASY,
                type=InterviewTypeEnum.BEHAVIORAL,
                interview_mode="text",
                interview_source=InterviewSourceEnum.RESUME_BASED,
            )

            try:
                engine_service.start(user=user, payload=payload)
                raise AssertionError("Expected resume-based interview start to require a resume_id")
            except BadRequestException as exc:
                assert "resume_id is required" in str(exc)
    finally:
        Path(tmp_db.name).unlink(missing_ok=True)
