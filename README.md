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


## Versione 2.0.1 — APK installazione pulita Samsung

Per evitare il conflitto tra firme debug generate in workflow GitHub diversi, l'app di prova usa un nuovo identificativo Android `com.corsaguerra.arcadeprova` e nome visibile **Corsa alla Guerra 2D Prova**. Può essere installata accanto a vecchie APK del progetto, senza disinstallarle e senza cancellarne i dati. Questa modifica evita solo conflitti di pacchetto/aggiornamento; non bypassa le protezioni Android/Samsung (Installazione app sconosciute e Blocco automatico). I nuovi aggiornamenti vanno pubblicati con una chiave di firma stabile prima di distribuzione continuativa.

La build controlla l'identificativo all'interno del manifest Android e la firma APK mediante gli strumenti ufficiali Android `aapt` e `apksigner`, oltre ai test grafici e di campagna.

## 2.1 — Grafica di prova revisionata dallo screenshot Samsung

- **Cielo ripulito:** il primo scenario elimina i 2400 quadratini casuali e usa sfumature più soffuse, colline e foschia.
- **Bosco rifatto:** alberi irregolari con rami, chiome sovrapposte e profondità di parallasse; il terreno ora continua dietro l'interfaccia.
- **Torre illustrata:** nuova immagine trasparente 600×960 con assi, bulloni, scala, tetto e rinforzi, compresa e verificata nell'APK.
- **Protagonista:** nuove pieghe del tessuto, cuciture, riflessi sul casco e finiture della mitragliatrice, su tutti gli atlas PNG esistenti.
- **HUD mobile:** barre e controlli ridotti, titolo superfluo nascosto, punteggi abbreviati.
- La 2.1 è distribuita con ID Android `com.corsaguerra.arcadeprova21` per evitare conflitti con i certificati debug delle precedenti versioni di prova; l'APK mostra versionName 2.1.0.

Questo non equivale a risorse illustrate a mano dello stesso livello qualitativo di un titolo commerciale. Va confrontato con screenshot reali su Samsung, intervenendo poi su animazioni ed effetti ancora troppo stilizzati.


## v2.2 — Proporzioni arcade e cast originale rifinito
La scala di eroe, quattro classi nemiche, carro utilizzabile e boss è centralizzata in `arcade-proportions.js`. Il corpo del protagonista visibile occupa circa il 28% dell'altezza di gioco; il soldato pesante è poco più alto, il boss più voluminoso. L'aspetto fa riferimento a proporzioni arcade esagerate, ma non include grafiche copiate dai giochi SNK. Sono stati aggiunti dettagli distintivi delle divise (elmetti, cicatrici del metallo, sciarpa, granate, pettorine), il puntamento direzionale reale degli sprite nemici e segnali visivi di preparazione del colpo, fiammate e danni. Il veicolo del giocatore rispetta la medesima scala anziché sembrare un giocattolo. Le collisioni rimangono calibrate come nella versione precedente.

La versione mostra `v2.2` e usa l'identificativo `com.corsaguerra.arcadeprova22` per installarsi accanto alle prove precedenti. Nuovi test impediscono regressioni nelle proporzioni, nel ribaltamento degli sprite e nei segnali di sparo.


## v2.3 — Explosion polish and sky cleanup
- Replace the flat explosion blobs with ten animated frames showing white-hot ignition, uneven fire lobes, embers, and dispersing soot.
- All four backgrounds now remove random screen-wide high-contrast square speckles, preserving readable characters and natural color gradients.
- `scripts/test_art_v23.py` checks all four sky regions and each animation frame before GitHub builds the Android package.
- Independent Android test ID `com.corsaguerra.arcadeprova23` and versionName `2.3.0` avoid APK signature mismatches with older debug builds.

This pixel-art is original; it is not extracted from or identical to any copyrighted Metal Slug artwork.


## v2.4 — Upward aiming sprites
The commando has a dedicated 4-frame `aimUp` PNG animation: shoulders pivot, rifle and muzzle point vertically. The game chooses this pose from the Samsung `↑ MIRA` control and keyboard `W` while retaining jump, crouch, weapon physics, and existing collisions. The generated PNG is required by the manifest, and `scripts/test_aimup_art.py` confirms that all four frames contain a raised rifle without the horizontal rifle being left behind. Isolated Android package `com.corsaguerra.arcadeprova24` displays v2.4.


## v2.5 — Personaggi proporzionati e tasto carro sul Samsung
- Protagonista ridimensionato: la parte effettivamente visibile occupa circa il 19% dell'altezza del display anziché quasi il 29%. Posa abbassata proporzionata.
- Soldati base intorno al 18%, soldati pesanti intorno al 22%. Carro guidabile intorno al 26% di altezza effettiva; boss proporzionato al nuovo cast.
- Collisioni con proiettili nemici adattate alle dimensioni più piccole, evitando hitbox ingiustificatamente grandi.
- Nuovo tasto touch contestuale centrale: **AVVICINATI AL CARRO** a distanza; **ENTRA NEL CARRO** quando raggiungibile; **ESCI DAL CARRO** una volta a bordo. Resta disponibile anche il tasto fisico `E`.
- Nuovi test automatizzati per soglie di distanza, veicolo distrutto, avvio, pausa, entrata, uscita, dimensioni e interfaccia Android.
- Versione e identificativo Android autonomo `com.corsaguerra.arcadeprova25` per evitare conflitti di firma con altre APK di prova.


## Versione 2.6 — Scenari differenziati e animazioni aggiuntive

- Quattro **nuovi elementi scenici PNG originali** con silhouette, materiali, superfici e dettagli differenti: postazione forestale, abitazione in rovina, macchinario industriale e portale fortificato. Non sono più ripetuti indistintamente in ogni zona.
- Il sistema di sprite obbligatori include la nuova famiglia `props` e 4 frame `duckFire` per sparare da accovacciati, con rinculo dedicato. Tutte le risorse sono controllate nella pipeline e all'interno dell'APK.
- L'insegna della missione occupa meno spazio sul Samsung per lasciare vedere il personaggio e il campo di battaglia.
- Test aggiuntivi sulla composizione dei quattro elementi grafici, sui fotogrammi duckFire e sul legame fra stage e asset.
- APK separata con ID `com.corsaguerra.arcadeprova26` e versione 2.6.0.

I materiali sono disegni originali generati offline; una qualità equivalente ai titoli arcade illustrati a mano resta un obiettivo artistico ancora da verificare su dispositivo.

## Versione 2.7 — Combattimento arcade avanzato
- **SCIVOLA:** pulsante vicino al movimento e Shift su tastiera. Scivolata bassa con accelerazione temporanea, scia, durata di 0,37 s e ricarica di 0,92 s. Non funziona mentre si è nel carro o in salto.
- **Colpo ravvicinato visibile:** arco di lama con due livelli di luce e tempo di attacco dedicato; funziona contro i soldati vicini prima del tiro.
- **Nemici assaltatori reattivi:** dopo un colpo non letale effettuano una schivata con spostamento fisico, posizione accovacciata e hitbox coerente, interrompendo il fuoco e riposizionandosi.
- Reset e cronologia dello stato combattono gli exploit da tap ripetuti; test automatici separati con valori e condizioni verificati.
- APK installabile separata: `com.corsaguerra.arcadeprova27`.
Questo aggiornamento migliora le meccaniche ma non dimostra ancora parità di qualità grafica con Metal Slug; serve prova sul Samsung.

## Politica build APK — solo candidate complete

Per evitare un nuovo APK a ogni modifica, `.github/workflows/build-apk.yml` **non viene più attivato automaticamente** da push su `main` o pull request. L'APK viene creata soltanto tramite l'avvio esplicito della workflow `Build Android APK` (`workflow_dispatch`), quando le meccaniche e gli asset per una release candidata sono integrati e i test risultano verdi.

Le verifiche automatiche `Automated quality gates` **restano attive** sugli aggiornamenti del ramo `main`. Il numero di versione e il pacchetto Android devono essere aggiornati solo quando si decide di produrre una nuova APK testabile.


## Sviluppo grafico e tattico — ancora senza nuova APK
- Sostituito il rendering principale del **carro guidabile** basato su rettangoli durante la partita con un atlas originale PNG di **6 fotogrammi da 400×250**. I frame rappresentano maglie del cingolo, ruote con mozzi e rivetti, torretta corazzata, freno di bocca, rinculo, comandante e usura della vernice.
- Il motore usa l'illustrazione raster prerenderizzata quando gli sprite obbligatori sono caricati. Mantiene le proporzioni del carro rispetto alla fanteria.
- I soldati fucilieri, assaltatori e granatieri ora possono essere **soppressi da un proiettile che passa vicino**, non solamente feriti: interrompono l'attacco, si abbassano e subiscono una breve pausa di fuoco. Gli assaltatori possono schivare lateralmente. Cooldown e distanza verticale prevengono reazioni continue o a colpi molto lontani.
- Aggiunti test specifici su 6 frame PNG, collisioni di prossimità, copertura, cooldown, ripristino alla ripartenza, integrazione del rendering, oltre a verifica obbligatoria delle nuove risorse nel manifest e nello ZIP APK al momento della release.
- La workflow **Android resta esclusivamente manuale**. Questo aggiornamento sul ramo `main` non cambia il numero della versione Android né genera una nuova APK: verrà integrato con altri miglioramenti prima della prossima release candidata.

## Sviluppo in corso dopo v2.7 — Animazioni arcade avanzate (senza nuova APK)

Questa fase è sul ramo `main` e **non cambia il pacchetto Android finché non sarà pronta una release candidata**. Il generatore offline produce tre nuovi atlas PNG obbligatori per il protagonista: **slide** (6 frame), **melee** (5 frame, con braccio e lama disegnati separatamente dal fucile) e **land** (4 frame di compressione all'atterraggio). Il motore seleziona questi frame a partire dallo stato delle mosse e dalla fisica effettiva. Atterraggi impegnativi producono anche polvere sul terreno.

I test bloccano l'integrazione se le nuove pose mancano, se i frame sono identici o se la pipeline APK viene riattivata automaticamente. La grafica rimane originale; il dettaglio professionale va ancora confrontato su dispositivo prima della prossima build Android.


### Secondo intervento grafico senza nuova APK
- Aggiunte due animazioni prerenderizzate originali, quattro frame ciascuna: `hero/slide.png` e `hero/melee.png`. La scivolata ora abbassa davvero il casco e allunga il corpo lungo il terreno; il combattimento corpo a corpo ha una baionetta con rinculo e riflessi animati.
- Il protagonista sceglie la posa sulla base degli stati reali del sistema di combattimento; non viene più simulata una scivolata soltanto con `duck`.
- Verifica CI delle dimensioni degli atlas, frame unici, trasparenza, posa bassa e collegamento col motore.
- **Nessun incremento di versione Android e nessuna APK automatica**: tutte le prove restano nel sistema di quality gates.

### Intelligenza nemica: manovre tattiche (sviluppo senza APK)
I granatieri possono **arretrare** quando il protagonista si avvicina, restando entro il proprio tratto di battaglia. Gli assaltatori avanzano ora fino alla distanza del **corpo a corpo**, mentre i soldati corazzati continuano a mantenere lo spazio di tiro. Tre nuove verifiche controllano movimento, distanza e reset della missione.

La release Android non parte automaticamente: la sola verifica continua è la pipeline di qualità.

### Feedback carro e collisioni più affidabili (WIP, nessuna APK)

- I proiettili nemici attraversano ora una **hitbox spazzata tra il fotogramma precedente e quello corrente**: anche su dispositivi con rallentamenti non devono oltrepassare il soldato né le coperture.
- **Scivolata e salto** continuano a proteggere dai proiettili che passano sopra o sotto il corpo del protagonista, rispettando le rispettive sagome ridotte.
- Il carro guidabile usa fotogrammi dedicati di **rinculo e lampo del cannone** anche se rimane fermo, non soltanto durante lo scorrimento dei cingoli. Lo stato dell'animazione viene azzerato al riavvio.
- Test automatizzati specifici per traiettorie veloci, coperture, evasione e animazione del carro.
- La procedura APK rimane manuale: nessuna build Android automatica è richiesta da questi sviluppi.

### Miglioramento visivo in sviluppo — prigionieri e barricate

Sostituiti i rettangoli di prova con due nuove risorse **PNG originali**: un prigioniero animato su quattro fotogrammi, con divisa civile, volto ed equipaggiamento, e una barricata di sacchi di sabbia in tre condizioni visive (integra, danneggiata, distrutta). Le coperture completamente distrutte restano come detriti scenici, ma non fermano più i proiettili. La nuova scala dei soldati, le soglie di liberazione e le collisioni restano invariate.

La pipeline di qualità verifica ogni fotogramma e i collegamenti con il gioco. **Nessuna APK viene generata automaticamente** finché non è pronta una nuova versione candidata alla prova su Samsung.

### Nuove pose dei quattro tipi di soldati (lavoro in corso)

Otto nuovi atlas animati **originali** in formato PNG: quattro posture **Crouch** con arma abbassata e ginocchia piegate, quattro reazioni **Hurt** con inclinazione, colpi ed equipaggiamento. Sono 32 fotogrammi aggiuntivi. Ogni nemico continua a usare la sua animazione base quando cammina, ma ora cambia realmente posa in caso di ferita, abbassamento, soppressione o schivata. Gli originali vengono generati offline e testati in CI: non vengono scaricati sprite protetti di altri giochi.

La qualità artistica è ancora da valutare su Samsung. Non viene creata una APK per ogni aggiornamento; la pipeline Android resta manuale.
