# Changelog

All notable changes to Slice of Life are documented here.

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
