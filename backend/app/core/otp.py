import random
from datetime import datetime, timedelta, timezone


def generate_otp(length: int = 6) -> str:
    lower = 10 ** (length - 1)
    upper = (10**length) - 1
    return str(random.randint(lower, upper))


def otp_expires_at(minutes: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)
