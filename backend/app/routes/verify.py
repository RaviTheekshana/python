from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from PIL import Image

from app.database.session import get_db
from app.database import models

from app.services.predict_service import detect_best_from_bytes
from app.services.effnet_service import classify_pil
from app.services.risk_service import compute_risk

from app.utils.phash import phash_hex, hamming_hex
from app.core.security import get_current_user_optional

router = APIRouter(tags=["verify"])

PHASH_MAX_DISTANCE = 8 

@router.post("/verify")
async def verify(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    try:
        contents = await file.read()
        det, full_img = detect_best_from_bytes(contents)

        if not det.get("success"):
            return det

        # ROI crop using YOLO bbox
        x1, y1, x2, y2 = map(int, det["bbox"])

        # clamp
        w, h = full_img.size
        x1 = max(0, min(x1, w - 1))
        x2 = max(0, min(x2, w))
        y1 = max(0, min(y1, h - 1))
        y2 = max(0, min(y2, h))

        roi = full_img.crop((x1, y1, x2, y2))

        eff = classify_pil(roi)

        risk = compute_risk(
            yolo_label=det["part"],
            yolo_conf=det["confidence"],
            eff_label=eff["label"],
            eff_conf=eff["confidence"],
        )

        ph = phash_hex(roi)

        candidates = (
            db.query(models.ScanRecord)
            .filter(models.ScanRecord.yolo_label == det["part"])
            .order_by(models.ScanRecord.id.desc())
            .limit(300)  # demo-scale
            .all()
        )

        best = None
        best_dist = 999
        for c in candidates:
            d = hamming_hex(ph, c.phash)
            if d < best_dist:
                best_dist = d
                best = c

        match_payload = {"found": False}
        if best and best_dist <= PHASH_MAX_DISTANCE:
            match_payload = {
                "found": True,
                "distance": best_dist,
                "verified_status": best.verified_status,
                "verified_by": best.verified_by,
                "verified_at": best.verified_at.isoformat() if best.verified_at else None,
                "verified_note": best.verified_note,
                "matched_scan_id": best.id,
            }

        scan = models.ScanRecord(
            user_email=getattr(current_user, "email", None) if current_user else None,
            yolo_label=det["part"],
            yolo_conf=float(det["confidence"]),
            eff_label=eff["label"],
            eff_conf=float(eff["confidence"]),
            risk_level=risk.get("level"),
            risk_score=float(risk.get("score", 0.0)) if risk.get("score") is not None else None,
            phash=ph,
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)

        return {
            "success": True,
            "scan_id": scan.id,
            "yolo": {"label": det["part"], "confidence": det["confidence"], "bbox": det["bbox"]},
            "effnet": eff,
            "risk": risk,
            "match": match_payload,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))