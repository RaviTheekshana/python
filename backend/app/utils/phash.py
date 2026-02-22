# backend/app/utils/phash.py
from __future__ import annotations
import numpy as np
from PIL import Image
from scipy.fftpack import dct

def _dct2(a: np.ndarray) -> np.ndarray:
    return dct(dct(a, axis=0, norm="ortho"), axis=1, norm="ortho")

def phash_hex(img: Image.Image, hash_size: int = 8, highfreq_factor: int = 4) -> str:
    """
    Perceptual hash (pHash) using DCT.
    Returns 16-hex chars (64 bits) by default.
    Robust to small resize/brightness changes and mild rotations (not perfect).
    """
    img_size = hash_size * highfreq_factor  # 32 when hash_size=8
    im = img.convert("L").resize((img_size, img_size), Image.Resampling.LANCZOS)
    pixels = np.asarray(im, dtype=np.float32)

    # DCT and keep top-left block
    dct_vals = _dct2(pixels)
    dct_low = dct_vals[:hash_size, :hash_size]

    # Exclude DC term (0,0) from median
    dct_flat = dct_low.flatten()
    med = np.median(dct_flat[1:])

    bits = (dct_flat > med).astype(np.uint8)  # 64 bits
    bitstring = "".join("1" if b else "0" for b in bits)

    # Convert to hex
    return f"{int(bitstring, 2):0{hash_size*hash_size//4}x}"  # 16 hex chars

def hamming_hex(a_hex: str, b_hex: str) -> int:
    a = int(a_hex, 16)
    b = int(b_hex, 16)
    return (a ^ b).bit_count()