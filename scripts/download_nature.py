#!/usr/bin/env python3
"""Download a small pinned set of CC0 Kenney GLB environment models for APK builds."""
from pathlib import Path
from urllib.request import Request, urlopen
import struct

REV = '2c8950b716e6765930b2b51409c59adf3d66fd5c'
FILES = [
    'tree-pinetalla-detailed.glb',
    'tree-pinetallb-detailed.glb',
    'tree-pinetallc-detailed.glb',
    'tree-pinetalld-detailed.glb',
    'tree-pinerounda.glb',
    'tree-pineroundc.glb',
    'tree-pinesmalla.glb',
    'tree-pinesmallc.glb',
    'rock-largea.glb',
    'rock-largeb.glb',
    'rock-largec.glb',
    'rock-largee.glb',
    'rock-talla.glb',
    'rock-tallc.glb',
    'plant-bushdetailed.glb',
    'plant-bushlarge.glb',
    'plant-bushsmall.glb',
    'grass-large.glb',
]
OUT = Path('public/models/nature')
OUT.mkdir(parents=True, exist_ok=True)
for name in FILES:
    url = f'https://raw.githubusercontent.com/Hidencod/tge-assets/{REV}/packs/nature-kit/{name}'
    req = Request(url, headers={'User-Agent': 'CorsaAllaGuerra3D-AssetBuild/1.0'})
    with urlopen(req, timeout=40) as response:
        data = response.read(5_000_000)
    if len(data) < 20 or data[:4] != b'glTF' or struct.unpack_from('<I', data, 8)[0] != len(data):
        raise ValueError(f'Invalid GLB file: {name}')
    (OUT / name).write_bytes(data)
    print(f'CC0 Kenney nature: {name}: {len(data)} bytes')
print('Nature GLBs installed successfully.')
