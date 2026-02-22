from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import User
from app.schemas.user import UserOut, UpdateProfileIn, ChangePasswordIn

# these imports must match your existing auth setup
from app.core.security import get_current_user, verify_password, get_password_hash

router = APIRouter(tags=["User"])

@router.get("/user/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    # email is read-only by design
    return current_user


@router.put("/user/profile", response_model=UserOut)
def update_profile(
    payload: UpdateProfileIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only allow changing name + phone
    if payload.name is not None:
        current_user.name = payload.name.strip() if payload.name else None

    if payload.phone is not None:
        current_user.phone = payload.phone.strip() if payload.phone else None

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/user/password")
def change_password(
    payload: ChangePasswordIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify current password
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Prevent setting same password
    if verify_password(payload.new_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"success": True, "message": "Password updated successfully"}