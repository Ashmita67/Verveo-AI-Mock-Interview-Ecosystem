from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

ModelT = TypeVar("ModelT")


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: type[ModelT], db: Session):
        self.model = model
        self.db = db

    def _commit(self):
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def create(self, obj: ModelT) -> ModelT:
        self.db.add(obj)
        self._commit()
        self.db.refresh(obj)
        return obj

    def get(self, obj_id):
        return self.db.get(self.model, obj_id)

    def list(self, *, offset: int = 0, limit: int = 100):
        stmt = select(self.model).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())

    def delete(self, obj):
        self.db.delete(obj)
        self._commit()

    def save(self, obj):
        self.db.add(obj)
        self._commit()
        self.db.refresh(obj)
        return obj
