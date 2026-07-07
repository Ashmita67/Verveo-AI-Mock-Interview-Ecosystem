from uuid import UUID

from app.schemas.base import IDSchema, SchemaBase, TimestampSchema


class ResumeRead(IDSchema, TimestampSchema):
    user_id: UUID
    alias: str | None
    file_path: str
    parsed_text: str | None
    ats_score: int | None


class ResumeUploadResponse(SchemaBase):
    id: UUID
    alias: str | None = None
    file_path: str
    ats_score: int | None = None
    message: str = "Resume uploaded successfully."


class ResumeListResponse(SchemaBase):
    items: list[ResumeRead]


class ResumeDetailResponse(ResumeRead):
    pass
