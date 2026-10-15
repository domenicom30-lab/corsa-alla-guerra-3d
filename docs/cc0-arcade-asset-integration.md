# Piano asset pixel art CC0 per Corsa alla Guerra 2D

Tutti i pacchetti elencati sono risorse esterne identificate come CC0 sulle pagine originali. Nessuno sprite di Metal Slug viene copiato.

- **Generic Run n' Gun** (Vaca Roxa / Anokolisa / al_MSantos): personaggio animato, tre nemici, due aree, sfondi e tileset. https://bakudas.itch.io/generic-run-n-gun — CC0.
- **Army Soldier 2D Game Sprites** (Yoo Game Art): soldati e sette animazioni PNG. https://yoogameart.itch.io/army-soldier-2d-game-sprites — CC0.
- **Free Robot Warfare Pack** (MattWalkden): effetti esplosione, muzzle flash, proiettili, detriti, sei classi soldato. https://mattwalkden.itch.io/free-robot-warfare-pack — CC0.
- **Space soldier sprite sheet 32x32** (drakzlin): idle, run, jump, crouch, attack e death. https://opengameart.org/content/space-soldier-sprite-sheet-32x32 — CC0. PNG diretto: https://opengameart.org/sites/default/files/all_sprites.png.

## Integrazione da completare
1. Scaricare e ispezionare gli archivi originali, verificando dimensioni, trasparenza, ordine e licenza di ciascun frame.
2. Integrare solo gli sprite compatibili con il punto di vista laterale, con fallback agli sprite esistenti e senza fetch esterni a runtime.
3. Aggiornare i test delle pose, la dimensione dei collider e il caricamento asset.
4. Eseguire quality gates e build Android sul ramo `rebuild-arcade-final`, quindi test visivo e FPS sul dispositivo.

**Stato:** catalogo verificato, integrazione grafica ancora da eseguire. I download degli asset non sono riusciti nell'ambiente di lavoro corrente; non dichiarare gli asset installati.
