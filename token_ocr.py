import os
import re
import uuid

import cv2
import easyocr
import numpy as np
from PIL import Image


_OCR_READER = None
_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".webp"}


def allowed_image(filename):
    _, ext = os.path.splitext((filename or "").lower())
    return ext in _IMAGE_EXTENSIONS


def save_temp_upload(file_storage, upload_dir):
    os.makedirs(upload_dir, exist_ok=True)
    _, ext = os.path.splitext((file_storage.filename or "").lower())
    ext = ext or ".png"
    temp_name = f"ocr_{uuid.uuid4().hex}{ext}"
    temp_path = os.path.join(upload_dir, temp_name)
    file_storage.save(temp_path)
    return temp_path


def cleanup_file(path):
    if path and os.path.exists(path):
        os.remove(path)


def _get_reader():
    global _OCR_READER
    if _OCR_READER is None:
        try:
            _OCR_READER = easyocr.Reader(["en"], gpu=False)
        except Exception as error:
            raise RuntimeError(f"OCR engine initialization failed: {error}")
    return _OCR_READER


def _preprocess_image(image_path):
    image = Image.open(image_path).convert("RGB")
    image_np = np.array(image)
    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    _, threshold = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return image_np, threshold


def _extract_candidates(results):
    candidates = []
    for index, result in enumerate(results):
        bbox, text, confidence = result
        matches = re.findall(r"\d+", text or "")
        if not matches:
            continue

        xs = [point[0] for point in bbox]
        ys = [point[1] for point in bbox]
        area = max(xs) - min(xs)
        area *= max(ys) - min(ys)

        for match in matches:
            candidates.append({
                "value": int(match),
                "text": text,
                "confidence": float(confidence or 0),
                "area": float(area),
                "index": index,
                "length": len(match),
            })
    return candidates


def extract_token_number(image_path):
    original, processed = _preprocess_image(image_path)
    reader = _get_reader()

    results = reader.readtext(original, detail=1)
    processed_results = reader.readtext(processed, detail=1)
    candidates = _extract_candidates(results + processed_results)

    if not candidates:
        raise ValueError("No numeric token detected in the image.")

    # Prefer prominent text first, then more confident OCR, then the last visible number.
    ranked = sorted(
        candidates,
        key=lambda item: (
            item["area"],
            item["confidence"],
            item["length"],
            item["index"],
        ),
    )
    best_candidate = ranked[-1]
    return best_candidate["value"], {
        "rawText": " ".join([item[1] for item in results]),
        "matchedText": best_candidate["text"],
        "confidence": round(best_candidate["confidence"], 4),
        "candidates": [item["value"] for item in candidates],
    }
