# Goals

Development roadmap for Slice of Life.  
These are intentions, not promises. The constraint is the source of the invention.

---

## v0.3

### Multi-axis 3D preview rotation
Currently the preview rotates only on the Y axis (horizontal drag). Adding X-axis rotation (vertical drag) makes it possible to view models from below, above, or any elevation — important for building bottom-up or inspecting underside geometry.

The camera becomes a full spherical coordinate system:
```
camFrom = normalize(sin(rotY)*cos(rotX), sin(rotX), cos(rotY)*cos(rotX))
```

Clamp `rotX` to `[-π/2, π/2]` to prevent gimbal flip.

### Slice copy/paste
Copy the current Z slice and paste it to another Z position. Useful for building consistent cross-sections across a long extrusion without redrawing.

### Configurable grid reference
Optional overlay lines in the slice editor at configurable intervals (e.g., every 8 voxels) to help with symmetry and alignment.

### Additional keyboard shortcuts
- Number keys `1`–`8` to select materials directly
- `g` for ellipse (frees `e` for erase consistency)

---

## v0.4

### Physics preview tab
A second tab in the 3D preview panel alongside the current view tab. Clicking SIMULATE drops the model under gravity and shows it settle on a floor plane.

**Layer 1 (v0.4):** Treat the whole model as a single rigid body. Compute center of mass from voxel densities. Apply gravity. Elastic bounce on floor contact using the average surface elasticity. The density system already carries everything needed — a metal-heavy model hits differently than a gas-heavy one.

**Layer 2 (v0.5):** Connected-component flood fill finds separate rigid bodies. Parts fall independently. Face-adjacent voxels are bonded; bond strength = min(elasticity of both materials). Exceeding yield strength snaps the bond → fracture.

**Layer 3 (v0.6+):** Per-material behavior. Liquid voxels become particles. Soft/tissue voxels deform. Gas voxels provide buoyancy. A heart pumps because it has the right chamber geometry and elasticity profile — not because it was programmed to.

### Larger resolution support
Efficient rendering for grids up to 256³. The DDA ray caster scales well; the bottleneck will be texture upload and JavaScript-side surface enumeration (ISO fallback).

---

## Long-term

### Ecosystem integration
Slice of Life is the authoring tool in a larger pipeline:

```
Slice of Life  →  .soli  →  Slice Studio  →  .sost  →  SliceWorks Engine
  (modeler)                  (composer)                   (runtime)
```

The `.soli` format is designed to carry everything a physics engine needs without additional authoring. The goal is that you model the object, and the engine knows how it behaves because you built it with interior geometry and real material densities.

### `.soli` format versioning
The format is currently v0.1. Future versions may add:
- Named voxel regions (for animation rigging, physics joint hints)
- Level-of-detail hints
- Embedded thumbnail (base64 PNG of the 3D preview at export time)
- Compression (the voxel array is highly compressible; ANS coding is already in the ConsciousNode toolchain via FPSS)

### What we are not building
- A polygon modeler. If you need polygons, Blender exists.
- A dependency on any external library or runtime.
- Anything that requires a server to function.
- Anything that doesn't fit in a single HTML file.

The constraint is the source of the invention.

---

*ConsciousNode SoftWorks · Kham Kizer · Kehai Interim · 2026*
