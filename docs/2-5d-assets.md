# 2.5D conversion and asset contract

Original 3D game is preserved in branch `backup-3d-before-2-5d`.

The new runtime uses HTML Canvas 2D, three perspective lanes, jumping, obstacles, score, and Android touch controls.

## Pre-rendered artwork still required

Put these exact files in `public/assets/2d/`:

- `forest-background.webp`: vertical realistic battlefield background, horizon at about 38%.
- `soldier-back.webp`: transparent rear-view soldier, feet at bottom.
- `spruce.webp`: transparent realistic spruce.
- `sandbags.webp`: transparent WWII sandbag stack.
- `crate.webp`: transparent wooden military crate.
- `muddy-road.webp`: seamless muddy road texture.

The game remains playable using procedural fallback images until these are provided.
The current build is a functional 2.5D prototype, NOT a photorealistic finished game.
Verify final sprite inclusion and visual quality on Android before claiming completion.
