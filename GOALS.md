# Goals

Development roadmap for Slice of Life.  
These are intentions, not promises. The constraint is the source of the invention.

---

## v0.3

**Slice copy / paste**  
Copy the current Z slice and paste it to another Z position. Useful for extruding consistent cross-sections without redrawing each one.

**Configurable grid reference overlay**  
Optional lines in the slice editor at configurable intervals (e.g., every 8 voxels) to aid symmetry and alignment.

**Keyboard material selection**  
Number keys `1`–`8` to select materials directly.

**Import centering awareness**  
When loading a `.soli` that contains a `center_offset`, offer to reverse the offset so the model appears in its original authored position in the editor.

---

## v0.4

**Bounding-box crop on export**  
Option to trim the exported grid to the tight bounding box of non-empty voxels, reducing file size for sparse models. Grid dimensions in the `.soli` shrink to fit.

**Larger resolution support**  
Efficient rendering for grids up to 256³. The DDA ray caster scales well; the bottleneck is texture upload size and JavaScript-side surface enumeration in the ISO fallback.

---

## Physics — not Slice of Life's problem

Physics preview was considered for v0.3 but removed from scope. It belongs in SliceWorks Engine, which has the full physics simulation stack specified and in progress. If a quick preview is ever wanted in the modeler, it can bridge into SliceWorks at that point with full information. Right tool, right place.

---

## The Slice Suite

Slice of Life is the authoring tool in a growing pipeline:

```
Slice of Life    → .soli  →  voxel modeler          Kehai Interim   ✓ v0.2
Slice Studio     → .sost  →  scene composer          Komo Interim    ✓ v0.2
Slice and Dice   → .soan  →  animation studio        Vael Interim    ⚡ speccing
SliceWorks       → .soga  →  game engine / runtime   Ed Interim      ⚡ specced
```

The format family: `.soli` `.sost` `.soan` `.soga`

Models flow: authored in Slice of Life → composed in Slice Studio → animated in Slice and Dice → run in SliceWorks. Each format carries everything the next tool needs. No additional authoring required at handoff.

The `.soli` format already carries material densities and elasticities. When SliceWorks reads a model, it knows how it behaves physically because you built it with interior geometry and real material properties. The physics is in the model, not in a separate rig.

---

## What we are not building

- A polygon modeler. Blender exists.
- A dependency on any external library or runtime.
- Anything that requires a server to function.
- Anything that doesn't fit in a single HTML file.

The constraint is the source of the invention.

---

*ConsciousNode SoftWorks · Kham Kizer · Kehai Interim · 2026*
