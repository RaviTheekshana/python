from app.database.session import Base
from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), index=True)
    password = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(80), nullable=True)
    district = Column(String(80), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

    inventory = relationship("VendorInventory", back_populates="vendor", cascade="all, delete-orphan")


class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, index=True)
    part_name = Column(String(120), unique=True, nullable=False, index=True)

    inventory = relationship("VendorInventory", back_populates="part", cascade="all, delete-orphan")


class VendorInventory(Base):
    __tablename__ = "vendor_inventory"
    __table_args__ = (
        UniqueConstraint("vendor_id", "part_id", name="uniq_vendor_part"),
    )

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=False, index=True)

    price_lkr = Column(Integer, nullable=False)
    stock_qty = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    vendor = relationship("Vendor", back_populates="inventory")
    part = relationship("Part", back_populates="inventory")