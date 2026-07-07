import json
from uuid import UUID

from app.ai.gemini_service import GeminiService
from app.core.exceptions import NotFoundException
from app.models.response import Response
from app.prompts.templates import TEXT_EVALUATION_PROMPT
from app.repositories.interview_repository import InterviewRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.response_repository import ResponseRepository


class TextEvaluationService:
    def __init__(
        self,
        interview_repo: InterviewRepository,
        question_repo: QuestionRepository,
        response_repo: ResponseRepository,
        gemini_service: GeminiService,
    ):
        self.interview_repo = interview_repo
        self.question_repo = question_repo
        self.response_repo = response_repo
        self.gemini_service = gemini_service

    def evaluate(
        self,
        *,
        user,
        interview_id: UUID,
        question_id: UUID,
        answer_text: str,
        answer_type: str = "text",
        transcript: str | None = None,
        audio_path: str | None = None,
        video_path: str | None = None,
        is_skipped: bool = False,
    ) -> dict:
        interview = self.interview_repo.get(interview_id)
        if not interview or interview.user_id != user.id:
            raise NotFoundException("Interview not found")
        question = self.question_repo.get(question_id)
        if not question or question.interview_id != interview.id:
            raise NotFoundException("Question not found")

        prompt = (
            f"{TEXT_EVALUATION_PROMPT}\n"
            f"Question: {question.question_text}\n"
            f"Answer: {answer_text}\n"
            f"Domain: {interview.domain.value}\n"
            f"Difficulty: {interview.difficulty.value}\n"
            f"Interview Type: {interview.type.value}\n"
        )
        evaluation = self.gemini_service.generate_json(
            prompt,
            default={
                "score": 75,
                "strengths": ["Clear attempt to answer the question"],
                "weaknesses": ["Could include deeper examples"],
                "missing_concepts": ["One or two supporting details"],
                "ideal_answer": "A strong answer would define the concept, explain tradeoffs, and provide a real example.",
            },
        )

        response = self.response_repo.get_for_question(interview.id, question.id)
        if response is None:
            response = Response(
                interview_id=interview.id,
                question_id=question.id,
                answer_type=answer_type,
                answer_text=answer_text,
                transcript=transcript,
                audio_path=audio_path,
                video_path=video_path,
                score=int(evaluation.get("score", 0)),
                feedback=json.dumps(
                    {
                        "strengths": evaluation.get("strengths", []),
                        "weaknesses": evaluation.get("weaknesses", []),
                        "missing_concepts": evaluation.get("missing_concepts", []),
                    }
                ),
                ideal_answer=evaluation.get("ideal_answer"),
                is_skipped=is_skipped,
            )
            response = self.response_repo.create(response)
        else:
            response.answer_type = answer_type
            response.answer_text = answer_text
            response.transcript = transcript
            response.audio_path = audio_path
            response.video_path = video_path
            response.score = int(evaluation.get("score", 0))
            response.feedback = json.dumps(
                {
                    "strengths": evaluation.get("strengths", []),
                    "weaknesses": evaluation.get("weaknesses", []),
                    "missing_concepts": evaluation.get("missing_concepts", []),
                }
            )
            response.ideal_answer = evaluation.get("ideal_answer")
            response.is_skipped = is_skipped
            response = self.response_repo.save(response)

        return {
            "score": int(evaluation.get("score", 0)),
            "strengths": evaluation.get("strengths", []),
            "weaknesses": evaluation.get("weaknesses", []),
            "missing_concepts": evaluation.get("missing_concepts", []),
            "ideal_answer": evaluation.get("ideal_answer", ""),
            "response": response,
        }

    def skip_question(self, *, user, interview_id: UUID, question_id: UUID) -> dict:
        interview = self.interview_repo.get(interview_id)
        if not interview or interview.user_id != user.id:
            raise NotFoundException("Interview not found")
        question = self.question_repo.get(question_id)
        if not question or question.interview_id != interview.id:
            raise NotFoundException("Question not found")

        response = self.response_repo.get_for_question(interview.id, question.id)
        skipped_feedback = {
            "strengths": [],
            "weaknesses": ["Question was skipped"],
            "missing_concepts": ["Practice responding to this topic"],
        }

        if response is None:
            response = Response(
                interview_id=interview.id,
                question_id=question.id,
                answer_type="text",
                answer_text="",
                transcript=None,
                audio_path=None,
                video_path=None,
                score=0,
                feedback=json.dumps(skipped_feedback),
                ideal_answer="",
                is_skipped=True,
            )
            response = self.response_repo.create(response)
        else:
            response.answer_type = "text"
            response.answer_text = ""
            response.transcript = None
            response.audio_path = None
            response.video_path = None
            response.score = 0
            response.feedback = json.dumps(skipped_feedback)
            response.ideal_answer = ""
            response.is_skipped = True
            response = self.response_repo.save(response)

        return {
            "score": 0,
            "strengths": [],
            "weaknesses": skipped_feedback["weaknesses"],
            "missing_concepts": skipped_feedback["missing_concepts"],
            "ideal_answer": "",
            "response": response,
        }
