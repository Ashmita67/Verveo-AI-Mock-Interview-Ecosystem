from app.ai.gemini_service import GeminiService


class EmbeddingService:
    def __init__(self, gemini_service: GeminiService):
        self.gemini_service = gemini_service

    def embed(self, text: str) -> list[float]:
        return self.gemini_service.embed_text(text)
