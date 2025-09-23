# backend/app/services/predict_service.py
import io
from PIL import Image
from ultralytics import YOLO
import traceback

MODEL_PATH = "app/models/best.pt"
MODEL = YOLO(MODEL_PATH)  # load once at import

def _to_pylist(x):
    """Convert a torch/numpy/list scalar/array/tensor to plain python list."""
    try:
        # torch tensor with .cpu()
        return x.cpu().numpy().tolist()
    except Exception:
        pass
    try:
        # numpy array
        return x.numpy().tolist()
    except Exception:
        pass
    try:
        # has .tolist()
        return x.tolist()
    except Exception:
        pass
    try:
        # iterable fallback
        return list(x)
    except Exception:
        return [x]

def parse_results(results):
    """
    Returns dict: { success: bool, part, confidence } or message
    Works with Ultralytics Results object.
    """
    try:
        if not results or len(results) == 0:
            return {"success": False, "message": "No results object"}

        r = results[0]  # first image
        # r.boxes may be None or empty
        boxes = getattr(r, "boxes", None)
        if boxes is None or len(boxes) == 0:
            return {"success": False, "message": "No part detected"}

        # try to extract class ids and confidences robustly
        cls_raw = getattr(boxes, "cls", None) or getattr(boxes, "classes", None)
        conf_raw = getattr(boxes, "conf", None) or getattr(boxes, "confs", None) or getattr(boxes, "confidence", None)

        cls_list = _to_pylist(cls_raw) if cls_raw is not None else None
        conf_list = _to_pylist(conf_raw) if conf_raw is not None else None

        # ensure we have at least one element
        if cls_list and len(cls_list) > 0:
            cls_id = int(cls_list[0])
        else:
            # fallback: some versions put classes in r.boxes.data or r.boxes.cpu().numpy()
            # try to read from r.boxes.data if present
            try:
                data = getattr(boxes, "data", None)
                data_list = _to_pylist(data)
                # usually data columns: x1,y1,x2,y2,conf,class
                cls_id = int(data_list[0][-1])
                conf = float(data_list[0][4])
                label = MODEL.names.get(cls_id, str(cls_id)) if isinstance(MODEL.names, dict) else MODEL.names[cls_id]
                return {"success": True, "part": label, "confidence": round(conf, 4)}
            except Exception:
                return {"success": False, "message": "Could not parse detection results"}

        # confidence
        if conf_list and len(conf_list) > 0:
            conf = float(conf_list[0])
        else:
            conf = None

        # label: MODEL.names can be dict or list
        names = getattr(MODEL, "names", None)
        if isinstance(names, dict):
            label = names.get(cls_id, str(cls_id))
        elif isinstance(names, (list, tuple)):
            label = names[cls_id] if 0 <= cls_id < len(names) else str(cls_id)
        else:
            label = str(cls_id)

        return {"success": True, "part": label, "confidence": round(conf, 4) if conf is not None else None}
    except Exception as e:
        # return a helpful error
        tb = traceback.format_exc()
        return {"success": False, "message": "Error parsing results", "error": str(e), "trace": tb}

def predict_from_bytes(image_bytes: bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = MODEL(img)  # run inference
    return parse_results(results)
