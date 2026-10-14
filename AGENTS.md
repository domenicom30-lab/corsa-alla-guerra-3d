# Istruzioni per l'agente di sviluppo — Corsa alla Guerra 3D

## Missione
Migliorare progressivamente la qualità grafica del gioco Android Three.js verso il riferimento visivo concordato: soldato dettagliato visto da dietro, strada forestale fangosa, conifere realistiche, postazioni militari e portale TRAGUARDO. Mantenere controlli, giocabilità e prestazioni su Android.

## Regole inderogabili
- Lavora su un ramo dedicato, mai direttamente su main. Apri una pull request piccola, spiegando modifiche, test e rischi.
- Non fare merge automatico delle modifiche visive senza test su dispositivo e approvazione. Il verde della build non dimostra il realismo né gli FPS.
- Prima di ogni PR: esegui `npm ci` se il lockfile è disponibile, `npm run check`, `npm run build`; la CI costruisce anche l'APK.
- Non eliminare il modello Soldier.glb né cambiare scheletro, orientamento, altezza, animazioni o collider senza fallback e verifica.
- Non introdurre asset esterni senza URL stabile, licenza esplicita compatibile e attribuzione quando necessaria. Vietato incorporare chiavi, token o credenziali nel repository.
- Evita draw call aggiuntive: condividi geometrie/materiali, usa InstancedMesh e LOD, limita ombre e texture adatte a smartphone.
- Non usare simboli di propaganda o glorificazione estremista; mantenere la rappresentazione storica contestualizzata.
- Non disabilitare controlli per far diventare verde una build.
- Ogni PR deve avere un piano di rollback: revert della PR o ripristino del commit stabile.

## Priorità in ordine
1. Correggere bug di corsa, salto, traguardo e camera.
2. Migliorare asset del soldato con licenza e rig compatibili.
3. Migliorare alberi, terreno, strutture e illuminazione.
4. Aggiungere misurazioni FPS su dispositivo e confronti screenshot.
5. Rifinire HUD e UX mobile.

## Definizione di completato
La PR contiene screenshot o descrizione delle differenze visive, licenze asset, test passati, APK generata e indicazione se la prova su Android è stata effettivamente eseguita. Non dichiarare mai fotorealismo o prestazioni verificate sulla sola base della compilazione.
