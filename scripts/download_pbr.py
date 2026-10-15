#!/usr/bin/env python3
"""Import ambientCG 1K CC0 material sets as validated, normalized JPEGs."""
from pathlib import Path
from PIL import Image, UnidentifiedImageError
import io
import re
import sys
import urllib.request
import zipfile

OUT = Path("public/assets/textures")
CHANNELS = {"Color": "color", "NormalGL": "normal", "Roughness": "roughness"}

def fetch(asset_id, prefix):
    if not re.fullmatch(r"[A-Za-z]+[0-9]{3,5}", asset_id):
        raise ValueError("Invalid ambientCG asset ID")
    url = f"https://ambientcg.com/get?file={asset_id}_1K-JPG.zip"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 CorsaAllaGuerra3D/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        payload = response.read(35 * 1024 * 1024 + 1)
    if len(payload) > 35 * 1024 * 1024:
        raise ValueError("Texture archive exceeds 35 MB")
    if not zipfile.is_zipfile(io.BytesIO(payload)):
        raise ValueError(f"ambientCG returned non-ZIP response for {asset_id}")
    images = {}
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        names = archive.namelist()
        for channel, suffix in CHANNELS.items():
            candidates = [n for n in names
                          if n.lower().endswith(tuple(f"_{channel.lower()}.{ext}" for ext in ("jpg", "jpeg", "png", "webp")))
                          and not n.startswith("__MACOSX/")]
            if not candidates:
                raise ValueError(f"Missing {channel} in {asset_id}; archive entries: {names[:30]}")
            candidates.sort(key=lambda n: archive.getinfo(n).file_size, reverse=True)
            raw = archive.read(candidates[0])
            try:
                with Image.open(io.BytesIO(raw)) as source:
                    source.load()
                    if source.width < 256 or source.height < 256:
                        raise ValueError(f"Image too small: {candidates[0]} {source.size}")
                    converted = source.convert("RGB")
                    buffer = io.BytesIO()
                    converted.save(buffer, format="JPEG", quality=88, optimize=True)
                    images[suffix] = buffer.getvalue()
                    print(f"{asset_id}: {channel} {source.format} {source.size} -> JPEG {len(images[suffix])} bytes")
            except (UnidentifiedImageError, OSError) as exc:
                raise ValueError(f"Unreadable image {candidates[0]} ({len(raw)} bytes): {exc}") from exc
    OUT.mkdir(parents=True, exist_ok=True)
    for suffix, data in images.items():
        path = OUT / f"{prefix}_{suffix}.jpg"
        path.write_bytes(data)
        print(f"Saved {path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: download_pbr.py ROAD_ASSET_ID FOREST_ASSET_ID")
    fetch(sys.argv[1], "road")
    fetch(sys.argv[2], "forest")
