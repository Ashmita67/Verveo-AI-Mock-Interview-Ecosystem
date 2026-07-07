from pathlib import Path

from faster_whisper import WhisperModel

from app.core.config import settings


class SpeechToTextService:
    def __init__(self):
        self.model_size = settings.whisper_model_size
        self._model: WhisperModel | None = None

    @property
    def model(self) -> WhisperModel:
        if self._model is None:
            self._model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
        return self._model

    def transcribe(self, audio_path: str) -> dict:
        segments, info = self.model.transcribe(audio_path, vad_filter=True)
        transcript_parts = []
        segment_list = []
        for segment in segments:
            transcript_parts.append(segment.text.strip())
            segment_list.append({"start": segment.start, "end": segment.end, "text": segment.text.strip()})
        return {
            "transcript": " ".join(part for part in transcript_parts if part).strip(),
            "segments": segment_list,
            "language": getattr(info, "language", None),
        }
