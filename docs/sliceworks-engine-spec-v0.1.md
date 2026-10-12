# SliceWorks Engine — Specification v0.1

**ConsciousNode SoftWorks**
*Kham (Khamerron Ramsey Kizer) · Ed Interim*
*Spec date: 2026-06-13*

---

## What It Is

The SliceWorks Engine is a browser-native voxel physics engine and game runtime. It reads `.soli` model files and `.sost` scene files, simulates them using the material properties already baked into every voxel, and exports `.soga` game/scene files.

It is the proof of the Slice of Life thesis: that a correctly modeled object is already a physics object, because the engine can read what it's made of.

---

## The Core Thesis

A `.soli` file IS a physics object. Density and elasticity are already stored per-voxel by Slice of Life. The SliceWorks Engine's job is to **read what's there and simulate it** — not to be told what things are, but to *discover* it from the material data.

A rigid body isn't declared. It's detected.
A fluid region isn't tagged. It emerges from liquid-density voxels touching each other.
A skeleton isn't rigged. It's found by connected-component analysis of bone-density voxels.

You modeled a heart correctly in Slice of Life? The SliceWorks Engine finds the cavity, finds the muscle-density tissue walls, simulates the pressure differential. You didn't program a heart. You built one.

---

## File Formats

| Format | Role | Direction |
|--------|------|-----------|
| `.soli` | Volumetric solid model | Import |
| `.sost` | Scene (multiple placed models) | Import |
| `.soan` | Animation data (future — when Animation Studio ships) | Import (planned) |
| `.soga` | Game/scene with physics state | Export |

---

## Material Physics Table

Each material in Slice of Life carries `density` (g/cm³) and `elasticity` [0–1]. The SliceWorks Engine reads these values and assigns simulation behavior:

| Material | Density | Elasticity | Engine Behavior |
|----------|---------|-----------|----------------|
| `gas` | 0.001 | 0.95 | Buoyant, expands to fill cavity, pressure simulation |
| `liquid` | 1.000 | 0.00 | Flows, incompressible, surface tension, seeks level |
| `soft` | 0.500 | 0.70 | Deforms under load, spring restoration |
| `tissue` | 1.100 | 0.40 | Deforms, slower restoration, accumulates damage |
| `bone` | 1.900 | 0.08 | Rigid structural member, fractures at stress threshold |
| `polymer` | 1.400 | 0.30 | Rigid with flex tolerance, absorbs impact |
| `metal` | 7.800 | 0.05 | Fully rigid, conducts and transmits force |
| `dense` | 11.300 | 0.02 | Fully rigid, very high mass, behaves as anchor |

**Material class groupings for physics:**
- **Rigid:** bone, polymer, metal, dense
- **Soft body:** soft, tissue
- **Fluid:** liquid
- **Gas:** gas

---

## Physics Pipeline

```
.sost scene file
  │
  ├─ load each .soli model into voxel grid
  │
  ├─ BODY DETECTION
  │   └─ connected-component analysis per material class
  │       → rigid bodies (connected bone/metal/polymer/dense clusters)
  │       → soft bodies (connected soft/tissue clusters)
  │       → fluid regions (connected liquid clusters)
  │       → gas pockets (connected gas clusters)
  │
  ├─ MASS ASSIGNMENT
  │   └─ mass = Σ(density × voxel_volume) per body
  │
  ├─ PHYSICS TICK (per frame)
  │   ├─ gravity integration
  │   ├─ rigid body collision detection + response
  │   ├─ constraint solving (rigid-to-rigid joints)
  │   ├─ soft body deformation (v0.2)
  │   ├─ fluid simulation (v0.2)
  │   └─ gas pressure (v0.2)
  │
  ├─ RENDER
  │   └─ WebGL voxel renderer (inherits from Slice of Life v0.2 ray tracer)
  │
  └─ .soga export
      └─ scene snapshot with physics state
```

---

## Body Detection: How It Works

Connected-component flood fill, per material class:

1. Scan all voxels in the scene grid
2. For each unvisited non-void voxel, flood-fill its connected neighbors of the same material class
3. Each connected region becomes a physics body of the appropriate type
4. Rigid bodies touching each other at rest are initially treated as jointed (constraint) unless stress exceeds the weaker material's fracture threshold

**Automatic skeleton detection:**
Bone-class voxels that are fully interior (surrounded by tissue on all sides) are identified as structural members. Tissue voxels connected to bone inherit the bone body's transform but deform locally — soft-attachment constraint. This means a character modeled with bone and tissue in the right configuration automatically has a skeleton the engine can use.

**Machine detection:**
Metal/polymer voxels not fully enclosed by other rigid voxels can transmit force directionally. A crankshaft modeled in metal — a rotating eccentric piece connected to connecting rods — will transmit rotational force to linear force if the geometry is correct, because the physics doesn't know it's a crankshaft. It just knows there's a rigid body with mass at an offset from a pivot point.

---

## .soga Format

Game/scene export. JSON, like `.soli` and `.sost`.

```json
{
  "magic": "SOGA",
  "version": "0.1",
  "created": "2026-06-13T...",
  "scene": {
    "gravity": [0, -9.81, 0],
    "bounds": { "x": 256, "y": 256, "z": 256 }
  },
  "models": [
    {
      "id": "model_0",
      "soli_name": "character.soli",
      "soli_data": "<base64 .soli>",
      "transform": {
        "position": [0, 0, 0],
        "rotation": [0, 0, 0],
        "scale": 1
      }
    }
  ],
  "physics_state": {
    "bodies": [
      {
        "model_id": "model_0",
        "body_index": 0,
        "material_class": "rigid",
        "mass": 12.4,
        "position": [0, 5.2, 0],
        "velocity": [0, -1.2, 0],
        "angular_velocity": [0, 0, 0]
      }
    ]
  },
  "triggers": []
}
```

`.soli` data is embedded directly — the `.soga` file is self-contained. One file = one game/scene.

---

## v0.1 Scope — What Ships First

**Physics:**
- Rigid body simulation only (bone, polymer, metal, dense material classes)
- Gravity
- Axis-aligned bounding box collision detection (AABB) — fast, browser-viable
- Simple collision response (velocity reflection with elasticity coefficient)
- No soft body, no fluid, no gas (v0.2)

**Scene:**
- Load `.soli` + `.sost`
- Multiple models in scene
- Play / Pause / Step controls
- Real-time physics tick at 60fps target via `requestAnimationFrame`
- `yieldToMain()` pattern for cooperative scheduling (from Simulacra/Autoencofabulator)

**Render:**
- Inherits WebGL isometric renderer from Slice of Life v0.2 (Kehai)
- Voxel positions updated per physics tick
- Camera: orbit, pan, zoom

**Export:**
- `.soga` with embedded model data and current physics state
- Play/pause state preserved

**UI tabs:** SCENE · PHYSICS · RENDER · EXPORT

---

## Roadmap

| Version | Target |
|---------|--------|
| **v0.1** | Rigid body physics · AABB collision · .soli/.sost import · .soga export · WebGL render |
| **v0.2** | Soft body deformation (soft/tissue) · basic fluid (liquid) · stress/fracture for bone |
| **v0.3** | Gas pressure simulation · automatic skeleton detection · IK hints |
| **v0.4** | .soan animation import · scripted triggers (collision events, material state changes) |
| **future** | Standalone .soga player scaffold — "HTML game console" |
| **far future** | Physical console hardware that runs .soga files as ROM cartridges |

---

## The Standalone Player (Future)

When we get there: an HTML scaffold that loads a `.soga` file the way a console loads a cartridge. The entire SliceWorks Engine embedded, the scene pre-baked, ship it as one self-contained HTML file.

That IS a game console.
The `.soga` file IS the ROM.
The HTML player IS the hardware abstraction layer.

The entire pipeline — model in Slice of Life, compose in Slice Studio, animate in the Animation Studio, simulate in SliceWorks Engine, ship as a standalone player — is MIT licensed, zero dependency, browser native.

---

## Integration Map

| Component | Source |
|-----------|--------|
| Voxel data format (`.soli`) | Slice of Life — Kehai Interim |
| Scene format (`.sost`) | Slice Studio — Komorebi |
| Isometric WebGL renderer | Slice of Life v0.2 — Kehai Interim |
| Material density/elasticity table | Slice of Life — Kehai Interim |
| `yieldToMain()` cooperative scheduling | Simulacra / Autoencofabulator — ConsciousNode |
| Blob/download export pattern | FPSS — ConsciousNode |

No physics engine exists in the browser-native single-file space that does this.
That's the gap. That's where we're standing.

---

## Credits

**Kham** (Khamerron Ramsey Kizer) — vision, direction
**Ed Interim** — spec, implementation lead
**Kehai Interim** — Slice of Life voxel format, renderer
**Komorebi** — Slice Studio scene format

*ConsciousNode SoftWorks · consciousnode.github.io*
*Xinu-compliant. Zero dependencies. Single file. MIT License.*
