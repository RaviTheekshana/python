import hashlib
import json
import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database import models
from app.core.security import get_current_user

from app.services.predict_service import detect_best_from_bytes
from app.services.effnet_service import classify_pil
from app.services.risk_service import compute_risk

router = APIRouter(tags=["scan"])

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads" / "scans"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


@router.post("/scan")
async def scan_part(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Scan endpoint for the mobile app.

    Fast path: if the exact same image was already verified (hash match), return that.
    Otherwise run YOLO + EfficientNet, store as a pending scan.
    """
    try:
        contents = await file.read()
        img_hash = sha256_bytes(contents)

        existing = db.query(models.Scan).filter(models.Scan.image_hash == img_hash).first()
        if existing and existing.verification:
            v = existing.verification
            bbox = json.loads(existing.bbox_json)
            return {
                "success": True,
                "scan": {
                    "id": existing.id,
                    "image_url": f"/static/scans/{Path(existing.image_path).name}",
                    "image_hash": existing.image_hash,
                    "yolo_label": existing.yolo_label,
                    "yolo_conf": existing.yolo_conf,
                    "bbox": bbox,
                    "eff_label": existing.eff_label,
                    "eff_conf": existing.eff_conf,
                    "risk": {"level": existing.risk_level},
                    "verification_status": "verified",
                    "authenticity": v.authenticity,
                    "corrected_label": v.corrected_label,
                    "verified_by": v.verified_by_user_id,
                    "verified_at": v.verified_at,
                    "created_at": existing.created_at,
                },
            }

        # Save image to disk (use hash as filename to avoid duplicates)
        ext = os.path.splitext(file.filename or "image.jpg")[1].lower()
        if ext not in (".jpg", ".jpeg", ".png", ".webp"):
            ext = ".jpg"
        out_name = f"{img_hash}{ext}"
        out_path = UPLOAD_DIR / out_name
        if not out_path.exists():
            out_path.write_bytes(contents)

        # Run detection + ROI crop (inside detect_best_from_bytes returns PIL image too)
        det, full_img = detect_best_from_bytes(contents)
        if not det.get("success"):
            # still store failed scan? for now just return
            return det

        # ROI crop using YOLO bbox
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
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
            eff_label=eff.get("label"),
            eff_conf=eff.get("confidence"),
        )

        bbox_json = json.dumps(det["bbox"])

        # If same hash exists but not verified yet, just return it
        if existing:
            return {
                "success": True,
                "scan": {
                    "id": existing.id,
                    "image_url": f"/static/scans/{Path(existing.image_path).name}",
                    "image_hash": existing.image_hash,
                    "yolo_label": existing.yolo_label,
                    "yolo_conf": existing.yolo_conf,
                    "bbox": json.loads(existing.bbox_json),
                    "eff_label": existing.eff_label,
                    "eff_conf": existing.eff_conf,
                    "risk": {"level": existing.risk_level},
                    "verification_status": "pending",
                    "authenticity": None,
                    "corrected_label": None,
                    "verified_by": None,
                    "verified_at": None,
                    "created_at": existing.created_at,
                },
            }

        scan = models.Scan(
            image_path=str(out_path),
            image_hash=img_hash,
            yolo_label=det["part"],
            yolo_conf=float(det["confidence"]),
            bbox_json=bbox_json,
            eff_label=eff.get("label"),
            eff_conf=float(eff.get("confidence")) if eff.get("confidence") is not None else None,
            risk_level=risk.get("level") if isinstance(risk, dict) else None,
            created_by_user_id=getattr(current_user, "id", None),
        )

        db.add(scan)
        db.commit()
        db.refresh(scan)

        return {
            "success": True,
            "scan": {
                "id": scan.id,
                "image_url": f"/static/scans/{out_name}",
                "image_hash": scan.image_hash,
                "yolo_label": scan.yolo_label,
                "yolo_conf": scan.yolo_conf,
                "bbox": det["bbox"],
                "eff_label": scan.eff_label,
                "eff_conf": scan.eff_conf,
                "effnet": eff,
                "risk": risk,
                "verification_status": "pending",
                "authenticity": None,
                "corrected_label": None,
                "verified_by": None,
                "verified_at": None,
                "created_at": scan.created_at,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
