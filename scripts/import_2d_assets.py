#!/usr/bin/env python3
"""Install the user's exact raster assets from ZIP archives at repo root.
Fail explicitly instead of silently producing another placeholder APK.
"""
from pathlib import Path
from zipfile import ZipFile
import sys

root = Path(__file__).resolve().parent.parent
target = root / "public/assets/2d"
packages = [
    *sorted(root.glob("corsa-alla-guerra-2d-assets*.zip")),
    root / "corsa-alla-guerra-reference-2d.zip",
]
required = [
    "forest-background.webp",
    "soldier-back.png",
    "sandbags.png",
    "barrier.png",
    "crate.png",
    "reference-scene.webp",
]
target.mkdir(parents=True, exist_ok=True)
for archive in packages:
    if not archive.exists():
        print(f"Package not found in repository: {archive.name}")
        continue
    with ZipFile(archive) as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            name = Path(info.filename).name
            if name not in required:
                continue
            if info.file_size > 12_000_000:
                raise SystemExit(f"Asset too large: {name}")
            (target / name).write_bytes(z.read(info))
            print(f"Imported {name}: {info.file_size} bytes")
missing = [name for name in required if not (target / name).is_file()]
if missing:
    print("ERROR: Real 2D assets missing: " + ", ".join(missing), file=sys.stderr)
    print("Upload both ZIP archives to the GitHub repository root, then rerun Actions.", file=sys.stderr)
    sys.exit(1)
print("All six user-provided 2D images are present for APK packaging.")
