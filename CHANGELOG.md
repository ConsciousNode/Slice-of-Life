# Changelog

All notable changes to Slice of Life are documented here.

---

## v0.2 — 2026-06-13

### Added
- **WebGL2 DDA ray caster** — true volumetric 3D preview. The Amanatides & Woo DDA algorithm traverses a `TEXTURE_3D` voxel grid in the fragment shader. Correct face normals, two-light Lambertian shading, gamma correction. No polygons at render time. Canvas 2D isometric falls back if WebGL2 is unavailable.
- **Ghost slice (onion skin)** — the slice immediately below the current one renders at ~22% opacity in the slice editor. Significantly improves shape consistency across Z depth.
- **Material editor** — click a material's color swatch to recolor (native color picker). Click a material's name to rename. Changes persist to `.soli` on export.
- **Z-map strip** — thin visual bar below the Z slider. Teal = current slice, amber = has content, dark = empty. At-a-glance model topology.
- **Model naming** — text field in header. Name is slugified into the export filename (`metal pipe with water` → `metal-pipe-with-water.soli`) and embedded in the `.soli` JSON. Restored on import.
- **Export MIME fix** — changed Blob type from `application/json` to `application/octet-stream`. Prevents Android from appending `.json` to the filename.

### Fixed
- **Layout propagation** — added `min-height: 0` to all flex children in the layout chain. Previously, the slice canvas was hidden behind a large gap on some viewport heights.
- **Canvas centering** — absolute-positioned canvases now use `top: 50%; left: 50%; transform: translate(-50%, -50%)` explicitly. Flex container alignment does not apply to absolutely positioned children.
- **3D preview sizing** — preview canvas now reads `offsetWidth`/`offsetHeight` after layout rather than assuming fixed dimensions.
- **WebGL ray direction** — initial implementation had `rayDir = -camDir` (rays pointing away from scene) and `up = normalize(cross(right, -camDir))` (inverted vertical axis). Both corrected.
- **WebGL scale formula** — initial formula had a factor-of-2 error in both dimensions. Correct derivation: `scale ≥ ext_r / aspect` (horizontal) and `scale ≥ ext_u` (vertical), where `ext_r` and `ext_u` are the grid extents projected onto the camera's right and up vectors respectively.
- **Slice indicator artifacts** — removed a ray–plane intersection slice indicator from the GLSL that was producing vertical stripe artifacts due to incorrect grid sampling on a constant-Z plane.

---

## v0.1 — 2026-06-13

### Initial release

- Slice-by-slice voxel editor (XY plane, step through Z)
- Seven drawing tools: draw, erase, rect, circle, ellipse, line, flood fill
- Freehand draw with Bresenham interpolation (no gaps between fast strokes)
- Shape tools with live ghost preview on drag, commit on release
- Configurable resolution (4–128 per axis, default 32×32×32)
- Undo/redo (snapshot-based, 50 steps)
- Eight material types with density and elasticity values, color-coded light→dense
- Z slider navigation with prev/next buttons; keyboard shortcuts (`↑↓` / `,.`)
- Canvas 2D isometric 3D preview with Y-axis rotation and zoom
- Slice indicator plane in 3D preview (current Z position)
- `.soli` export and import (JSON + base64 voxels)
- Responsive canvas sizing via ResizeObserver
- Full keyboard shortcut set
- Xinu-compliant: single HTML file, zero dependencies, MIT license
