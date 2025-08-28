from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.user import UserResponse
from app.core.security import get_current_user

router = APIRouter()

@router.get("/user", response_model=UserResponse)
def read_current_user(current_user = Depends(get_current_user)):
    return current_user
