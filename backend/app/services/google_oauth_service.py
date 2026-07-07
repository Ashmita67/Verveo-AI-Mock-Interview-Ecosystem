from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.core.exceptions import UnauthorizedException


class GoogleOAuthService:
    authorize_url = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url = "https://oauth2.googleapis.com/token"
    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"

    def build_login_url(self, state: str | None = None) -> str:
        if not settings.google_client_id or not settings.google_redirect_uri:
            raise UnauthorizedException("Google OAuth is not configured")
        params = {
            "client_id": settings.google_client_id or "",
            "redirect_uri": settings.google_redirect_uri or "",
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
        if state:
            params["state"] = state
        return f"{self.authorize_url}?{urlencode(params)}"

    async def exchange_code_for_user(self, code: str) -> dict:
        if not settings.google_client_id or not settings.google_client_secret:
            raise UnauthorizedException("Google OAuth is not configured")

        async with httpx.AsyncClient(timeout=20) as client:
            token_resp = await client.post(
                self.token_url,
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_resp.raise_for_status()
            access_token = token_resp.json()["access_token"]

            user_resp = await client.get(
                self.userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_resp.raise_for_status()
            return user_resp.json()
