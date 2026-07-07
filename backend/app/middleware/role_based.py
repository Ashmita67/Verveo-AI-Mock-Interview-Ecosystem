from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette import status


def require_roles(*roles: str):
    def decorator(endpoint):
        setattr(endpoint, "required_roles", set(roles))
        return endpoint

    return decorator


class RoleBasedMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        endpoint = request.scope.get("endpoint")
        required_roles = getattr(endpoint, "required_roles", None) if endpoint else None
        if not required_roles:
            return await call_next(request)

        user = getattr(request.state, "user", None)
        user_role = getattr(user, "role", None)
        if user_role not in required_roles:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "You do not have permission to access this resource."},
            )
        return await call_next(request)
