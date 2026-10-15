# Corsa alla Guerra 2D — Arcade Art v2

Obiettivo: run-and-gun laterale 2D con pixel art dettagliata, animazioni fluide e scenari a parallasse, ispirato ai classici arcade senza copiare sprite proprietari.

## Asset richiesti

Caricare in `public/assets/arcade/`:

| Nome | Specifiche |
| --- | --- |
| `soldier-run.png` | PNG trasparente, 6 frame orizzontali di identica larghezza, soldato rivolto a destra, piedi allineati |
| `red-tick.png` | PNG trasparente, 4 frame orizzontali di identica larghezza, zecca rossa vista lateralmente |
| `crate.png` | PNG trasparente, cassa dettagliata |
| `sandbags.png` | PNG trasparente, sacchi di sabbia dettagliati |
| `watchtower.png` | PNG trasparente, torretta in legno |
| `sky.webp` | Livello di cielo, ripetibile orizzontalmente |
| `mountains.webp` | Montagne con trasparenza, ripetibili orizzontalmente |
| `forest.webp` | Foresta con trasparenza, ripetibile orizzontalmente |
| `foreground.webp` | Terreno, rocce e vegetazione, ripetibile orizzontalmente |

Non usare immagini di gameplay complete come texture: includerebbero HUD e personaggi fissi nello sfondo. Il loader `arcade-art.js` usa automaticamente gli asset quando presenti, altrimenti mostra la vecchia grafica procedurale.

**Stato:** motore predisposto, asset definitivi ancora da produrre/caricare. Nessuna promessa di qualità equivalente al concept fino a verifica APK sul dispositivo.
