from app.rag.chroma_service import ChromaDBService
from app.rag.embedding_service import EmbeddingService


class RetrievalService:
    def __init__(self, chroma_service: ChromaDBService, embedding_service: EmbeddingService):
        self.chroma_service = chroma_service
        self.embedding_service = embedding_service

    def build_query(self, *, domain: str, difficulty: str, interview_type: str, mode: str, resume_text: str | None = None) -> str:
        return (
            f"Domain: {domain}\n"
            f"Difficulty: {difficulty}\n"
            f"Interview Type: {interview_type}\n"
            f"Mode: {mode}\n"
            f"Resume Context: {(resume_text or '')[:3000]}"
        )

    def retrieve(self, *, query_text: str, user_id: str, resume_id: str | None = None, n_results: int = 5) -> list[dict]:
        query_embedding = self.embedding_service.embed(query_text)
        return self.chroma_service.query(
            query_embeddings=[query_embedding],
            user_id=user_id,
            resume_id=resume_id,
            n_results=n_results,
        )
