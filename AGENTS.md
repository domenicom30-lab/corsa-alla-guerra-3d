# Istruzioni tecniche — Corsa alla Guerra 2D

## Obiettivo
Sviluppare esclusivamente un gioco arcade laterale Canvas 2D, con animazioni dettagliate, parallasse, nemici, armi e boss. Arte originale ispirata ai classici run-and-gun, senza copiare sprite, marchi o audio protetti di Metal Slug.

## Vincoli
- Non reintrodurre Three.js, GLB/GLTF, motori 3D, PBR o selettori 2D/3D.
- Non cancellare i due pacchetti ZIP degli asset 2D originali dell'utente.
- Sprite animati realmente utilizzati per idle, run, fire, jump, duck, con fallback.
- Conservare controlli touch multitouch, sparo continuo, granate, boss, carri, ostaggi, armi, punteggio, vite e traguardo.
- Eseguire npm run check, npm run build e workflow CI Android senza bypassare test.
- Non certificare la qualità visiva o FPS senza prova reale su Android.
- Ottimizzare Canvas, pooling e effetti per smartphone. Nessuna credenziale o asset senza licenza.
- Usare normalmente PR per cambi rischiosi, con rollback e test su telefono.

## Diagnostica
La APK è prodotta da .github/workflows/build-apk.yml. Le immagini originali 2D vengono estratte dai due ZIP prima della build. Il nome storico del repository GitHub non implica l'esistenza del motore 3D.
