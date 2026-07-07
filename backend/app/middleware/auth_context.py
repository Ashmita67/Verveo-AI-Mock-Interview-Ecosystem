from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from types import SimpleNamespace

from app.core.enums import TokenTypeEnum
from app.core.security import decode_token


class AuthContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.user = None
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1]
            try:
                payload = decode_token(token)
                if payload.get("type") == TokenTypeEnum.ACCESS.value:
                    request.state.token_payload = payload
                    request.state.user = SimpleNamespace(
                        id=payload.get("sub"),
                        email=payload.get("email"),
                        role=payload.get("role"),
                    )
            except Exception:
                request.state.token_payload = None
        return await call_next(request)
