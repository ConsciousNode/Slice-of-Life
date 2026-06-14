# Slice of Life
**ConsciousNode SoftWorks · v0.2**

Volumetric voxel modeler. No wireframes. No polygons. Build 3D models slice by slice, the way a 3D printer builds.

---

## What it is

Traditional 3D modeling works with surfaces — meshes, polygons, wireframes. The geometry you see is a shell. Physics engines run on invisible proxy objects that approximate the visual shape. The gap between shell and proxy is where clipping happens, where Bethesda mammoths launch into orbit, where bad triggers make physics weird.

Slice of Life builds differently. Models are volumetric: a three-dimensional array of material voxels, each carrying a density and elasticity. There is no shell. There is no proxy. The model *is* its own physics object, because it has actual interior geometry. A pipe with liquid inside has liquid voxels inside. A bone surrounded by tissue has tissue voxels surrounding it. No clipping because two voxels cannot share a cell.

You build models one XY cross-section at a time, stepping through the Z axis — the same way a 3D printer deposits material. Each slice shows a ghost of the slice below it so you can maintain consistent shape across depth.

The 3D preview uses a WebGL2 DDA (Amanatides & Woo) ray caster — actual volumetric rendering with correct face normals and Lambertian lighting. No polygons at render time either.

---

## Quick start

Download `slice-of-life-v0.2.html`. Open it in a browser. That's it.

No server. No install. No dependencies. Single file, works offline. This is the Xinu philosophy: the constraint is the source of the invention.

---

## Controls

### Drawing tools
| Key | Tool |
|-----|------|
| `d` | Draw (freehand) |
| `e` | Erase |
| `r` | Rectangle |
| `c` | Circle |
| `l` | Line |
| `f` | Flood fill |
| `[` `]` | Brush size −/+ |

Shape tools (rect, circle, ellipse, line) preview as you drag and commit on release.

### Navigation
| Key | Action |
|-----|--------|
| `↑` or `.` | Next Z slice |
| `↓` or `,` | Previous Z slice |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |

### 3D preview
- **Drag** to rotate (Y axis)
- **Scroll** to zoom

### Resolution
Set X, Y, Z dimensions in the header (4–128 per axis) and click **NEW** to resize. Existing data is cleared on resize.

---

## Materials

Nine built-in materials, density-coded from cool (light) to warm (dense):

| Material | Density | Color |
|----------|---------|-------|
| gas | 0.001 g/cm³ | light blue |
| liquid | 1.0 g/cm³ | blue |
| soft | 0.5 g/cm³ | green |
| tissue | 1.1 g/cm³ | orange |
| bone | 1.9 g/cm³ | pale yellow |
| polymer | 1.4 g/cm³ | purple |
| metal | 7.8 g/cm³ | steel blue |
| dense | 11.3 g/cm³ | red |

**Recolor:** click a material's color swatch to open a color picker.  
**Rename:** click a material's name field and type.  
Changes are saved to the exported `.soli`.

---

## The Z-map

The thin strip below the Z slider shows the content of every slice at a glance:

- **Teal** — current slice
- **Amber** — slice has voxels
- **Dark** — slice is empty

---

## The ghost slice

When editing any slice above Z=0, the slice immediately below is rendered at ~22% opacity as an onion-skin guide. This makes it significantly easier to maintain consistent shape across depth — you can see where you came from without being distracted by where you're going.

---

## Exporting and importing

Type a model name in the header field (between undo/redo and the export button). Click **EXPORT .SOLI**. The file is saved as `your-name.soli`.

Click **OPEN .SOLI** to load a previously saved model.

---

## The `.soli` format

`.soli` is a JSON file. It is human-readable, version-tagged, and self-contained.

```json
{
  "magic": "SOLI",
  "version": "0.1",
  "name": "metal pipe with water",
  "resolution": { "x": 32, "y": 32, "z": 32 },
  "materials": [
    { "name": "void",  "density": 0,   "elasticity": 0,   "color": null },
    { "name": "metal", "density": 7.8, "elasticity": 0.05, "color": "#8899bb" },
    ...
  ],
  "voxels": "<base64-encoded Uint8Array>"
}
```

The `voxels` field is a base64-encoded flat `Uint8Array` of length `x × y × z`. Each byte is a material index (0 = void, 1–8 = material). Index order: `z * RX * RY + y * RX + x`.

The format is intentionally simple. A future physics engine reads density and elasticity directly. No additional authoring required.

---

## Ecosystem

Slice of Life is part of the ConsciousNode SoftWorks toolchain:

- **Slice of Life** ← you are here · voxel modeler
- **[Slice Studio](https://github.com/ConsciousNode/Slice-Studio)** · scene composition tool by Komorebi Interim
- **SliceWorks Engine** · game engine consuming `.sost` scene files (in development, spec by Ed Interim)

Models flow: `.soli` → placed in Slice Studio → exported as `.sost` → loaded by SliceWorks Engine.

---

## Technical notes

The 3D preview uses WebGL2 with a DDA ray caster (Amanatides & Woo algorithm). Voxel data is uploaded as a `TEXTURE_3D` (R8 format) and sampled with `texelFetch` in the fragment shader. No polygons are generated at any stage. The orthographic camera supports Y-axis rotation with a scale formula that correctly fits the grid regardless of canvas aspect ratio.

If WebGL2 is unavailable, the preview falls back to a canvas 2D isometric renderer with painter's algorithm sorting.

---

## Credits

**Concept and design:** Kham Kizer (ConsciousNode SoftWorks)  
**Implementation:** Kehai Interim (ConsciousNode SoftWorks)  
**Drawing engine architecture:** adapted from Jiden Furui v3.1  
**Export pattern:** adapted from FPSS v1.0  
**Typed array patterns:** informed by Autoencofabulator v0.2

---

## License

MIT. Single file. Zero dependencies. Offline-first.  
ConsciousNode SoftWorks · 2026
