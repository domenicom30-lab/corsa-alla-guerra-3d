#!/usr/bin/env python3
"""Fetch CC0 ambientCG JPG PBR sets into the Vite public directory.
Usage: python scripts/download_pbr.py ROAD_ASSET_ID FOREST_ASSET_ID
Asset IDs must be verified at https://ambientcg.com before running.
"""
from pathlib import Path
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
    req = urllib.request.Request(url, headers={"User-Agent": "CorsaAllaGuerra3D/1.0"})
    with urllib.request.urlopen(req, timeout=90) as response:
        payload = response.read(35 * 1024 * 1024 + 1)
    if len(payload) > 35 * 1024 * 1024:
        raise ValueError("Texture archive exceeds 35 MB")
    OUT.mkdir(parents=True, exist_ok=True)
    # Validate the entire material before publishing any files to the APK.
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        selected = {}
        for channel, suffix in CHANNELS.items():
            candidates = [n for n in archive.namelist()
                          if n.endswith(f"_{channel}.jpg") and not n.startswith("__MACOSX/")]
            if not candidates:
                raise ValueError(f"Missing {channel} map in {asset_id}")
            data = archive.read(candidates[0])
            if len(data) < 1024 or data[:3] != b"\\xff\\xd8\\xff":
                raise ValueError(f"Invalid JPEG {channel} in {asset_id}")
            selected[suffix] = data
        for suffix, data in selected.items():
            dest = OUT / f"{prefix}_{suffix}.jpg"
            dest.write_bytes(data)
            print(dest, dest.stat().st_size, "bytes")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: download_pbr.py ROAD_ASSET_ID FOREST_ASSET_ID")
    fetch(sys.argv[1], "road")
    fetch(sys.argv[2], "forest")
