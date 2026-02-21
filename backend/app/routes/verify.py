# backend/app/routes/verify.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image

from app.services.predict_service import detect_best_from_bytes
from app.services.effnet_service import classify_pil
from app.services.risk_service import compute_risk

router = APIRouter(tags=["verify"])

@router.post("/verify")
async def verify(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        det, full_img = detect_best_from_bytes(contents)

        if not det.get("success"):
            return det

        # ROI crop using YOLO bbox
        x1, y1, x2, y2 = det["bbox"]
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

        # safety clamp
        w, h = full_img.size
        x1 = max(0, min(x1, w-1))
        x2 = max(0, min(x2, w))
        y1 = max(0, min(y1, h-1))
        y2 = max(0, min(y2, h))

        roi = full_img.crop((x1, y1, x2, y2))

        eff = classify_pil(roi)

        risk = compute_risk(
            yolo_label=det["part"],
            yolo_conf=det["confidence"],
            eff_label=eff["label"],
            eff_conf=eff["confidence"]
        )

        return {
            "success": True,
            "yolo": {
                "label": det["part"],
                "confidence": det["confidence"],
                "bbox": det["bbox"]
            },
            "effnet": eff,
            "risk": risk
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))