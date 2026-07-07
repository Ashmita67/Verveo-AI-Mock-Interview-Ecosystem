from pydantic import EmailStr, Field

from app.core.enums import ProviderEnum
from app.schemas.base import IDSchema, SchemaBase, TimestampSchema


class UserRead(IDSchema, TimestampSchema):
    name: str
    email: EmailStr
    provider: ProviderEnum
    is_verified: bool


class UserUpdate(SchemaBase):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    email: EmailStr | None = None


class UserMeResponse(UserRead):
    pass
