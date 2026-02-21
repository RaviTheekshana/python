# backend/app/services/risk_service.py

def compute_risk(yolo_label, yolo_conf, eff_label, eff_conf):
    """
    Returns:
      { level, score, reason }
    """
    yolo_conf = float(yolo_conf or 0.0)
    eff_conf = float(eff_conf or 0.0)

    agree = (yolo_label == eff_label)

    # score: 0 = low risk, 1 = high risk
    if agree and yolo_conf >= 0.7 and eff_conf >= 0.7:
        return {
            "level": "LOW",
            "score": 0.10,
            "reason": "YOLO and EfficientNet agree with high confidence.",
        }

    if agree and (yolo_conf >= 0.55 or eff_conf >= 0.55):
        return {
            "level": "MEDIUM",
            "score": 0.35,
            "reason": "Models agree but confidence is moderate. Consider clearer image.",
        }

    if (not agree) and eff_conf >= 0.7 and yolo_conf >= 0.5:
        return {
            "level": "HIGH",
            "score": 0.85,
            "reason": "Models disagree strongly. Potential mismatch / counterfeit-risk indicator.",
        }

    if (not agree) and (eff_conf >= 0.6 or yolo_conf >= 0.6):
        return {
            "level": "MEDIUM",
            "score": 0.60,
            "reason": "Models disagree. Image quality or wrong item may be causing mismatch.",
        }

    return {
        "level": "UNSURE",
        "score": 0.50,
        "reason": "Low confidence. Please retake photo with better lighting and closer view.",
    }