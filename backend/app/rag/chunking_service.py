from dataclasses import dataclass
import re


@dataclass
class ResumeChunk:
    chunk_type: str
    chunk_text: str


class ChunkingService:
    section_headers = ("skills", "projects", "experience", "education", "certifications")

    def chunk_structured_resume(self, sections: dict[str, str]) -> list[ResumeChunk]:
        chunks: list[ResumeChunk] = []
        for section_name in self.section_headers:
            content = (sections.get(section_name) or "").strip()
            if not content:
                continue
            pieces = self._split_text(content)
            for piece in pieces:
                if piece.strip():
                    chunks.append(ResumeChunk(chunk_type=section_name, chunk_text=piece.strip()))
        return chunks

    def _split_text(self, text: str, max_chars: int = 900) -> list[str]:
        bullets = [part.strip() for part in re.split(r"\n\s*[-•*]\s*", text) if part.strip()]
        if len(bullets) > 1:
            return bullets
        paragraphs = [part.strip() for part in re.split(r"\n{2,}", text) if part.strip()]
        if paragraphs:
            return paragraphs
        return [text[i : i + max_chars] for i in range(0, len(text), max_chars)] or [text]
