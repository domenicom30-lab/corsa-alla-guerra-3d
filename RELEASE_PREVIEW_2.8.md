# Corsa alla Guerra 2D — Preview Android 2.8

Candidato di prova per Samsung Galaxy Z Fold 8. Commit candidato prodotto
solo dopo il completamento dei controlli automatici web, degli atlanti 2D
e delle meccaniche, compresa la suite verde
https://github.com/domenicom30-lab/corsa-alla-guerra-3d/actions/runs/38903065451 .

## Novità della preview
- Quattro livelli distinti con grafica illustrata e scenari più vari.
- 63 atlanti originali, 8 keyframe di salto, 8 di sparo aereo,
  6 di lancio granata e 24 di caduta dei nemici.
- Carri armati, boss corazzato con tre fasi e tre stati grafici.
- Effetti meteo diversi per zona, segni persistenti degli scoppi,
  barricate e postazioni mitragliatrici distruttibili.
- Impostazioni grafiche auto/high/battery per telefoni.

## Controlli della build
APK prodotto su Ubuntu con JDK 21, Android SDK e Capacitor 7,
installato nel pacchetto indipendente com.corsaguerra.arcadepreview28.
GitHub Actions verifica i PNG nel pacchetto finale, la firma APK,
il versionName 2.8.0 e il checksum SHA-256.

## Verifica sul Galaxy Z Fold 8
- Toccare PLAY e provare destra, sinistra, salto e sparo continuo multitouch.
- Controllare lo scorrimento e gli sprite dopo un riavvio.
- Provare granate, armi speciali, scivolata, corpo a corpo e carro.
- Verificare tutti i quattro ambienti, gli ostaggi e il boss finale.
- Provare pausa/riprendi e modalità batteria.
- In caso di errore raccogliere schermata e modello/versione di Android.

I test automatici non sostituiscono una prova FPS/visiva sul dispositivo.
Licenza: tutti gli elementi aggiunti sono originali; nessuno sprite di Metal Slug.
