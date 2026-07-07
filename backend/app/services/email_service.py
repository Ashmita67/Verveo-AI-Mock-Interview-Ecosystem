import structlog

from app.utils.email import get_email_sender

logger = structlog.get_logger(__name__)


class EmailService:
    def send_otp(self, email: str, otp: str, purpose: str) -> None:
        subject = "Verveo verification code" if purpose == "register" else "Verveo password reset code"
        body = f"Your Verveo OTP is {otp}. It expires soon."
        sender = get_email_sender()
        try:
            sender.send(email, subject, body)
        except Exception as exc:
            logger.exception("auth.otp_email_delivery_failed", to=email, purpose=purpose, error=str(exc))
            from app.utils.email import ConsoleEmailSender

            ConsoleEmailSender().send(email, subject, body)
