# Slice Suite formats and conventions (2026-10-12)

## Placement: one convention for every tool

An instance `{ x, y, z, rotX, rotY, rotZ }` puts the model's **bottom-centre pivot** `(RX/2, 0, RZ/2)` (in the model's voxel grid) at world `(x, y, z)`, and the rotation turns the whole model about that pivot. Rotation order is the suite's `rotVec`: Y, then X, then Z, about world axes (matrix `Rz·Rx·Ry`).

Slice Studio, Slice and Dice and SliceWorks Engine (from v0.5) all use this, so a scene placed in Studio lands in the same spot everywhere. A voxel at grid cell `(gx, gy, gz)` occupies the unit cube from `(gx, gy, gz)` to `(gx+1, gy+1, gz+1)` in model space.

The world floor is the plane `y = 0`. Studio terrain cells `[x, z]` are 1×1×1 stone blocks from `y = 0` to `y = 1`.

## Units

| Quantity | Engine internal | Files and UI |
|---|---|---|
| length | voxel | voxel |
| time | tick (1/60 s) | second |
| velocity | voxel/tick | voxel/s (`.soan`) |
| angular velocity | rad/tick, world axes | rad/s, world axes (`.soan`) |
| gravity | 0.028 voxel/tick² | −100.8 voxel/s² |

`.soga` stores physics state in the Engine's internal units (per tick), because it is a snapshot of the running engine.

## `.soli`: model
See [slice-of-life.md](slice-of-life.md). v0.2 adds `joints: [{ name, type: 'fixed'|'hinge'|'ball', position: [x,y,z], axis: [x,y,z], limit_deg: [min, max] }]` in model grid coordinates. Hinge axes are in the model's frame; limits are measured from the pose the model was placed in.

## `.sost`: scene (Slice Studio v0.3)
See [slice-studio-v0.3-handoff.md](slice-studio-v0.3-handoff.md). `instances[].id` is kept by Dice and the Engine, and `.soan` tracks refer to it.

## `.soan`: animation (Slice and Dice v0.4)
```
{ magic: 'SOAN', version: '0.4', fps: 60, duration_frames: 300,
  export_mode: 'parametric' | 'baked',
  physics: { gravity: -100.8, floor_y: 0, units: {...}, core: 'SliceWorks Engine v0.5 rigid body ...' },
  tracks: [{ instance_id, model_name, type: 'physics'|'static',
             initial: { position, rotation, velocity, angular_velocity },
             frames?: [[x, y, z, rotX, rotY, rotZ], ...] }],   // baked only: the pivot per frame
  environment: { preset, terrain } }
```
Load it in the Engine after the scene it was made for. Parametric tracks are re-simulated: the result is identical to Dice's preview, because Dice runs the Engine's core. Baked tracks are played back as recorded.

## `.soga`: game / snapshot (Engine v0.5 writes v0.3)
```
{ magic: 'SOGA', version: '0.3',
  scene: { gravity: [0, -100.8, 0], floor_y, bounds },
  models: [{ id, soli_name, soli_data /* base64 of the .soli JSON */ }],
  instances: [{ id, modelIdx, x, y, z, rotX, rotY, rotZ, static }],
  environment: { terrain },
  physics_state: { bodies: [{ type, position, velocity, rotation, angular_velocity,
                              orientation /* exact 3×3 */, floor_ticks, sleeping, clusters }] },
  meta: { tick, sim_time, tool, title? } }
```
Bodies are listed in detection order, so loading rebuilds them from the instances and then restores each body's state; a resumed game continues bit for bit. v0.2 files (Engine ≤ v0.4) have no `instances` and can't be loaded back.

## Cartridges
A cartridge is the Engine's own page with a `.soga` inside (`<script type="application/json" id="cartridge">`) and `window.SLICE_PLAYER = true`. Opened in a browser, it boots straight into the scene with only PLAY, RESET and the camera. **The `.soga` is the ROM; the HTML is the console.** Make one from the Engine's EXPORT tab. The blank console, `sliceworks-player-*.html`, is the same page with no ROM; it asks for a `.soga`. Rebuild it after changing the Engine:

```bash
node tools/build-player.mjs sliceworks-engine-v0.5.html sliceworks-player-v0.1.html
```
