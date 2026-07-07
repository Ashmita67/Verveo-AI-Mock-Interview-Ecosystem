from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth.router import router as auth_router
from app.api.dashboard.router import router as dashboard_router
from app.api.health.router import router as health_router
from app.api.interviews.router import router as interview_router
from app.api.analytics.router import router as analytics_router
from app.api.reports.router import router as report_router
from app.api.resumes.router import router as resume_router
from app.api.users.router import router as users_router
from app.core.config import settings
from app.core.exceptions import (
    AppException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
    app_exception_handler,
    sqlalchemy_exception_handler,
    validation_exception_handler,
)
from app.core.logging import configure_logging
from app.middleware.auth_context import AuthContextMiddleware
from app.middleware.request_validation import RequestValidationMiddleware
from app.middleware.role_based import RoleBasedMiddleware
import app.db.base  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.uploads_resumes_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.uploads_audio_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.uploads_video_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.chroma_dir).mkdir(parents=True, exist_ok=True)
    yield


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title=settings.app_name, debug=settings.app_debug, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestValidationMiddleware)
    app.add_middleware(AuthContextMiddleware)
    app.add_middleware(RoleBasedMiddleware)

    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(UnauthorizedException, app_exception_handler)
    app.add_exception_handler(ForbiddenException, app_exception_handler)
    app.add_exception_handler(NotFoundException, app_exception_handler)
    from fastapi.exceptions import RequestValidationError
    from sqlalchemy.exc import SQLAlchemyError

    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)

    api_prefix = settings.api_v1_prefix
    app.include_router(health_router, prefix=api_prefix)
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(users_router, prefix=api_prefix)
    app.include_router(dashboard_router, prefix=api_prefix)
    app.include_router(resume_router, prefix=api_prefix)
    app.include_router(interview_router, prefix=api_prefix)
    app.include_router(report_router, prefix=api_prefix)
    app.include_router(analytics_router, prefix=api_prefix)

    @app.get("/")
    def root():
        return {"service": settings.app_name, "status": "running"}

    return app


app = create_app()
