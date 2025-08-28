from pydantic import BaseModel, EmailStr
from datetime import datetime

# Base schema shared across multiple uses
class UserBase(BaseModel):
    email: EmailStr
    name: str | None = None   # optional name
    phone: str | None = None  # optional phone number


# For creating a new user (registration)
class UserCreate(UserBase):
    password: str


# For login request
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# What we send back in responses
class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
