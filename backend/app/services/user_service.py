from app.core.exceptions import UnauthorizedException
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def get_me(self, user):
        return user

    def update_me(self, user, payload):
        if payload.name is not None:
            user.name = payload.name
        if payload.email is not None:
            existing = self.user_repo.get_by_email(payload.email)
            if existing and existing.id != user.id:
                raise UnauthorizedException("Email already in use")
            user.email = payload.email
        return self.user_repo.save(user)
