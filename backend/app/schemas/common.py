from uuid import UUID

from pydantic import Field

from app.schemas.base import SchemaBase


class MessageResponse(SchemaBase):
    detail: str


class TokenPairResponse(SchemaBase):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(default=0)


class PaginationMeta(SchemaBase):
    page: int
    page_size: int
    total: int
