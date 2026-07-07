from pathlib import Path
from typing import Any

import chromadb

from app.core.config import settings


class ChromaDBService:
    def __init__(self):
        Path(settings.chroma_dir).mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=settings.chroma_dir)
        self.collection = self.client.get_or_create_collection(name="verveo_resume_chunks")

    def upsert_chunks(self, *, ids: list[str], documents: list[str], metadatas: list[dict[str, Any]], embeddings: list[list[float]]) -> None:
        self.collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)

    def query(
        self,
        *,
        query_embeddings: list[list[float]],
        user_id: str,
        resume_id: str | None = None,
        n_results: int = 5,
    ) -> list[dict[str, Any]]:
        where = {"user_id": user_id}
        if resume_id:
            where = {"$and": [{"user_id": user_id}, {"resume_id": resume_id}]}
        result = self.collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results,
            where=where,
        )
        documents = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        ids = result.get("ids", [[]])[0]
        items = []
        for index, document in enumerate(documents):
            items.append(
                {
                    "id": ids[index] if index < len(ids) else None,
                    "document": document,
                    "metadata": metadatas[index] if index < len(metadatas) else {},
                }
            )
        return items

    def clear_user_chunks(self, user_id: str) -> None:
        self.collection.delete(where={"user_id": user_id})

    def clear_resume_chunks(self, resume_id: str) -> None:
        self.collection.delete(where={"resume_id": resume_id})
