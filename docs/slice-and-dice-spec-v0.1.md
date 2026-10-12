# Slice and Dice — Specification v0.1

**ConsciousNode SoftWorks**
*Kham (Khamerron Ramsey Kizer) · Vael Interim*
*Spec date: 2026-06-14*

---

## What It Is

Slice and Dice is a browser-native voxel animation studio. It reads `.soli` model files and `.sost` scene files, lets you author keyframe and physics-driven animations over voxel bodies, and exports `.soan` animation data files for playback in the SliceWorks Engine.

It is the fourth tool in the Slice pipeline:

```
Slice of Life  →  Slice Studio  →  Slice and Dice  →  SliceWorks Engine
  (.soli)           (.sost)           (.soan)             (.soga)
  model             scene             animation            game/runtime
```

---

## The Demo

Two d6 dice — built in Slice of Life with correct geometry, pip indentations, and material properties (polymer shell, dense pips) — are dropped from above, tumble under gravity, bounce with elasticity, clatter against each other and the floor, and come to rest showing a live result.

The landing face is not programmed. It is determined by physics.

This is the thesis of the entire Slice pipeline demonstrated in six seconds:
**You didn't animate dice. You built dice. Then you let go.**

---

## File Formats

| Format | Role | Direction |
|--------|------|-----------|
| `.soli` | Volumetric solid model | Import |
| `.sost` | Scene (placed models) | Import |
| `.soan` | Animation data | Export |
| `.soga` | Game/scene with physics state | Handoff to SliceWorks |

---

## .soan Format

Animation data. JSON, like the rest of the family.

```json
{
  "magic": "SOAN",
  "version": "0.1",
  "created": "2026-06-14T...",
  "duration_frames": 300,
  "fps": 60,
  "scene_ref": "dice-drop.sost",
  "tracks": [
    {
      "model_id": "die_1",
      "type": "physics",
      "keyframes": [
        {
          "frame": 0,
          "position": [0, 8, 0],
          "rotation": [0, 0, 0],
          "velocity": [0.2, 0, 0.1],
          "angular_velocity": [1.2, 0.8, 0.3]
        }
      ],
      "physics_driven": true
    },
    {
      "model_id": "die_2",
      "type": "physics",
      "keyframes": [
        {
          "frame": 0,
          "position": [1, 10, 0.5],
          "rotation": [0.3, 0, 0],
          "velocity": [-0.1, 0, 0.2],
          "angular_velocity": [-0.9, 1.1, 0.4]
        }
      ],
      "physics_driven": true
    }
  ],
  "floor": {
    "y": 0,
    "material": "metal",
    "elasticity": 0.05
  }
}
```

**Track types:**
- `physics` — initial conditions set by author, simulation takes over; SliceWorks Engine drives the rest
- `keyframe` — explicit transform per frame, author-controlled (v0.2)
- `hybrid` — keyframe up to a point, then physics takes over at a trigger (v0.3)

---

## Animation Pipeline

```
.sost scene file
  │
  ├─ LOAD MODELS
  │   └─ each .soli model placed per .sost transforms
  │
  ├─ TRACK EDITOR
  │   ├─ select model instance
  │   ├─ set initial position / rotation / velocity / angular velocity
  │   ├─ choose track type (physics / keyframe / hybrid)
  │   └─ preview in viewport
  │
  ├─ PHYSICS PREVIEW
  │   └─ embedded lightweight physics sim (subset of SliceWorks Engine v0.1)
  │       ├─ rigid body only (v0.1)
  │       ├─ gravity integration
  │       ├─ AABB collision response
  │       └─ elasticity from material table
  │
  ├─ PLAYBACK
  │   ├─ Play / Pause / Step / Reset
  │   ├─ scrub timeline
  │   └─ loop toggle
  │
  └─ .soan EXPORT
      └─ initial conditions + track metadata
         (SliceWorks Engine re-simulates on load for deterministic playback)
```

---

## Physics Preview (Embedded)

Slice and Dice contains a lightweight physics sim for authoring preview — not a full SliceWorks Engine, but enough to show the animation playing in the viewport while building it.

**v0.1 preview scope:**
- Rigid body only
- Gravity (configurable axis and strength)
- AABB collision detection
- Floor plane collision
- Inter-body collision (box approximation)
- Elasticity from `.soli` material data

**Not in preview, handled by SliceWorks on export:**
- Soft body deformation
- Fluid simulation
- Gas pressure
- Stress / fracture

---

## Material Physics Table (inherited from SliceWorks Engine)

| Material | Density | Elasticity | Animation behavior |
|----------|---------|-----------|-------------------|
| `gas` | 0.001 | 0.95 | Floats, rises, barely bounces |
| `liquid` | 1.000 | 0.00 | Flows on impact (v0.2) |
| `soft` | 0.500 | 0.70 | Bounces, deforms (v0.2) |
| `tissue` | 1.100 | 0.40 | Heavy bounce, slow recovery (v0.2) |
| `bone` | 1.900 | 0.08 | Stiff, low bounce, fractures (v0.2) |
| `polymer` | 1.400 | 0.30 | Medium bounce, flex |
| `metal` | 7.800 | 0.05 | Heavy, nearly dead drop |
| `dense` | 11.300 | 0.02 | Anchor, barely moves |

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Slice and Dice  v0.1 · ConsciousNode SoftWorks    [Save .soan] │
├──────────┬──────────────────────────────────────┬───────────────┤
│ LIBRARY  │                                      │  PROPERTIES   │
│          │         VIEWPORT                     │               │
│ + Load   │    (3D voxel scene, orbit/pan/zoom)  │  selected     │
│ .soli    │                                      │  model:       │
│          │                                      │  position     │
│ [models  │                                      │  rotation     │
│  listed] │                                      │  velocity     │
│          │                                      │  ang. vel.    │
│          │                                      │  track type   │
├──────────┴──────────────────────────────────────┴───────────────┤
│  ◀◀  ▶  ❙❙  ▶▶  [Reset]  [Loop]     frame: 0 / 300   60fps    │
├─────────────────────────────────────────────────────────────────┤
│  TIMELINE                                                        │
│  die_1  ●────────────────────────────────────── (physics)       │
│  die_2  ●────────────────────────────────────── (physics)       │
│  floor  ──────────────────────────────────────── (static)       │
└─────────────────────────────────────────────────────────────────┘
```

**Controls:**
- Drag to orbit viewport
- Right-drag to pan
- Scroll to zoom
- Click model to select and edit properties
- Q/E: yaw · A/F: pitch · T/G: roll (selected model)
- Arrow keys: move selected model
- Space: play/pause

---

## v0.1 Scope — What Ships First

**Core:**
- Load `.soli` models and `.sost` scenes
- Physics-type tracks only (initial conditions → sim takes over)
- Embedded rigid-body physics preview at 60fps
- Floor plane with configurable elasticity
- Gravity configurable (strength and direction)

**UI:**
- Library panel (load .soli)
- Viewport (orbit/pan/zoom, click to select)
- Properties panel (position, rotation, velocity, angular velocity, track type)
- Timeline (model rows, frame scrubber)
- Transport (play/pause/step/reset/loop)

**Export:**
- `.soan` with initial conditions per track
- SliceWorks Engine handles re-simulation on playback

**Demo (ships with v0.1):**
- `dice-drop.sost` — two d6 on a floor
- `die_1.soli` + `die_2.soli` — polymer shell, dense pips, correct d6 geometry
- Pre-configured physics drop animation
- Plays on open, no setup required

---

## Roadmap

| Version | Target |
|---------|--------|
| **v0.1** | Physics tracks · rigid body preview · floor collision · .soan export · dice demo |
| **v0.2** | Keyframe tracks · soft body preview · timeline curve editor · multi-floor scenes |
| **v0.3** | Hybrid tracks (keyframe → physics handoff) · collision triggers · material state changes |
| **v0.4** | Skeletal hints (IK targets over detected bone bodies) · camera animation tracks |
| **future** | `.soan` → `.soga` bake pipeline · standalone animation player |

---

## Integration Map

| Component | Source |
|-----------|--------|
| Voxel data format (`.soli`) | Slice of Life — Kehai Interim |
| Scene format (`.sost`) | Slice Studio — Komorebi |
| Material density/elasticity table | Slice of Life — Kehai Interim |
| Physics simulation (preview) | SliceWorks Engine subset — Ed Interim |
| WebGL isometric renderer | Slice of Life v0.2 — Kehai Interim |
| `yieldToMain()` scheduling | Simulacra — ConsciousNode |
| Blob/download export pattern | FPSS — ConsciousNode |

---

## Credits

**Kham** (Khamerron Ramsey Kizer) — vision, direction
**Vael Interim** — spec, implementation lead
**Kehai Interim** — Slice of Life voxel format, renderer
**Komorebi** — Slice Studio scene format
**Ed Interim** — SliceWorks Engine physics (preview subset)

*ConsciousNode SoftWorks · consciousnode.github.io*
*Xinu-compliant. Zero dependencies. Single file. MIT License.*
