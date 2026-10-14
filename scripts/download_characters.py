#!/usr/bin/env python3
"""Fetch a CC0 textured human officer stand-in for the finish podium."""
from pathlib import Path
from urllib.request import Request, urlopen
import struct

url = 'https://www.innerscene.com/api/library/pilot-standing-3d-person-aircrew-f8605f36/download'
dest = Path('public/models/characters/officer-standing.glb')
dest.parent.mkdir(parents=True, exist_ok=True)
try:
    with urlopen(Request(url, headers={'User-Agent': 'CorsaAllaGuerra3D/1.0'}), timeout=90) as response:
        payload = response.read(26_000_001)
    if not (20 <= len(payload) <= 26_000_000 and payload[:4] == b'glTF'
            and struct.unpack_from('<I', payload, 8)[0] == len(payload)):
        raise ValueError('invalid GLB header or size')
    dest.write_bytes(payload)
    print(f'CC0 officer stand-in downloaded: {len(payload)} bytes')
except Exception as exc:
    print(f'Optional CC0 officer unavailable; retain original officer: {exc}')
