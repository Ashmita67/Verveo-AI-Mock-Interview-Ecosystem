import smtplib
from email.message import EmailMessage

import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


class EmailSender:
    def send(self, to_email: str, subject: str, body: str) -> None:
        raise NotImplementedError


class ConsoleEmailSender(EmailSender):
    def send(self, to_email: str, subject: str, body: str) -> None:
        logger.info("email.send", to=to_email, subject=subject, body=body)


class SmtpEmailSender(EmailSender):
    print("HOST:", settings.smtp_host)
    print("PORT:", settings.smtp_port)
    print("USER:", settings.smtp_user)
    print("FROM:", settings.smtp_from_email)
    def send(self, to_email: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = settings.smtp_from_email or settings.smtp_user or "no-reply@verveo.ai"
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
            smtp.starttls()
            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)


def get_email_sender() -> EmailSender:
    if settings.smtp_host and settings.smtp_user and settings.smtp_password:
        return SmtpEmailSender()
    return ConsoleEmailSender()
