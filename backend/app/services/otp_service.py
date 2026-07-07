from app.core.enums import OtpPurposeEnum
from app.core.otp import generate_otp, otp_expires_at
from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.models.token import OtpToken
from app.repositories.otp_repository import OtpRepository
from app.services.email_service import EmailService
from app.utils.hashing import sha256_hexdigest
from app.utils.time import is_expired


class OtpService:
    def __init__(self, otp_repo: OtpRepository, email_service: EmailService):
        self.otp_repo = otp_repo
        self.email_service = email_service

    def create_and_send(self, user_id, email: str, purpose: OtpPurposeEnum, meta: str | None = None) -> str:
        otp = generate_otp()
        otp_record = OtpToken(
            user_id=user_id,
            purpose=purpose,
            otp_hash=sha256_hexdigest(otp),
            expires_at=otp_expires_at(settings.otp_expire_minutes),
            meta=meta,
        )
        self.otp_repo.create(otp_record)
        self.email_service.send_otp(email, otp, purpose.value)
        return otp

    def verify(self, user_id, purpose: OtpPurposeEnum, otp: str) -> None:
        record = self.otp_repo.get_latest_for_user(user_id, purpose)
        if not record:
            raise UnauthorizedException("OTP not found or already used")
        if is_expired(record.expires_at):
            raise UnauthorizedException("OTP expired")
        if record.used:
            raise UnauthorizedException("OTP already used")
        if record.otp_hash != sha256_hexdigest(otp):
            raise UnauthorizedException("Invalid OTP")
        record.used = True
        self.otp_repo.save(record)
