import structlog
from app.models.resume import Resume
from app.parsers.ats_service import ATSService
from app.parsers.resume_parser_service import ResumeParserService
from app.rag.chunking_service import ChunkingService
from app.rag.embedding_service import EmbeddingService
from app.rag.chroma_service import ChromaDBService

logger = structlog.get_logger(__name__)


class ResumeIntelligenceService:
    def __init__(
        self,
        parser_service: ResumeParserService,
        ats_service: ATSService,
        chunking_service: ChunkingService,
        embedding_service: EmbeddingService,
        chroma_service: ChromaDBService,
    ):
        self.parser_service = parser_service
        self.ats_service = ats_service
        self.chunking_service = chunking_service
        self.embedding_service = embedding_service
        self.chroma_service = chroma_service

    def process(self, *, user, resume: Resume) -> Resume:
        parsed = self.parser_service.parse(resume.file_path)
        parsed_text = parsed["raw_text"]
        sections = parsed["sections"]
        ats_score = self.ats_service.score(parsed_text)
        chunks = self.chunking_service.chunk_structured_resume(sections)

        resume.parsed_text = parsed_text
        resume.ats_score = ats_score
        self.chroma_service.clear_resume_chunks(str(resume.id))

        if chunks:
            try:
                ids = []
                documents = []
                metadatas = []
                embeddings = []
                for index, chunk in enumerate(chunks, start=1):
                    chunk_id = f"{resume.id}-{index}"
                    ids.append(chunk_id)
                    documents.append(chunk.chunk_text)
                    metadatas.append(
                        {
                            "user_id": str(user.id),
                            "resume_id": str(resume.id),
                            "chunk_type": chunk.chunk_type,
                            "chunk_text": chunk.chunk_text,
                        }
                    )
                    embeddings.append(self.embedding_service.embed(chunk.chunk_text))
                self.chroma_service.upsert_chunks(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas,
                    embeddings=embeddings,
                )
            except Exception as exc:
                logger.warning(
                    "resume.vector_indexing_failed",
                    user_id=str(user.id),
                    resume_id=str(resume.id),
                    error=str(exc),
                )

        return resume

    def build_user_resume_context(self, user, resume_repo) -> tuple[str, object | None]:
        resumes = resume_repo.list_by_user(user.id)
        if not resumes:
            return "", None
        latest = resumes[0]
        return latest.parsed_text or "", latest
