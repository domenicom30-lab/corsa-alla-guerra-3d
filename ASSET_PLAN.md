# Piano asset fotorealistici — Corsa alla Guerra 3D

## Riferimento visivo
Foresta militare, strada sterrata, sacchi di sabbia, torrette di guardia, protagonista visto da dietro, profondità atmosferica. Ambientazione storica senza propaganda.

## Fonti e licenze
- Poly Haven https://polyhaven.com — CC0: texture PBR, HDRI, rocce, tronchi, terreno e vegetazione. https://polyhaven.com/license
- ambientCG https://ambientcg.com — CC0: suolo, fango, pietra, legno, metallo.
- Kenney Nature Kit https://kenney.nl/assets/nature-kit — CC0, solo per elementi lontani perché stilizzati.

## Asset necessari prima del fotorealismo
1. Strada sterrata: albedo, normal, roughness, AO a 1024px o 2048px.
2. Terreno forestale: albedo, normal, roughness a 1024px.
3. Tronchi e corteccia: texture PBR.
4. 3-5 alberi realistici GLB/GLTF ottimizzati con LOD.
5. Cespugli, erba e rocce in mesh istanziate.
6. Sacchi di sabbia, torre di guardia e barricate con geometria UV e texture.
7. Illuminazione HDRI convertita in formato compatibile e ridotta per mobile.
8. Soldato GLB con materiali PBR e animazioni run/idle/jump.

## Convenzioni file
public/assets/textures/road_color.jpg
public/assets/textures/road_normal.jpg
public/assets/textures/road_roughness.jpg
public/assets/textures/forest_color.jpg
public/assets/textures/forest_normal.jpg
public/assets/textures/forest_roughness.jpg

I file vanno scaricati dalla fonte, ottimizzati e inclusi localmente. Non collegare texture da server esterni durante il gioco.

## Target mobile
- Rendering 30-60 fps su dispositivo target dopo test reali.
- Texture 1K preferite; 2K solo per asset principali.
- Mesh instancing, LOD, culling e draw-call budget.
- Compressione KTX2/Basis per texture e Draco/Meshopt per geometrie.
- Ombre 1024/2048 in base al dispositivo, profiling GPU.
- Niente asset scaricati da fonti con licenze non verificate.

## Stato
Le risorse sono state identificate, non scaricate né incorporate. Il gioco usa attualmente materiali e vegetazione procedurali. La build e la qualità visiva vanno ancora verificate dopo gli ultimi commit.
