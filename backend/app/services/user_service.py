from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.database import models
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import ADMIN_EMAILS

def register_user(db: Session, email: str, password: str, name: str, phone: str):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    password = get_password_hash(password)
    role = "admin" if email.strip().lower() in ADMIN_EMAILS else "user"
    user = models.User(email=email, password=password, name=name, phone=phone, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def login_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user": {"id": user.id, "email": user.email, "name": user.name},
    }