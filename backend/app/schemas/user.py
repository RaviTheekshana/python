from pydantic import BaseModel, EmailStr, ConfigDict, Field
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
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserOut(BaseModel):
    id: int
    email: str
    name: str | None = None
    phone: str | None = None

    class Config:
        from_attributes = True


class UpdateProfileIn(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=30)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=4)
    new_password: str = Field(min_length=6, max_length=128)