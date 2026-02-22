from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.user import UserCreate, UserLogin
from app.services.user_service import register_user, login_user

router = APIRouter()

@router.post("/register")
def register(data: UserCreate, db: Session = Depends(get_db)):
    user = register_user(db, data.email, data.password, data.name, data.phone)
    return {
        "success": True,
        "message": "User registered successfully",
        "user": user.email
    }

@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, data.email, data.password)


class VerifyRequest(BaseModel):
    token: str

@router.get("/verify")
def verify_get(token: str, db: Session = Depends(get_db)):
    return _verify_token(token, db)

@router.post("/verify")
def verify_post(payload: VerifyRequest, db: Session = Depends(get_db)):
    return _verify_token(payload.token, db)

def _verify_token(token: str, db: Session):
    # TODO: decode token, find user, set is_verified=True, commit
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    # Example pseudo:
    # user_id = decode(token)
    # user = db.query(User).get(user_id)
    # user.is_verified = True
    # db.commit()

    return {"success": True, "message": "Email verified"}
