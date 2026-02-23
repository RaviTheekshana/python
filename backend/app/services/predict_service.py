import io
from PIL import Image
from ultralytics import YOLO
import traceback

MODEL_PATH = "app/models/best.pt"
MODEL = YOLO(MODEL_PATH)  # load once at import


def _to_list(x):
    try:
        return x.cpu().numpy().tolist()
    except Exception:
        pass
    try:
        return x.numpy().tolist()
    except Exception:
        pass
    try:
        return x.tolist()
    except Exception:
        pass
    try:
        return list(x)
    except Exception:
        return [x]


def detect_best(img: Image.Image):
    """
    Returns:
      {
        success: bool,
        part: str,
        confidence: float,
        bbox: [x1,y1,x2,y2]
      }
    """
    try:
        results = MODEL(img)
        if not results or len(results) == 0:
            return {"success": False, "message": "No results object"}

        r = results[0]
        boxes = getattr(r, "boxes", None)
        if boxes is None or len(boxes) == 0:
            return {"success": False, "message": "No part detected"}

        cls_list = _to_list(getattr(boxes, "cls", None))
        conf_list = _to_list(getattr(boxes, "conf", None))
        xyxy_list = _to_list(getattr(boxes, "xyxy", None))

        # pick best by confidence
        best_i = int(max(range(len(conf_list)), key=lambda i: conf_list[i]))
        cls_id = int(cls_list[best_i])
        conf = float(conf_list[best_i])

        # bbox = [x1,y1,x2,y2]
        bbox = xyxy_list[best_i]
        bbox = [float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])]

        names = getattr(MODEL, "names", None)
        if isinstance(names, dict):
            label = names.get(cls_id, str(cls_id))
        elif isinstance(names, (list, tuple)):
            label = names[cls_id] if 0 <= cls_id < len(names) else str(cls_id)
        else:
            label = str(cls_id)

        return {
            "success": True,
            "part": label,
            "confidence": round(conf, 4),
            "bbox": bbox,
        }

    except Exception as e:
        return {
            "success": False,
            "message": "YOLO detection error",
            "error": str(e),
            "trace": traceback.format_exc(),
        }


def predict_from_bytes(image_bytes: bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    det = detect_best(img)
    # keep old /predict response shape
    if det.get("success"):
        return {"success": True, "part": det["part"], "confidence": det["confidence"]}
    return det


def detect_best_from_bytes(image_bytes: bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return detect_best(img), img