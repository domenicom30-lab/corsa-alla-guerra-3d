#!/usr/bin/env python3
"""Verify original raster sheets really shipped inside the Android APK, not just in dist."""
import json, struct, zipfile
from pathlib import Path
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'sprite-manifest.json').read_text('utf-8'))
apk=root/'android/app/build/outputs/apk/debug/app-debug.apk'
if not apk.is_file():raise SystemExit(f'APK mancante: {apk}')
wanted={}
for group in ('hero','enemies','boss','fx','ui','props'):
    for name,frames in manifest[group].items():
        dims=manifest['frameSizes'][group]
        if group=='ui':dims=dims[name]
        wanted[f'{group}/{name}.png']=(dims[0]*frames,dims[1])
for scene in manifest['backgrounds']:
    for layer in ('far','near'):
        wanted[f'backgrounds/{scene}-{layer}.png']=tuple(manifest['frameSizes']['backgrounds'])
with zipfile.ZipFile(apk) as z:
    members=z.namelist()
    for name,(w,h) in wanted.items():
        suffix='/assets/sprites/'+name
        matches=[entry for entry in members if entry.endswith(suffix)]
        if len(matches)!=1:raise SystemExit(f'APK non contiene il PNG obbligatorio: {suffix}')
        with z.open(matches[0]) as f:header=f.read(24)
        if header[:8]!=b'\x89PNG\r\n\x1a\n':raise SystemExit(f'Sprite APK non PNG: {name}')
        actual=struct.unpack('>II',header[16:24])
        if actual!=(w,h):raise SystemExit(f'Sprite APK dimensioni errate: {name}: {actual}')
    tower=[m for m in members if m.endswith('/assets/scenery/watchtower.png')]
    if len(tower)!=1:raise SystemExit('APK manca la nuova torre di guardia illustrata')
    with z.open(tower[0]) as f:head=f.read(24)
    if head[:8]!=b'\x89PNG\r\n\x1a\n' or struct.unpack('>II',head[16:24])!=(600,960):
        raise SystemExit('Asset torre di guardia APK non valido')
    for name in ('forest-background.webp','soldier-back.png','sandbags.png','barrier.png','crate.png','reference-scene.webp'):
        suffix='/assets/2d/'+name
        if not any(entry.endswith(suffix) for entry in members):
            raise SystemExit(f'Immagine utente mancante nell APK: {name}')
print(f'PASS: APK contiene tutti i {len(wanted)} PNG 2D obbligatori, manifest e 6 immagini originali dell utente.')
