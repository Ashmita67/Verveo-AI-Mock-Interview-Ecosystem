from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import UUID

from fastapi import UploadFile

from app.evaluation.text_evaluation_service import TextEvaluationService
from app.parsers.speech_to_text_service import SpeechToTextService
from app.parsers.video_service import VideoService
from app.utils.files import build_upload_path, ensure_dir


class VideoEvaluationService:
    def __init__(self, video_service: VideoService, stt_service: SpeechToTextService, text_evaluation_service: TextEvaluationService):
        self.video_service = video_service
        self.stt_service = stt_service
        self.text_evaluation_service = text_evaluation_service

    async def evaluate(self, *, user, interview_id: UUID, question_id: UUID, file: UploadFile, upload_dir: str) -> dict:
        ensure_dir(upload_dir)
        video_path = build_upload_path(upload_dir, f"{question_id}-{file.filename}")
        Path(video_path).write_bytes(await file.read())

        with TemporaryDirectory() as tmpdir:
            audio_path = Path(tmpdir) / f"{video_path.stem}.wav"
            self.video_service.extract_audio(str(video_path), str(audio_path))
            transcript_data = self.stt_service.transcribe(str(audio_path))
            confidence_metrics = self.video_service.analyze_video(str(video_path))
            word_count = len(transcript_data["transcript"].split())
            duration_minutes = max(confidence_metrics.get("duration_seconds", 0.0) / 60.0, 0.01)
            speaking_pace = round(word_count / duration_minutes, 2)
            confidence_metrics.update(
                {
                    "speaking_pace_wpm": speaking_pace,
                    "speaking_confidence": round(min(100.0, (confidence_metrics.get("face_presence_ratio", 0.0) * 80) + 20), 2),
                    "eye_contact_estimation": round(confidence_metrics.get("face_presence_ratio", 0.0) * 100, 2),
                }
            )
            evaluation = self.text_evaluation_service.evaluate(
                user=user,
                interview_id=interview_id,
                question_id=question_id,
                answer_text=transcript_data["transcript"],
                answer_type="video",
                transcript=transcript_data["transcript"],
                audio_path=str(audio_path),
                video_path=str(video_path),
            )

        return {
            "transcript": transcript_data["transcript"],
            "score": evaluation["score"],
            "confidence_metrics": confidence_metrics,
            "strengths": evaluation["strengths"],
            "weaknesses": evaluation["weaknesses"],
            "missing_concepts": evaluation["missing_concepts"],
            "ideal_answer": evaluation["ideal_answer"],
            "response": evaluation["response"],
        }
