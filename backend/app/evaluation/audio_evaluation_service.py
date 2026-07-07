from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

from app.evaluation.text_evaluation_service import TextEvaluationService
from app.parsers.speech_to_text_service import SpeechToTextService
from app.utils.files import build_upload_path, ensure_dir


class AudioEvaluationService:
    def __init__(self, stt_service: SpeechToTextService, text_evaluation_service: TextEvaluationService):
        self.stt_service = stt_service
        self.text_evaluation_service = text_evaluation_service

    async def evaluate(self, *, user, interview_id: UUID, question_id: UUID, file: UploadFile, upload_dir: str) -> dict:
        ensure_dir(upload_dir)
        file_path = build_upload_path(upload_dir, f"{question_id}-{file.filename}")
        Path(file_path).write_bytes(await file.read())
        transcript_data = self.stt_service.transcribe(str(file_path))
        evaluation = self.text_evaluation_service.evaluate(
            user=user,
            interview_id=interview_id,
            question_id=question_id,
            answer_text=transcript_data["transcript"],
            answer_type="audio",
            transcript=transcript_data["transcript"],
            audio_path=str(file_path),
        )
        return {
            "transcript": transcript_data["transcript"],
            "score": evaluation["score"],
            "strengths": evaluation["strengths"],
            "weaknesses": evaluation["weaknesses"],
            "missing_concepts": evaluation["missing_concepts"],
            "ideal_answer": evaluation["ideal_answer"],
            "response": evaluation["response"],
        }
