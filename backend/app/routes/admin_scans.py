import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database import models
from app.core.security import require_admin
from app.schemas.scan import VerifyScanRequest

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/scans")
def list_scans(status: str = "pending", db: Session = Depends(get_db), admin=Depends(require_admin)):
    """List scans for admin review.

    status=pending -> scans without verification
    status=verified -> scans with verification
    status=all -> everything
    """
    q = db.query(models.Scan)
    if status == "pending":
        q = q.outerjoin(models.ScanVerification).filter(models.ScanVerification.id == None)  # noqa: E711
    elif status == "verified":
        q = q.join(models.ScanVerification)

    scans = q.order_by(models.Scan.created_at.desc()).limit(200).all()
    out = []
    for s in scans:
        v = s.verification
        out.append({
            "id": s.id,
            "image_url": f"/static/scans/{Path(s.image_path).name}",
            "image_hash": s.image_hash,
            "yolo_label": s.yolo_label,
            "yolo_conf": s.yolo_conf,
            "bbox": json.loads(s.bbox_json),
            "risk_level": s.risk_level,
            "verification_status": "verified" if v else "pending",
            "authenticity": v.authenticity if v else None,
            "corrected_label": v.corrected_label if v else None,
            "verified_by": v.verified_by_user_id if v else None,
            "verified_at": v.verified_at if v else None,
            "created_at": s.created_at,
        })
    return {"success": True, "items": out}


@router.get("/scans/{scan_id}")
def get_scan(scan_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    s = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scan not found")
    v = s.verification
    return {
        "success": True,
        "scan": {
            "id": s.id,
            "image_url": f"/static/scans/{Path(s.image_path).name}",
            "image_hash": s.image_hash,
            "yolo_label": s.yolo_label,
            "yolo_conf": s.yolo_conf,
            "bbox": json.loads(s.bbox_json),
            "eff_label": s.eff_label,
            "eff_conf": s.eff_conf,
            "risk_level": s.risk_level,
            "verification_status": "verified" if v else "pending",
            "authenticity": v.authenticity if v else None,
            "corrected_label": v.corrected_label if v else None,
            "is_label_correct": v.is_label_correct if v else None,
            "verified_by": v.verified_by_user_id if v else None,
            "verified_at": v.verified_at if v else None,
            "created_at": s.created_at,
        }
    }


@router.post("/scans/{scan_id}/verify")
def verify_scan(
    scan_id: int,
    payload: VerifyScanRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    s = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scan not found")

    allowed = {"genuine", "fake", "low_fake", "unknown"}
    if payload.authenticity not in allowed:
        raise HTTPException(status_code=400, detail=f"authenticity must be one of {sorted(allowed)}")

    if s.verification:
        v = s.verification
        v.is_label_correct = payload.is_label_correct
        v.corrected_label = payload.corrected_label
        v.authenticity = payload.authenticity
        v.verified_by_user_id = admin.id
    else:
        v = models.ScanVerification(
            scan_id=s.id,
            is_label_correct=payload.is_label_correct,
            corrected_label=payload.corrected_label,
            authenticity=payload.authenticity,
            verified_by_user_id=admin.id,
        )
        db.add(v)

    db.commit()
    db.refresh(s)

    return {"success": True, "message": "Scan verified"}
