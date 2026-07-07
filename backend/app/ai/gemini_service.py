import json
import re
from hashlib import sha256
from typing import Any

import structlog
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.exceptions import UnauthorizedException

logger = structlog.get_logger(__name__)


class GeminiService:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model
        self.embedding_model = settings.gemini_embedding_model
        self._client = genai.Client(api_key=self.api_key) if self.api_key else None

    def is_configured(self) -> bool:
        return self._client is not None

    def _clean_json(self, text: str) -> str:
        text = text.strip()
        text = re.sub(r"^```json\s*", "", text)
        text = re.sub(r"^```\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return text.strip()

    def generate_text(self, prompt: str, *, temperature: float = 0.4) -> str:
        if not self._client:
            raise UnauthorizedException("Gemini is not configured")
        response = self._client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=temperature),
        )
        return getattr(response, "text", "") or ""

    def generate_json(self, prompt: str, *, default: dict[str, Any] | None = None) -> dict[str, Any]:
        default = default or {}
        try:
            text = self.generate_text(prompt)
            return json.loads(self._clean_json(text))
        except Exception:
            return default

    def embed_text(self, text: str) -> list[float]:
        if not self._client:
            return self._fallback_embedding(text, settings.gemini_embedding_output_dimensionality)
        try:
            response = self._client.models.embed_content(
                model=self.embedding_model,
                contents=[text],
                config=types.EmbedContentConfig(
                    output_dimensionality=settings.gemini_embedding_output_dimensionality,
                ),
            )
            values = self._extract_embedding_values(response)
            if values:
                return values
            logger.warning(
                "gemini.embedding_missing_values",
                model=self.embedding_model,
                text_length=len(text),
            )
        except Exception as exc:
            logger.warning(
                "gemini.embedding_failed_falling_back",
                model=self.embedding_model,
                text_length=len(text),
                error=str(exc),
            )
        return self._fallback_embedding(text, settings.gemini_embedding_output_dimensionality)

    def _extract_embedding_values(self, response: Any) -> list[float]:
        embeddings = getattr(response, "embeddings", None)
        if embeddings:
            first_embedding = embeddings[0]
            values = getattr(first_embedding, "values", None)
            if values:
                return list(values)

        embedding = getattr(response, "embedding", None)
        if embedding:
            values = getattr(embedding, "values", None)
            if values:
                return list(values)

        return []

    def _fallback_embedding(self, text: str, dimensions: int = 64) -> list[float]:
        digest = sha256(text.encode("utf-8")).digest()
        values = []
        for index in range(dimensions):
            byte = digest[index % len(digest)]
            values.append(byte / 255.0)
        return values
