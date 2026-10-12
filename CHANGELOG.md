# Changelog

All notable changes to the Slice Suite. Before 2026-10-12 this repo held Slice of Life only; its history is below.

---

## 2026-10-12 (late) · Engine v0.6, Player v0.2 · Kehai Interim

### SliceWorks Engine v0.6: the cartridge buttons
- **Roll** (Space, or a tap on empty canvas in the player): every dynamic body is picked up into a uniformly random orientation, lifted clear of the floor and the others, and tossed with random spin. Without the random orientation the result remembered the starting face (from the demo start, chi² 52–69 over 1000 dice; the up face came up ~22%). With it: chi² 1.15 over 1000 dice from the demo start, 3.50 over 1000 re-rolls from where they landed (df 5; p<0.05 needs 11.07).
- **Flick**: drag a body to throw it in the camera's own plane, with an aim line while dragging; the throw gets a little lift and spin perpendicular to it. Drag on empty space still orbits.
- **Readout**: when everything is at rest, the pips facing up are counted (enclosed holes on the top layer) and shown in a HUD, one die glyph per die plus the sum. **R** resets.
- Controls are saved in the `.soga` (`controls: { roll, flick, readout }`) and set on the EXPORT tab, so each cartridge chooses what its player can do.
- Demo die is now 7×7×7 with the standard pip layout (opposite faces sum to 7); the 6×6×6 die's six had touching pips.
- Contact core unchanged from v0.5 (Dice v0.4 still matches it bit for bit).

### SliceWorks Player v0.2 and the Two Dice cartridge
- Rebuilt from Engine v0.6. `cartridges/two-dice.html` now rolls, flicks and reads.

### Tests
- `tests/controls.mjs` (10 checks): pip readout 600/600, fair rolls (fresh and re-rolled), Space, HUD, flick, cartridge controls, tap to roll. Physics and pipeline suites now run against v0.6; all pass.

---

## 2026-10-12 (later) · Engine v0.5, Dice v0.4, Player v0.1 · Kehai Interim

### SliceWorks Engine v0.5
- **Body–body contacts.** Every outer voxel corner of one body is tested against the other body's actual voxels (not boxes). Depth and normal come from the shortest way out of the solid; corners on edges and vertices, which are about equally close to 2–3 faces, take the face that agrees with the unambiguous contacts; corners are inset by 0.004 so an outline-aligned corner counts the same on every side. Bodies joined by an attachment point don't collide with each other.
- **Contacts solved together.** Floor and body–body contacts go into one solve (16 sweeps). Each contact patch is reduced to a 4-point manifold (deepest, farthest, largest area): the same support polygon, much less rocking. A body standing on the floor isn't pushed into it by the one above. Bodies sleep on any stable support. (Warm starting was tried and made stacks bounce with this solver; it's off, bookkeeping kept.)
- **Placement convention** shared with Studio and Dice: instance position = the model's bottom-centre pivot; one transform places every body of an instance. Studio scenes load as authored (no more +35 lift); rotated multi-body models no longer come apart.
- **Terrain** from `.sost` is a static stone body (new material 14 `stone`). Static bodies are supported generally.
- **Loads `.soan`** (parametric: re-simulated; baked: played back) and **`.soga` v0.3** (writes it too: instances, environment, floor, exact orientation matrices and sleep counters, so a saved game resumes bit for bit). Gravity and floor height can come from the file.
- **Hinge limits** (`limit_deg`) enforced from the bind pose, splitting the correction by inertia; hinge axes are now turned with the model (v0.4 used them as world axes).
- **Cartridges.** EXPORT CARTRIDGE writes one HTML file: the engine's own page plus the `.soga`, booting into player mode. Body properties are summed in grid-scan order so every tool computes bit-identical mass, centre of mass and inertia.
- Dice demo throws the dice into each other. Old AABB pair resolver removed.

Measured: 16/16 dropped dice land flat; a die stays stacked up to ~2.5 voxels of overhang (falls at 2.8; tips at 3.0 in principle); head-on hits conserve momentum exactly; a ±30° hinge on a rotated model stops at 30.0°; 0.13 ms per tick for two dice, 0.8 ms for two 24³ blocks.

### Slice and Dice v0.4
- Synced to the Engine v0.5 core (copied verbatim) including body–body contacts, stone and terrain. Same throw, same result as the Engine to 4·10⁻¹⁶ voxels, collisions included; through a `.soan` file the Engine reproduces Dice's bake exactly.

### SliceWorks Player v0.1
- The blank console (`sliceworks-player-v0.1.html`, built by `tools/build-player.mjs`): plays a `.soga`. First cartridge: `cartridges/two-dice.html`.

### Docs and tests
- `docs/formats.md`: placement, units, `.soan` v0.4, `.soga` v0.3, cartridges.
- `tests/physics.mjs` (9 checks) and `tests/pipeline.mjs` (8 checks), all passing.

---

## 2026-10-12 · Suite home · Kehai Interim

This repo is now the home of the whole Slice Suite: Slice of Life v0.3, Slice Studio v0.3, Slice and Dice v0.2 → v0.3 and SliceWorks Engine v0.3.2 → v0.4, plus the specs and handoff notes in `docs/`. `index.html` is a launcher for all four.

### SliceWorks Engine v0.4: contact physics
Measured on v0.3.2: of 16 dice dropped in the dice demo, **0** came to rest flat (they froze 6–43° tilted, balanced on edges and corners). Nothing turned a collision into torque; spin was free rotation that decayed 8% per tick, so the landing face came from the starting spin. The moment of inertia was computed and never used.
- Orientation is a rotation matrix integrated with world angular velocity. Euler angles in `b.rot` are derived from it every tick in `rotVec`'s convention (round trip exact to 7·10⁻¹⁶), so the renderer, joints and `.soga` export are unchanged. Writes to `b.rot` (the fixed joint) are picked up automatically.
- Full inertia tensor per body about the true centre of mass (voxel centres).
- Floor contact at the outer voxel corners: sequential impulses with material restitution and Coulomb friction. Contacts are solved in a fixed order so results are reproducible across tools.
- Floor plane at y = 0, where the grid is drawn (rigid bodies used to rest 0.5 above it).
- Bodies sleep only on a stable support (3+ contacts not in a line).
- Angular damping 0.92 → 0.995 per tick (0.92 stopped any tumble within a few frames).
- Fixed 60 Hz physics step: no more double speed on 120 Hz displays.
- AABBs are built from the rotated corners.
- Result: 16/16 dice land flat (max tilt 0.3°); a die placed just past balance on an edge tips onto a face; 60 random throws turned up all six faces; gas and jelly demos unchanged.

### Slice and Dice v0.3: the Engine's physics
v0.2 previewed with its own physics: bodies were spheres, gravity was −9.8/s² against the Engine's ≈100.8, and the response curves were in other units, so a throw authored in Dice played out differently in the Engine.
- The preview now runs the Engine v0.4 rigid-body core, copied verbatim (materials, curves, lookup tables, rotation, inertia, contact solver). Same throw, same result: identical to 4·10⁻¹³ voxels after 300 frames.
- UI units are per second (vox/s, rad/s, vox/s²); gravity defaults to the Engine's −100.8. `.soan` v0.3 records the units and the core.
- Static tracks are immovable in collisions.

### Tests
`tests/physics.mjs` (Playwright): dice land flat, edge tipping, Dice/Engine agreement.

---

## v0.2 — 2026-06-13

A significant release. The 3D preview becomes a real volumetric renderer, the material system becomes editable, and the export pipeline becomes scene-aware.

### Added

**3D preview — WebGL2 DDA ray caster**  
True volumetric rendering using the Amanatides & Woo DDA algorithm. Voxel data is uploaded as a `TEXTURE_3D` (R8 format) and traversed in the fragment shader with `texelFetch` — no polygon generation at any stage. Two-light Lambertian shading with correct face normals and gamma correction. Canvas 2D isometric renderer retained as automatic fallback if WebGL2 is unavailable.

**Full spherical camera rotation**  
Horizontal drag rotates around Y axis (rotY). Vertical drag rotates around X axis (rotX), clamped to ±89° to prevent gimbal flip. Camera is a proper spherical coordinate system: `camFrom = normalize(sin(rotY)·cos(rotX), sin(rotX), cos(rotY)·cos(rotX))`.

**Ghost slice (onion skin)**  
The slice immediately below the current one renders at ~22% opacity in the slice editor. Significantly improves shape consistency across Z depth. Only renders for slices above Z=0.

**Material editor**  
Click a material's color swatch to recolor via native color picker. Click a material's name to rename inline. Changes persist to `.soli` on export.

**Z-map strip**  
Thin visual bar below the Z slider showing all slice states at a glance: teal = current, amber = has content, dark = empty.

**Model naming**  
Text input in the header. Name is slugified into the export filename (`metal pipe with water` → `metal-pipe-with-water.soli`) and embedded in the `.soli` JSON. Restored on import.

**RESIZE — nearest-neighbor resample**  
Set new X/Y/Z dimensions in the header inputs and click RESIZE. Existing geometry scales to the new resolution using nearest-neighbor sampling. Non-destructive: geometry comes with you. Downsampling warns before proceeding. Enables the sketch-at-32→refine-at-64 workflow. Higher starting resolution is also supported — just set dimensions before NEW.

**+8Z — extend slices**  
Button in the Z-nav adds 8 empty Z slices to the top of the model per click (max 128). Existing geometry is untouched. The Z slider and Z-map extend automatically.

**Density-weighted center of mass centering on export**  
On export, computes the center of mass of all non-empty voxels, weighted by material density. Shifts the voxel data so the center of mass lands at the grid center before writing the `.soli` file. Non-destructive to the edit state. A metal-heavy base with a gas-heavy top centers closer to the base — physically correct. The offset is recorded in `center_offset` in the `.soli` JSON for tools that need the original positioning.

### Fixed

- **Layout propagation** — `min-height: 0` on all flex children. Previously the slice canvas could disappear behind a gap on some viewport heights.
- **Canvas centering** — absolute-positioned canvases now use `top:50%;left:50%;transform:translate(-50%,-50%)` explicitly.
- **3D preview sizing** — canvas reads `offsetWidth`/`offsetHeight` after layout rather than assuming fixed dimensions.
- **WebGL ray direction** — `rayDir = -camDir` pointed rays away from the scene. Fixed to `rayDir = camDir`.
- **WebGL up vector** — `cross(right, -camDir)` produced a downward-pointing up vector. Fixed to `cross(right, camDir)`.
- **WebGL scale formula** — factor-of-2 error in both dimensions. Correct derivation: `scale ≥ ext_r/aspect` (horizontal) and `scale ≥ ext_u` (vertical), where extents are the grid projected onto camera basis vectors. Now adapts correctly to narrow or wide canvases.
- **Slice indicator artifacts** — removed a ray–plane intersection slice indicator that produced vertical stripe artifacts from incorrect grid sampling on a constant-Z plane.
- **Export MIME type** — changed from `application/json` to `application/octet-stream`. Prevents Android from appending `.json` to the filename.

### `.soli` format additions (v0.1 compatible)
- `name` field — model name string
- `center_offset` field — `{x, y, z}` integer offsets applied at export time

---

## v0.1 — 2026-06-13

### Initial release

- Slice-by-slice voxel editor (XY plane, step through Z axis)
- Seven drawing tools: draw, erase, rect, circle, ellipse, line, flood fill
- Freehand draw with Bresenham interpolation (no gaps on fast strokes)
- Shape tools with live ghost preview on drag, commit on release
- Brush size 1–16, keyboard shortcuts `[` `]`
- Configurable resolution (4–128 per axis, default 32×32×32)
- Undo/redo — snapshot-based, 50 steps
- Eight density-coded materials with density and elasticity values
- Z slider navigation with prev/next buttons; keyboard `↑↓` / `,.`
- Canvas 2D isometric 3D preview with Y-axis rotation and scroll zoom
- `.soli` export and import
- Responsive canvas sizing via ResizeObserver
- Full keyboard shortcut set
- Xinu-compliant: single HTML file, zero dependencies, MIT license
