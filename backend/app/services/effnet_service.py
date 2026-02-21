# backend/app/services/effnet_service.py
import json
import numpy as np
from PIL import Image

import tensorflow as tf

try:
    from keras.saving import register_keras_serializable
except Exception:
    from keras.utils import register_keras_serializable

from keras.applications.efficientnet import preprocess_input


MODEL_PATH = "app/models/efficientnet_finetuned.keras"  # your finetuned model
CLASSES_PATH = "app/models/effnet_classes.json"


@register_keras_serializable(package="partpal")
class PatchedDepthwiseConv2D(tf.keras.layers.DepthwiseConv2D):
    """
    This exists ONLY to load models that were saved with this layer name.
    It ignores the unsupported 'groups' argument that appeared in some configs.
    """
    def __init__(self, *args, **kwargs):
        kwargs.pop("groups", None)
        super().__init__(*args, **kwargs)


# Load class names (must match training order)
with open(CLASSES_PATH, "r", encoding="utf-8") as f:
    CLASS_NAMES = json.load(f)

# Load the model with custom_objects
EFF_MODEL = tf.keras.models.load_model(
    MODEL_PATH,
    custom_objects={"PatchedDepthwiseConv2D": PatchedDepthwiseConv2D},
    compile=False
) 

def classify_pil(img: Image.Image):
    """
    Input: PIL image
    Output:
      {
        label: str,
        confidence: float,
        top5: [{label, confidence}, ...]
      }
    """
    img = img.convert("RGB").resize((224, 224))
    arr = np.array(img).astype(np.float32)
    arr = np.expand_dims(arr, axis=0)          # (1,224,224,3)
    arr = preprocess_input(arr)                # EfficientNet preprocessing

    probs = EFF_MODEL.predict(arr, verbose=0)[0]  # (num_classes,)
    top_idx = int(np.argmax(probs))
    top_conf = float(probs[top_idx])
    top_label = CLASS_NAMES[top_idx]

    top5_idx = np.argsort(probs)[::-1][:5]
    top5 = [{"label": CLASS_NAMES[int(i)], "confidence": float(probs[int(i)])} for i in top5_idx]

    return {
        "label": top_label,
        "confidence": round(top_conf, 4),
        "top5": top5,
    }