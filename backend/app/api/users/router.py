from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.dependencies.services import get_user_service
from app.schemas.user import UserMeResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserMeResponse)
def get_me(user=Depends(get_current_user), user_service: UserService = Depends(get_user_service)):
    return user_service.get_me(user)


@router.put("/me", response_model=UserMeResponse)
def update_me(
    payload: UserUpdate,
    user=Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
):
    return user_service.update_me(user, payload)
