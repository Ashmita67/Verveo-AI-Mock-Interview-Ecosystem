from datetime import datetime, timezone
from uuid import UUID

import structlog

from app.core.config import settings
from app.core.enums import OtpPurposeEnum, ProviderEnum, TokenTypeEnum
from app.core.exceptions import NotFoundException, UnauthorizedException
from app.core.security import get_password_hash, verify_password
from app.models.token import RefreshToken
from app.models.user import User
from app.repositories.otp_repository import OtpRepository
from app.repositories.token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.services.google_oauth_service import GoogleOAuthService
from app.services.otp_service import OtpService
from app.services.token_service import TokenService
from app.utils.hashing import sha256_hexdigest

logger = structlog.get_logger(__name__)


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        refresh_repo: RefreshTokenRepository,
        otp_repo: OtpRepository,
        token_service: TokenService,
        otp_service: OtpService,
        google_oauth_service: GoogleOAuthService,
    ):
        self.user_repo = user_repo
        self.refresh_repo = refresh_repo
        self.otp_repo = otp_repo
        self.token_service = token_service
        self.otp_service = otp_service
        self.google_oauth_service = google_oauth_service

    def _build_token_response(self, user: User) -> dict:
        subject = str(user.id)
        token_extra = {"email": user.email, "role": "user"}
        access_token = self.token_service.create_access_token(subject, token_extra)
        refresh_token = self.token_service.create_refresh_token(subject, token_extra)
        refresh_payload = self.token_service.decode(refresh_token)
        refresh_row = RefreshToken(
            user_id=user.id,
            token_jti=refresh_payload["jti"],
            token_hash=sha256_hexdigest(refresh_token),
            expires_at=datetime.fromtimestamp(refresh_payload["exp"], tz=timezone.utc),
            token_type=TokenTypeEnum.REFRESH,
        )
        self.refresh_repo.create(refresh_row)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
        }

    def register(self, payload) -> dict:
        existing = self.user_repo.get_by_email(payload.email)
        if existing and existing.is_verified:
            raise UnauthorizedException("User already exists")

        user = existing or User(
            name=payload.name,
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            provider=ProviderEnum.LOCAL,
            is_verified=False,
        )
        if existing:
            user.name = payload.name
            user.password_hash = get_password_hash(payload.password)
            user.provider = ProviderEnum.LOCAL
            user.is_verified = False

        saved_user = self.user_repo.create(user) if not existing else self.user_repo.save(user)
        self.otp_service.create_and_send(saved_user.id, saved_user.email, OtpPurposeEnum.REGISTER)
        return {"detail": "Registration successful. OTP sent to email."}

    def verify_otp(self, payload) -> dict:
        user = self.user_repo.get_by_email(payload.email)
        if not user:
            raise NotFoundException("User not found")
        self.otp_service.verify(user.id, OtpPurposeEnum.REGISTER, payload.otp)
        user.is_verified = True
        self.user_repo.save(user)
        return self._build_token_response(user)

    def login(self, payload) -> dict:
        user = self.user_repo.get_by_email(payload.email)
        if not user:
            raise UnauthorizedException("Invalid credentials")
        if not user.is_verified:
            raise UnauthorizedException("Email verification is required")
        if user.provider == ProviderEnum.GOOGLE:
            raise UnauthorizedException("Please sign in with Google")
        if not user.password_hash or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedException("Invalid credentials")
        return self._build_token_response(user)

    def refresh(self, payload) -> dict:
        try:
            token_data = self.token_service.decode(payload.refresh_token)
        except ValueError as exc:
            raise UnauthorizedException("Invalid refresh token") from exc
        if not self.token_service.is_refresh_token_valid(token_data):
            raise UnauthorizedException("Invalid refresh token")

        refresh_row = self.refresh_repo.get_by_jti(token_data["jti"])
        if not refresh_row or refresh_row.revoked or refresh_row.token_hash != sha256_hexdigest(payload.refresh_token):
            raise UnauthorizedException("Refresh token revoked")

        user = self.user_repo.get(UUID(token_data["sub"]))
        if not user:
            raise UnauthorizedException("User not found")

        refresh_row.revoked = True
        self.refresh_repo.save(refresh_row)
        return self._build_token_response(user)

    def logout(self, payload) -> dict:
        try:
            token_data = self.token_service.decode(payload.refresh_token)
        except ValueError as exc:
            raise UnauthorizedException("Invalid refresh token") from exc
        refresh_row = self.refresh_repo.get_by_jti(token_data["jti"])
        if refresh_row:
            refresh_row.revoked = True
            self.refresh_repo.save(refresh_row)
        return {"detail": "Logged out successfully"}

    def forgot_password(self, payload) -> dict:
        user = self.user_repo.get_by_email(payload.email)
        if user:
            self.otp_service.create_and_send(user.id, user.email, OtpPurposeEnum.RESET_PASSWORD)
        return {"detail": "If the account exists, a password reset OTP has been sent."}

    def reset_password(self, payload) -> dict:
        user = self.user_repo.get_by_email(payload.email)
        if not user:
            raise NotFoundException("User not found")
        self.otp_service.verify(user.id, OtpPurposeEnum.RESET_PASSWORD, payload.otp)
        user.password_hash = get_password_hash(payload.new_password)
        self.user_repo.save(user)
        for token in self.refresh_repo.list_by_user(user.id):
            token.revoked = True
            self.refresh_repo.save(token)
        return {"detail": "Password reset successfully"}

    def google_login_url(self) -> dict:
        return {"auth_url": self.google_oauth_service.build_login_url()}

    async def google_callback(self, code: str) -> dict:
        try:
            profile = await self.google_oauth_service.exchange_code_for_user(code)
        except Exception as exc:
            logger.exception("auth.google_callback_failed", error=str(exc))
            raise UnauthorizedException("Google sign-in could not be completed") from exc
        email = profile.get("email")
        name = profile.get("name") or profile.get("given_name") or "Google User"
        if not email:
            raise UnauthorizedException("Google profile did not provide an email")

        user = self.user_repo.get_by_email(email)
        if not user:
            user = User(
                name=name,
                email=email,
                password_hash=None,
                provider=ProviderEnum.GOOGLE,
                is_verified=True,
            )
            user = self.user_repo.create(user)
        else:
            user.name = name
            user.is_verified = True
            if not user.provider:
                user.provider = ProviderEnum.GOOGLE
            self.user_repo.save(user)
        return self._build_token_response(user)
