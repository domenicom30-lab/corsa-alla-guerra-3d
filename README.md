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

## Versione 1.4 — Impatto arcade, animazioni di caduta e zone differenziate

- Quando un soldato viene sconfitto, lo sprite originale animato cade e ruota fisicamente, con elmetto, detriti e polvere separati; tutte le animazioni sono leggere, a durata limitata e con pool a capacità fissa.
- Le ferite senza eliminazione producono scintille e microdetriti; le cadute sono collegate a corpo a corpo, proiettili e detonazioni.
- Le ambientazioni successive vengono disegnate sopra la vecchia parallasse della foresta; il passaggio tra villaggio, fabbrica e fortezza sfrutta una dissolvenza corretta.
- **Abbassamento tenuto premuto** su touchscreen e tastiera: la posa e la collisione restano coerenti per tutta la pressione. Il rilascio del pulsante o l'uscita dall'app ripristinano lo stato.
- I test specifici controllano animazioni, movimento della telecamera, reset, numero massimo di effetti, rispetto del livello di trasparenza e sicurezza degli input.

**Nota:** la riuscita della build dimostra che l'APK compila; non certifica la stessa qualità artistica di Metal Slug né sostituisce una prova visiva sul telefono.

## Versione 1.5 — La nuova pipeline grafica raster

Il runtime 2D ora carica i PNG dallo **sprite manifest**, non disegna più personaggi, nemici e carro boss come primitive canvas. Lo script `scripts/build_raster_art.py` costruisce offline il primo pacchetto originale riproducibile, con atlas di animazione del soldato, quattro tipi di nemici, tank boss, esplosioni, HUD, e 4 ambientazioni composte da due livelli PNG. `sprite-loader.js` ritaglia i singoli fotogrammi e precarica i file prima di autorizzare la partita.

**Controlli di qualità:** tutte le 27 risorse sono obbligatorie, con dimensioni previste dal manifest; immagini mancanti, corrotte o non corrispondenti bloccano la build GitHub Actions e l'avvio del gioco. Il test Node controlla firme PNG, dimensioni e assenza dei vecchi fallback nel rendering dei personaggi.

Per lavorare localmente: `python3 -m pip install Pillow`, `npm run assets`, poi `npm run dev` o `npm run build`.

Il contenuto grafico generato è la prima versione di sprite raster originali, **non una riproduzione della qualità artistica commerciale di Metal Slug**: per aumentare ulteriormente fedeltà e dettaglio si possono sostituire i PNG con atlanti dipinti da illustratori, conservando stesso manifest e il motore di animazione.

## Release 2.0 — Versione completa da provare su Android

La campagna 2D presenta quattro zone a scorrimento, ondate originali di nemici, prigionieri da liberare, armi speciali, granate, un carro utilizzabile, attacchi aerei, un comandante corazzato con più fasi e il traguardo a 200 metri. Il gioco assegna punteggi, combo, record salvati e crediti continue.

La versione finale **da provare** comprende una schermata missione originale, un menu pausa con Riprendi/Ricomincia, modalità grafica Auto/Alta/Risparmio e interruttore audio, un riepilogo finale con record, tempo e ostaggi liberati, un'icona Android personalizzata e la versione **v2.0** visibile nell'interfaccia. Le impostazioni vengono salvate localmente.

### Controlli Samsung in orizzontale
- Pulsanti a sinistra: movimento.
- Pulsanti a destra: salto, sparo mantenuto premuto, granata, abbassamento mantenuto.
- Pulsante **↑ MIRA**: spara verso l'alto mantenendo premuto.
- **CARRO**: entra/esci quando sei abbastanza vicino a un carro.
- Pausa: cambia volume/qualità o riprendi la partita.

### Cosa verifica la compilazione
I test Node convalidano menu e impostazioni, progressione simulata di tutta la campagna, riavvio, armi, prigionieri e boss, oltre a tutti gli atlas obbligatori. Prima di distribuire l'APK, lo script Python controlla anche le 27 risorse PNG e le sei immagini importate dall'utente **dentro l'APK effettivo**.

**Limite dichiarato:** questa è una build completa per prova funzionale, ma la qualità artistica è basata su sprite PNG originali generati offline e non è equivalente alla pittura manuale di un gioco arcade commerciale. FPS, proporzioni sul Samsung e leggibilità dei comandi richiedono una prova sul dispositivo.
