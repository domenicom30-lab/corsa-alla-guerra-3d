# Soldier equipment — issue #5

The soldier gains a muted canvas backpack, an eight-sided bedroll, leather
bindings and paired rear belt pouches. All shapes are generated in code; no
external assets, textures or additional asset licenses are introduced.
`public/models/Soldier.glb` and its existing materials/animations are unchanged.

Equipment is added after the existing height and centering calculation. The
torso group attaches to `mixamorigSpine2`, and the pouch group to `mixamorigHips`,
preserving the model's upright frame despite the rotated/scaled imported rig.
A missing or degenerate compatible rig leaves the original soldier untouched.
Player movement, collision and jump logic are unchanged.

## Rendering budget

- Four merged meshes, sharing two rough untextured materials.
- 200 extra triangles and at most four extra visible-pass draw calls.
- No added shadow casters, texture requests or work in the animation loop.
- Android FPS and GPU cost have not been measured; these are geometry budgets,
  not device performance claims.

## Automated checks

`npm run check` runs the existing project checks and regression tests built
from the checked-in GLB's original bone hierarchy and animation samples. They
cover unchanged bone/root transforms, actual Run/Idle poses, player jumps,
resource limits, repeated attachment and incompatible rig fallbacks.

Run `npm run build` and the existing Android APK workflow for build validation.

## Manual visual checks required before merge

Browser rendering and Android device visuals have not been tested in this
environment. On the target Android device:

1. Start a run and confirm the soldier is visible from behind, with the pack
   centered on the back, bedroll above it, and pouches at the belt.
2. Observe idle and running poses; inspect the torso and waist for floating
   gear or unacceptable clipping.
3. Move left/right and jump. Confirm gear moves with the soldier, while the
   original orientation, height, landing and obstacle collisions are retained.
4. Lose a run and restart; then reach the finish. Confirm the original controls
   and animations still work.
5. Compare device frame rate against the unchanged main build under the same
   conditions; do not infer FPS or visual realism from successful compilation.

## Rollback

Revert this PR. This removes the helper and its call, restoring the original
appearance without replacing the model, animation clips or gameplay logic.
