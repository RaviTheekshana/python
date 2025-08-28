from sqlalchemy import Column, Integer, String, DateTime, func
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), index=True)
    password = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
