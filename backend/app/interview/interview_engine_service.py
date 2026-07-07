import json
from datetime import datetime, timezone
from uuid import UUID

from app.ai.gemini_service import GeminiService
from app.core.enums import InterviewSourceEnum, InterviewStatusEnum, QuestionGeneratedByEnum
from app.core.exceptions import BadRequestException, NotFoundException
from app.models.interview import Interview
from app.prompts.templates import ADAPTIVE_QUESTION_PROMPT, QUESTION_GENERATION_PROMPT, RESUME_BASED_QUESTION_PROMPT
from app.repositories.interview_repository import InterviewRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.resume_repository import ResumeRepository
from app.rag.retrieval_service import RetrievalService
from app.interview.adaptive_interview_service import AdaptiveInterviewService
from app.services.interview_service import InterviewService
from app.utils.time import utc_now


class InterviewEngineService:
    def __init__(
        self,
        interview_service: InterviewService,
        interview_repo: InterviewRepository,
        question_repo: QuestionRepository,
        resume_repo: ResumeRepository,
        retrieval_service: RetrievalService,
        gemini_service: GeminiService,
        adaptive_service: AdaptiveInterviewService,
    ):
        self.interview_service = interview_service
        self.interview_repo = interview_repo
        self.question_repo = question_repo
        self.resume_repo = resume_repo
        self.retrieval_service = retrieval_service
        self.gemini_service = gemini_service
        self.adaptive_service = adaptive_service

    def _get_resume_for_user(self, user_id: UUID, resume_id: UUID | None) -> object | None:
        if not resume_id:
            return None
        resume = self.resume_repo.get(resume_id)
        if not resume or resume.user_id != user_id:
            raise NotFoundException("Resume not found")
        return resume

    def _build_resume_context(self, *, user_id: UUID, resume_id: UUID | None, domain: str, difficulty: str, interview_type: str, mode: str) -> tuple[str, object | None]:
        resume = self._get_resume_for_user(user_id, resume_id)
        if not resume:
            return "", None

        query_text = self.retrieval_service.build_query(
            domain=domain,
            difficulty=difficulty,
            interview_type=interview_type,
            mode=mode,
            resume_text=resume.alias or "",
        )
        retrieved_chunks = self.retrieval_service.retrieve(
            query_text=query_text,
            user_id=str(user_id),
            resume_id=str(resume.id),
            n_results=4,
        )
        combined_context = "\n\n".join(chunk["document"] for chunk in retrieved_chunks if chunk.get("document"))
        return combined_context, resume

    def _build_prompt(
        self,
        *,
        source: InterviewSourceEnum,
        domain: str,
        difficulty: str,
        interview_type: str,
        mode: str,
        title: str,
        context: str = "",
        previous_answer: str | None = None,
        previous_score: int | None = None,
        current_question_index: int = 0,
    ) -> str:
        base_prompt = RESUME_BASED_QUESTION_PROMPT if source == InterviewSourceEnum.RESUME_BASED else QUESTION_GENERATION_PROMPT
        if previous_answer is not None:
            base_prompt = ADAPTIVE_QUESTION_PROMPT

        payload = {
            "title": title,
            "domain": domain,
            "difficulty": difficulty,
            "interview_type": interview_type,
            "mode": mode,
            "current_question_index": current_question_index,
            "resume_context": context,
            "previous_answer": previous_answer or "",
            "previous_score": previous_score,
        }

        return f"{base_prompt}\n{json.dumps(payload, default=str)}"

    def _default_question(self, *, title: str, domain: str, difficulty: str, interview_type: str, source: InterviewSourceEnum) -> dict:
        if source == InterviewSourceEnum.RESUME_BASED:
            question_text = f"How does your experience prepare you for a {domain} role?"
        else:
            question_text = f"Tell me about a project or experience that is relevant to {domain}."

        return {
            "question_text": question_text,
            "question_type": interview_type,
            "difficulty": difficulty,
            "generated_by": QuestionGeneratedByEnum.AI.value,
            "question_order": 1,
        }

    def _fallback_question(self, *, title: str, domain: str, difficulty: str, interview_type: str, source: InterviewSourceEnum, question_order: int) -> dict:
        if source == InterviewSourceEnum.RESUME_BASED:
            templates = [
                f"What parts of your resume best prepare you for a {domain} role?",
                f"Can you expand on a project from your resume and the tradeoffs you made?",
                f"How would you apply your past experience to a new {domain} challenge?",
                f"What is one achievement on your resume that you would improve with more time?",
            ]
        else:
            templates = [
                f"What is the purpose of a loop in programming, and where would you use one?",
                f"How would you debug a problem you have not seen before in a {domain} project?",
                f"Describe a technical tradeoff you would make while building a {domain} feature.",
                f"How do you test that a solution for a {domain} problem is correct and maintainable?",
            ]

        index = min(max(question_order - 1, 0), len(templates) - 1)
        return {
            "question_text": templates[index],
            "question_type": interview_type,
            "difficulty": difficulty,
            "generated_by": QuestionGeneratedByEnum.AI.value,
            "question_order": question_order,
        }

    def _normalize_question_text(self, value: str) -> str:
        return " ".join(value.lower().split())

    def _is_duplicate_question(self, question_text: str, existing_question_texts: set[str]) -> bool:
        return self._normalize_question_text(question_text) in existing_question_texts

    def _normalize_question_data(
        self,
        data: dict,
        *,
        title: str,
        domain: str,
        difficulty: str,
        interview_type: str,
        source: InterviewSourceEnum,
    ) -> dict:
        default_question = self._default_question(
            title=title,
            domain=domain,
            difficulty=difficulty,
            interview_type=interview_type,
            source=source,
        )

        generated_by = data.get("generated_by")
        if generated_by not in {item.value for item in QuestionGeneratedByEnum}:
            generated_by = default_question["generated_by"]

        question_type = data.get("question_type") or default_question["question_type"]
        if not isinstance(question_type, str) or not question_type.strip():
            question_type = default_question["question_type"]

        normalized_difficulty = data.get("difficulty") or default_question["difficulty"]
        if not isinstance(normalized_difficulty, str) or not normalized_difficulty.strip():
            normalized_difficulty = default_question["difficulty"]

        question_text = data.get("question_text") or default_question["question_text"]
        if not isinstance(question_text, str) or not question_text.strip():
            question_text = default_question["question_text"]

        question_order = data.get("question_order") or default_question["question_order"]
        try:
            question_order = int(question_order)
        except (TypeError, ValueError):
            question_order = default_question["question_order"]

        return {
            "question_text": question_text,
            "question_type": question_type,
            "difficulty": normalized_difficulty,
            "generated_by": generated_by,
            "question_order": question_order,
        }

    def _generate_question(
        self,
        *,
        title: str,
        domain: str,
        difficulty: str,
        interview_type: str,
        mode: str,
        source: InterviewSourceEnum,
        context: str = "",
        previous_answer: str | None = None,
        previous_score: int | None = None,
        current_question_index: int = 0,
        existing_question_texts: set[str] | None = None,
        question_order: int = 1,
    ) -> dict:
        prompt = self._build_prompt(
            source=source,
            domain=domain,
            difficulty=difficulty,
            interview_type=interview_type,
            mode=mode,
            title=title,
            context=context,
            previous_answer=previous_answer,
            previous_score=previous_score,
            current_question_index=current_question_index,
        )
        generated = self.gemini_service.generate_json(
            prompt,
            default={"questions": [self._default_question(title=title, domain=domain, difficulty=difficulty, interview_type=interview_type, source=source)]},
        )
        questions = generated.get("questions") or []
        raw_question = questions[0] if questions else self._default_question(title=title, domain=domain, difficulty=difficulty, interview_type=interview_type, source=source)
        normalized = self._normalize_question_data(
            raw_question,
            title=title,
            domain=domain,
            difficulty=difficulty,
            interview_type=interview_type,
            source=source,
        )
        normalized["question_order"] = question_order

        if existing_question_texts and self._is_duplicate_question(normalized["question_text"], existing_question_texts):
            normalized = self._fallback_question(
                title=title,
                domain=domain,
                difficulty=difficulty,
                interview_type=interview_type,
                source=source,
                question_order=question_order,
            )
        return normalized

    def _persist_question(self, *, interview: Interview, data: dict, question_order: int) -> object:
        question = self.question_repo.model(
            interview_id=interview.id,
            question_text=data.get("question_text", ""),
            question_type=data.get("question_type", interview.type.value),
            difficulty=data.get("difficulty", interview.difficulty.value),
            generated_by=data.get("generated_by", QuestionGeneratedByEnum.AI.value),
            question_order=question_order,
        )
        saved = self.question_repo.create(question)
        interview.current_question_index = saved.question_order - 1
        self.interview_repo.save(interview)
        return saved

    def start(self, *, user, payload) -> dict:
        if payload.interview_source == InterviewSourceEnum.RESUME_BASED and not payload.resume_id:
            raise BadRequestException("resume_id is required for resume-based interviews")

        resume_context = ""
        resume = None
        if payload.interview_source == InterviewSourceEnum.RESUME_BASED:
            resume_context, resume = self._build_resume_context(
                user_id=user.id,
                resume_id=payload.resume_id,
                domain=payload.domain.value,
                difficulty=payload.difficulty.value,
                interview_type=payload.type.value,
                mode=payload.interview_mode,
            )

        interview = self.interview_service.create(
            user,
            payload,
            interview_source=payload.interview_source,
            interview_mode=payload.interview_mode,
            resume_id=resume.id if resume else None,
            current_question_index=0,
            started_at=utc_now(),
            ended_at=None,
            status=InterviewStatusEnum.ACTIVE,
        )

        existing_question_texts: set[str] = set()

        first_question_data = self._generate_question(
            title=payload.title,
            domain=payload.domain.value,
            difficulty=payload.difficulty.value,
            interview_type=payload.type.value,
            mode=payload.interview_mode,
            source=payload.interview_source,
            context=resume_context,
            existing_question_texts=existing_question_texts,
            question_order=1,
        )
        first_question = self._persist_question(interview=interview, data=first_question_data, question_order=1)

        return {
            "interview_id": interview.id,
            "interview": interview,
            "interview_mode": payload.interview_mode,
            "interview_source": payload.interview_source,
            "resume_id": interview.resume_id,
            "question": first_question,
            "questions": [first_question],
        }

    def generate_next_question(
        self,
        *,
        interview,
        last_score: int | None,
        last_answer: str | None,
        mode: str,
        current_difficulty: str | None = None,
    ) -> dict:
        source = interview.interview_source or InterviewSourceEnum.GENERIC
        difficulty = current_difficulty or interview.difficulty.value
        adjusted_difficulty = self.adaptive_service.adjust_difficulty(difficulty, last_score)
        existing_question_texts = {
            self._normalize_question_text(question.question_text)
            for question in self.question_repo.list_by_interview(interview.id)
            if question.question_text
        }
        next_question_order = len(existing_question_texts) + 1

        resume_context = ""
        if source == InterviewSourceEnum.RESUME_BASED and interview.resume_id:
            resume_context, _resume = self._build_resume_context(
                user_id=interview.user_id,
                resume_id=interview.resume_id,
                domain=interview.domain.value,
                difficulty=adjusted_difficulty,
                interview_type=interview.type.value,
                mode=mode,
            )

        next_question_data = self._generate_question(
            title=interview.title,
            domain=interview.domain.value,
            difficulty=adjusted_difficulty,
            interview_type=interview.type.value,
            mode=mode,
            source=source,
            context=resume_context,
            previous_answer=last_answer,
            previous_score=last_score,
            current_question_index=interview.current_question_index,
            existing_question_texts=existing_question_texts,
            question_order=next_question_order,
        )
        saved = self._persist_question(interview=interview, data=next_question_data, question_order=len(self.question_repo.list_by_interview(interview.id)) + 1)
        return {
            "id": saved.id,
            "question_text": saved.question_text,
            "question_type": saved.question_type,
            "difficulty": saved.difficulty,
            "generated_by": saved.generated_by,
            "question_order": saved.question_order,
        }
