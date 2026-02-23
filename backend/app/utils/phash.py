from __future__ import annotations

import numpy as np
from PIL import Image

# ---------- DCT (no scipy needed) ----------
def _dct_matrix(n: int) -> np.ndarray:
    """
    Create an orthonormal DCT-II transform matrix of size (n x n).
    """
    k = np.arange(n).reshape(-1, 1)   # (n,1)
    i = np.arange(n).reshape(1, -1)   # (1,n)

    mat = np.cos(np.pi / n * (i + 0.5) * k).astype(np.float32)
    mat[0, :] *= (1.0 / np.sqrt(n))
    mat[1:, :] *= np.sqrt(2.0 / n)
    return mat

_DCT_CACHE: dict[int, np.ndarray] = {}


def _dct2(a: np.ndarray) -> np.ndarray:
    """
    2D DCT-II using matrix multiplication: D * A * D^T (orthonormal).
    a must be square (n x n).
    """
    n = a.shape[0]
    if n not in _DCT_CACHE:
        _DCT_CACHE[n] = _dct_matrix(n)
    D = _DCT_CACHE[n]
    return D @ a @ D.T


# ---------- pHash ----------
def phash_hex(img: Image.Image, hash_size: int = 8, highfreq_factor: int = 4) -> str:
    """
    Perceptual hash (pHash) using DCT (no SciPy).
    Returns hex string with length (hash_size*hash_size/4).
    Default: 8x8 bits => 64-bit => 16 hex chars.

    Note: pHash is robust to resize/brightness and small changes,
    but rotations and very different crops can still change it.
    """
    # 32x32 for 8*4
    img_size = hash_size * highfreq_factor

    im = img.convert("L").resize((img_size, img_size), Image.Resampling.LANCZOS)
    pixels = np.asarray(im, dtype=np.float32)

    # DCT and keep top-left
    dct_vals = _dct2(pixels)
    dct_low = dct_vals[:hash_size, :hash_size]

    # flatten and exclude DC term
    dct_flat = dct_low.flatten()
    med = np.median(dct_flat[1:])

    bits = (dct_flat > med).astype(np.uint8)
    bitstring = "".join("1" if b else "0" for b in bits)

    width = (hash_size * hash_size) // 4  # hex digits
    return f"{int(bitstring, 2):0{width}x}"


def hamming_hex(a_hex: str, b_hex: str) -> int:
    a = int(a_hex, 16)
    b = int(b_hex, 16)
    return (a ^ b).bit_count()


# ---------- Rotation-robust helper ----------
def phash_hex_rotations(img: Image.Image, hash_size: int = 8, highfreq_factor: int = 4) -> tuple[str, int]:
    """
    Compute pHash for 0/90/180/270 rotations and return:
    (best_hash_hex, rotation_degrees_that_produced_it)

    Use this when matching "same image but rotated" scenarios.
    """
    candidates = [
        (phash_hex(img, hash_size, highfreq_factor), 0),
        (phash_hex(img.rotate(90, expand=True), hash_size, highfreq_factor), 90),
        (phash_hex(img.rotate(180, expand=True), hash_size, highfreq_factor), 180),
        (phash_hex(img.rotate(270, expand=True), hash_size, highfreq_factor), 270),
    ]
    # Return the "smallest" hash lexicographically is not meaningful,
    # but we need a stable pick when storing. Use the 0-degree hash for storing.
    # This function is more useful when MATCHING (compute all and compare).
    return candidates[0][0], 0