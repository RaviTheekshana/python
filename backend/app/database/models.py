from app.database.session import Base
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, UniqueConstraint, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import json

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), index=True)
    password = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False, default="user")
    created_at = Column(DateTime, server_default=func.now())


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String(255), nullable=False)
    image_hash = Column(String(128), unique=True, index=True, nullable=False)

    yolo_label = Column(String(120), nullable=False)
    yolo_conf = Column(Float, nullable=False)
    # store bbox as JSON string: [x1,y1,x2,y2]
    bbox_json = Column(String(255), nullable=False)

    eff_label = Column(String(120), nullable=True)
    eff_conf = Column(Float, nullable=True)
    risk_level = Column(String(30), nullable=True)

    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now())

    verification = relationship("ScanVerification", back_populates="scan", uselist=False, cascade="all, delete-orphan")

    def bbox(self):
        try:
            return json.loads(self.bbox_json)
        except Exception:
            return None


class ScanVerification(Base):
    __tablename__ = "scan_verifications"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), unique=True, nullable=False, index=True)

    # label correctness + correction
    is_label_correct = Column(Boolean, nullable=False, default=True)
    corrected_label = Column(String(120), nullable=True)

    # counterfeit status chosen by admin
    # "genuine" | "fake" | "low_fake" | "unknown"
    authenticity = Column(String(30), nullable=False, default="unknown")

    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    verified_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    scan = relationship("Scan", back_populates="verification")

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
    
class ScanRecord(Base):
    __tablename__ = "scan_records"

    id = Column(Integer, primary_key=True, index=True)

    user_email = Column(String(255), nullable=True, index=True)

    # model outputs
    yolo_label = Column(String(120), nullable=False, index=True)
    yolo_conf = Column(Float, nullable=False)

    eff_label = Column(String(120), nullable=True)
    eff_conf = Column(Float, nullable=True)

    risk_level = Column(String(20), nullable=True)
    risk_score = Column(Float, nullable=True)

    # similarity
    phash = Column(String(16), nullable=False, index=True)  # 64-bit hex

    # human review (admin)
    verified_status = Column(String(20), nullable=True)  # "REAL" | "FAKE" | "SUSPECT" | "UNKNOWN"
    verified_by = Column(String(255), nullable=True)
    verified_note = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    verified_at = Column(DateTime, nullable=True)