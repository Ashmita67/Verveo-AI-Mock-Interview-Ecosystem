import subprocess
from pathlib import Path

import cv2

from app.core.config import settings


class VideoService:
    def extract_audio(self, video_path: str, output_audio_path: str) -> str:
        Path(output_audio_path).parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                settings.ffmpeg_binary,
                "-y",
                "-i",
                video_path,
                "-vn",
                "-ac",
                "1",
                "-ar",
                "16000",
                output_audio_path,
            ],
            check=True,
            capture_output=True,
        )
        return output_audio_path

    def analyze_video(self, video_path: str) -> dict:
        capture = cv2.VideoCapture(video_path)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
        duration = frame_count / fps if fps else 0.0

        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        face_hits = 0
        sampled_frames = 0

        sample_step = max(1, frame_count // 20 or 1)
        for frame_index in range(0, frame_count, sample_step):
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame = capture.read()
            if not ok:
                continue
            sampled_frames += 1
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
            if len(faces) > 0:
                face_hits += 1

        capture.release()
        return {
            "duration_seconds": round(duration, 2),
            "face_presence_ratio": round(face_hits / sampled_frames, 2) if sampled_frames else 0.0,
        }
