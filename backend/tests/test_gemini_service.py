from app.ai.gemini_service import GeminiService
from app.core.config import settings


class _FakeEmbedding:
    def __init__(self, values):
        self.values = values


class _FakeResponse:
    def __init__(self, values):
        self.embeddings = [_FakeEmbedding(values)]


class _FakeModels:
    def __init__(self):
        self.last_call = None

    def embed_content(self, *, model, contents, config=None):
        self.last_call = {
            "model": model,
            "contents": contents,
            "config": config,
        }
        return _FakeResponse([0.1, 0.2, 0.3])


class _FakeClient:
    def __init__(self):
        self.models = _FakeModels()


def test_embed_text_uses_embeddings_response_shape():
    service = GeminiService()
    service._client = _FakeClient()
    service.embedding_model = "gemini-embedding-001"

    values = service.embed_text("hello world")

    assert values == [0.1, 0.2, 0.3]
    assert service._client.models.last_call["contents"] == ["hello world"]
    assert service._client.models.last_call["config"].output_dimensionality == settings.gemini_embedding_output_dimensionality


def test_fallback_embedding_uses_configured_dimension():
    service = GeminiService()
    service._client = None

    values = service.embed_text("hello world")

    assert len(values) == settings.gemini_embedding_output_dimensionality
