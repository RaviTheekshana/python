from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List


class ScanResponse(BaseModel):
    id: int
    image_url: str
    image_hash: str

    yolo_label: str
    yolo_conf: float
    bbox: List[float]

    eff_label: Optional[str] = None
    eff_conf: Optional[float] = None
    risk_level: Optional[str] = None

    verification_status: str  # pending | verified
    authenticity: Optional[str] = None  # genuine | fake | low_fake | unknown
    corrected_label: Optional[str] = None
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerifyScanRequest(BaseModel):
    is_label_correct: bool = True
    corrected_label: Optional[str] = None
    authenticity: str = "unknown"  # genuine|fake|low_fake|unknown
