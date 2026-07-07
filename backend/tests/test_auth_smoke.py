import asyncio
import tempfile
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.db.base  # noqa: F401
from app.core.enums import OtpPurposeEnum, ProviderEnum
from app.db.base import Base
from app.services.email_service import EmailService
from app.repositories.otp_repository import OtpRepository
from app.repositories.token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, VerifyOtpRequest
from app.services.auth_service import AuthService
from app.services.google_oauth_service import GoogleOAuthService
from app.services.otp_service import OtpService
from app.services.token_service import TokenService


class DummyEmailService(EmailService):
    def send_otp(self, email: str, otp: str, purpose: str) -> None:
        self.last_otp = otp
        self.last_email = email
        self.last_purpose = purpose


class DummyGoogleOAuthService(GoogleOAuthService):
    async def exchange_code_for_user(self, code: str) -> dict:
        return {
            "email": "google@example.com",
            "name": "Google User",
        }


def build_auth_service(db_session):
    user_repo = UserRepository(db_session)
    otp_repo = OtpRepository(db_session)
    refresh_repo = RefreshTokenRepository(db_session)
    token_service = TokenService()
    email_service = DummyEmailService()
    otp_service = OtpService(otp_repo, email_service)
    auth_service = AuthService(
        user_repo,
        refresh_repo,
        otp_repo,
        token_service,
        otp_service,
        DummyGoogleOAuthService(),
    )
    return auth_service, email_service


def test_auth_register_verify_login_and_google_callback():
    tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp_db.close()
    engine = create_engine(f"sqlite:///{tmp_db.name}", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

    try:
        with SessionLocal() as db:
            auth_service, email_service = build_auth_service(db)
            register_response = auth_service.register(
                RegisterRequest(name="Test User", email="test@example.com", password="strong-password")
            )
            assert register_response["detail"] == "Registration successful. OTP sent to email."
            assert email_service.last_email == "test@example.com"
            assert email_service.last_purpose == OtpPurposeEnum.REGISTER.value

            otp = email_service.last_otp
            verify_response = auth_service.verify_otp(VerifyOtpRequest(email="test@example.com", otp=otp))
            assert verify_response["token_type"] == "bearer"

        with SessionLocal() as db:
            auth_service, _ = build_auth_service(db)
            login_response = auth_service.login(LoginRequest(email="test@example.com", password="strong-password"))
            assert login_response["token_type"] == "bearer"

        with SessionLocal() as db:
            auth_service, _ = build_auth_service(db)
            google_response = asyncio.run(auth_service.google_callback("fake-code"))
            assert google_response["token_type"] == "bearer"
            user = UserRepository(db).get_by_email("google@example.com")
            assert user is not None
            assert user.provider == ProviderEnum.GOOGLE
    finally:
        Path(tmp_db.name).unlink(missing_ok=True)


def test_email_service_falls_back_when_smtp_is_unavailable(monkeypatch):
    calls = []

    class BrokenSender:
        def send(self, *_args, **_kwargs):
            raise OSError("smtp unreachable")

    class CapturingConsoleSender:
        def send(self, to_email: str, subject: str, body: str) -> None:
            calls.append((to_email, subject, body))

    monkeypatch.setattr("app.services.email_service.get_email_sender", lambda: BrokenSender())
    monkeypatch.setattr("app.utils.email.ConsoleEmailSender", CapturingConsoleSender)

    EmailService().send_otp("fallback@example.com", "123456", "register")

    assert calls == [("fallback@example.com", "Verveo verification code", "Your Verveo OTP is 123456. It expires soon.")]
