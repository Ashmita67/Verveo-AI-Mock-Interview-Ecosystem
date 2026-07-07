from urllib.parse import urlencode, quote

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
import structlog

from app.core.config import settings
from app.dependencies.services import get_auth_service
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleLoginResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    VerifyOtpRequest,
)
from app.schemas.common import MessageResponse, TokenPairResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
logger = structlog.get_logger(__name__)


@router.post("/register", response_model=MessageResponse)
def register(payload: RegisterRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.register(payload)


@router.post("/verify-otp", response_model=TokenPairResponse)
def verify_otp(payload: VerifyOtpRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.verify_otp(payload)


@router.post("/login", response_model=TokenPairResponse)
def login(payload: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.login(payload)


@router.post("/refresh", response_model=TokenPairResponse)
def refresh(payload: RefreshRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.refresh(payload)


@router.post("/logout", response_model=MessageResponse)
def logout(payload: LogoutRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.logout(payload)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.forgot_password(payload)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.reset_password(payload)


@router.get("/google/login", response_model=GoogleLoginResponse)
def google_login(auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.google_login_url()


@router.get("/google/callback")
async def google_callback(
    code: str | None = Query(default=None),
    auth_service: AuthService = Depends(get_auth_service),
):
    if not code:
        error_url = f"{settings.frontend_url}/login?error={quote('Google sign-in failed. Missing authorization code.')}"
        return RedirectResponse(url=error_url, status_code=303)

    try:
        session = await auth_service.google_callback(code)
    except Exception:
        error_url = f"{settings.frontend_url}/login?error={quote('Google sign-in failed. Please try again.')}"
        logger.info("auth.google_callback_redirect", redirect_url=error_url, has_session=False)
        return RedirectResponse(url=error_url, status_code=303)

    redirect_url = f"{settings.frontend_url}/auth/google/callback?{urlencode(session)}"
    logger.info(
        "auth.google_callback_redirect",
        redirect_url=redirect_url,
        has_session=True,
        session_keys=sorted(session.keys()),
    )
    return RedirectResponse(url=redirect_url, status_code=303)
