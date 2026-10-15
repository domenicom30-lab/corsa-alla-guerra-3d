# Corsa alla Guerra 2D

Gioco arcade originale **run-and-gun laterale** per Android, ispirato allo stile dei classici senza utilizzare materiale protetto di altri giochi.

## Caratteristiche
- Esclusivamente Canvas 2D, senza motore o modelli 3D.
- Soldato animato da sprite sheet 2D, con fallback disegnato.
- Foresta e monti su più piani, trincee, fumo, effetti di pioggia e immagini 2D fornite dal creatore.
- Nemici animati, zecche rosse, armi, granate, ostaggi, carro guidabile e boss.
- Controlli mobile e tastiera; pausa automatica al cambio app.

## Comandi
Touchscreen: SINISTRA, DESTRA, SALTA, SPARA, GRANATA e ABBASSATI; pulsanti separati per CARRO e MIRA.
Tastiera: frecce/A-D, Spazio, F, G, E, Esc.

## Build
Il workflow GitHub Actions Build Android APK importa le immagini dai due ZIP originali, esegue npm run check, compila tramite Vite e crea APK usando Capacitor/Gradle.

Per test locale: npm install, python3 scripts/import_2d_assets.py, npm run check, npm run build.

**Qualità:** una build verde non garantisce fluidità, controllo touch o resa artistica su un telefono reale.

## Missione arcade 2D — version 1.2
- Quattro ambientazioni originali a scorrimento: foresta, villaggio, distretto industriale e fortezza.
- Ondate di nemici deterministiche e testabili: fucilieri, assaltatori, granatieri e corazzati.
- 32 fotogrammi nemici precalcolati e 33 pose originali del protagonista, comprese corsa+fuoco e ferita.
- Proiettili a raffica, granate balistiche, danni progressivi, coperture e tre fasi del carro boss.
- Collisioni differenti mentre il giocatore salta o si abbassa. Particelle con pool limitati per Android.

La somiglianza con i classici run-and-gun e l'esperienza sul Samsung vanno valutate provando l'APK: i test automatici verificano logica e compilazione, non garantiscono un risultato artistico identico a giochi commerciali.

## Aggiornamento 1.3 — Lanciarazzi e combattimento reattivo

- **Lanciarazzi originale** con potenziamenti distribuiti lungo la missione, munizioni limitate, scia luminosa e detonazione con danno ad area. Il razzo può distruggere coperture, nemici e danneggiare il boss.
- Le armi già presenti (normale, spread, heavy) restano disponibili. Il contatore di munizioni compare nell'HUD.
- **Collisioni continue:** la traiettoria dei proiettili viene verificata tra un fotogramma e l'altro per evitare che attraversino soldati veloci o veicoli.
- **Attacchi leggibili:** i fucilieri, assaltatori, granatieri e soldati corazzati mostrano un breve preavviso luminoso, che si interrompe se subiscono danni; il boss segnala la prossima cannonata.
- Sprite nemici corazzati con indicatori di resistenza e razzi direzionati verso il basso, l'alto o in orizzontale.
- Test automatici dedicati a munizioni, gittata, splash damage, segnale di mira e interruzione dei colpi.

Il progetto è interamente 2D. Le verifiche automatiche non sostituiscono la prova sul dispositivo Android.
