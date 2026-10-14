#!/usr/bin/env python3
"""Fetch CC0 ambientCG JPG PBR sets into the Vite public directory.
Usage: python scripts/download_pbr.py ROAD_ASSET_ID FOREST_ASSET_ID
Asset IDs must be verified at https://ambientcg.com before running.
"""
from pathlib import Path
import io
import os
import re
import sys
import urllib.request
import zipfile

OUT = Path("public/assets/textures")
CHANNELS = {"Color": "color", "NormalGL": "normal", "Roughness": "roughness"}

def fetch(asset_id, prefix):
    if not re.fullmatch(r"[A-Za-z]+[0-9]{3,5}", asset_id):
        raise ValueError("Invalid ambientCG asset ID")
    resolution = os.environ.get("PBR_RESOLUTION", "1K")
    if resolution not in {"1K", "2K"}:
        raise ValueError("PBR_RESOLUTION must be 1K or 2K")
    url = f"https://ambientcg.com/get?file={asset_id}_{resolution}-JPG.zip"
    req = urllib.request.Request(url, headers={"User-Agent": "CorsaAllaGuerra3D/1.0"})
    with urllib.request.urlopen(req, timeout=90) as response:
        payload = response.read(65 * 1024 * 1024 + 1)
    if len(payload) > 35 * 1024 * 1024:
        raise ValueError("Texture archive exceeds 65 MB")
    OUT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        for channel, suffix in CHANNELS.items():
            candidates = [n for n in archive.namelist() if n.endswith(f"_{channel}.jpg")]
            if not candidates:
                raise ValueError(f"Missing {channel} map in {asset_id}")
            dest = OUT / f"{prefix}_{suffix}.jpg"
            dest.write_bytes(archive.read(candidates[0]))
            print(dest, dest.stat().st_size, "bytes")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: download_pbr.py ROAD_ASSET_ID FOREST_ASSET_ID")
    fetch(sys.argv[1], "road")
    fetch(sys.argv[2], "forest")
