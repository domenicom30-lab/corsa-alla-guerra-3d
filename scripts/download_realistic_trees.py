#!/usr/bin/env python3
"""Download CC0 conifer GLBs for the Android forest; validate before installing."""
from pathlib import Path
from urllib.request import Request, urlopen
import struct

ASSETS = {
    'norway-spruce.glb': 'https://www.innerscene.com/api/library/mature-norway-spruce-tree-48c2566f/download',
    'scots-pine.glb': 'https://www.innerscene.com/api/library/mature-scots-pine-tree-280307e1/download',
    'silver-birch.glb': 'https://www.innerscene.com/api/library/mature-silver-birch-tree-8e297753/download',
    'columnar-cypress.glb': 'https://www.innerscene.com/api/library/columnar-cypress-tree-46fad033/download',
}
DEST = Path('public/models/realistic')
DEST.mkdir(parents=True, exist_ok=True)
for filename, url in ASSETS.items():
    optional = filename in ('silver-birch.glb', 'columnar-cypress.glb')
    req = Request(url, headers={'User-Agent': 'CorsaAllaGuerra3D/1.0', 'Accept': 'application/octet-stream'})
    try:
        with urlopen(req, timeout=75) as response:
            payload = response.read(20_000_001)
    except Exception as exc:
        if optional:
            print(f'Optional tree unavailable: {filename}: {exc}')
            continue
        raise
    if not (20 <= len(payload) <= 20_000_000 and payload[:4] == b'glTF'
            and struct.unpack_from('<I', payload, 8)[0] == len(payload)):
        if optional:
            print(f'Optional tree invalid: {filename}')
            continue
        raise ValueError(f'Invalid or oversized GLB: {filename}')
    (DEST / filename).write_bytes(payload)
    print(f'CC0 Innerscene tree {filename}: {len(payload)} bytes')
