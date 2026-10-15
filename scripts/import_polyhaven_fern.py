#!/usr/bin/env python3
"""Download a verified self-contained CC0 fern GLB for offline Android builds.

Source: Poly Haven fern_02, https://polyhaven.com/a/fern_02
Uses Poly Haven's public API for authoritative download URLs.
"""
import json
from pathlib import Path
import urllib.request

ASSET = "fern_02"
DEST = Path("public/models/fern_02.glb")
MAX_BYTES = 15 * 1024 * 1024
HEADERS = {"User-Agent": "CorsaAllaGuerra3D-AssetImporter/1.0"}

def download(url, max_bytes):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=90) as response:
        data = response.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise ValueError("Asset exceeds Android 15 MB download budget")
    return data

def walk(node, path=()):
    if isinstance(node, dict):
        if isinstance(node.get("url"), str):
            yield path, node
        for key, value in node.items():
            yield from walk(value, path + (str(key),))
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from walk(value, path + (str(index),))

metadata = json.loads(download(f"https://api.polyhaven.com/files/{ASSET}", 2_000_000))
options = []
for path, item in walk(metadata):
    url = item["url"]
    if url.split("?")[0].lower().endswith(".glb"):
        score = (0 if "1k" in "/".join(path).lower() or "1k" in url.lower() else 1,
                 len(path))
        options.append((score, url))
if not options:
    raise SystemExit("Poly Haven did not expose a standalone GLB for fern_02; no fake asset will be committed.")
url = sorted(options)[0][1]
data = download(url, MAX_BYTES)
if len(data) < 100 or data[:4] != b"glTF":
    raise ValueError("Downloaded model is not a GLB file")
declared_length = int.from_bytes(data[8:12], "little")
if declared_length != len(data):
    raise ValueError("GLB header length does not match file size")
DEST.parent.mkdir(parents=True, exist_ok=True)
DEST.write_bytes(data)
print(f"Imported Poly Haven CC0 {ASSET}: {len(data):,} bytes -> {DEST}")
