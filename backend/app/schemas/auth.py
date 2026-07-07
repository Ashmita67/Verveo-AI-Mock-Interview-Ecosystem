from pydantic import EmailStr, Field

from app.schemas.base import SchemaBase
from app.schemas.common import TokenPairResponse


class RegisterRequest(SchemaBase):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class VerifyOtpRequest(SchemaBase):
    email: EmailStr
    otp: str = Field(min_length=4, max_length=8)


class LoginRequest(SchemaBase):
    email: EmailStr
    password: str


class RefreshRequest(SchemaBase):
    refresh_token: str


class LogoutRequest(SchemaBase):
    refresh_token: str


class ForgotPasswordRequest(SchemaBase):
    email: EmailStr


class ResetPasswordRequest(SchemaBase):
    email: EmailStr
    otp: str
    new_password: str = Field(min_length=8, max_length=128)


class GoogleLoginResponse(SchemaBase):
    auth_url: str


class GoogleCallbackResponse(TokenPairResponse):
    pass
