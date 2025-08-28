from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.database import models
from app.core.security import get_password_hash, verify_password, create_access_token

def register_user(db: Session, email: str, password: str, name: str, phone: str):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    password = get_password_hash(password)
    user = models.User(email=email, password=password, name=name, phone=phone)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def login_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": email})
    return {"access_token": token, "token_type": "bearer"}
