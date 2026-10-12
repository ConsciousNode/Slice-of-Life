# Slice Studio v0.3 → Slice and Dice Handoff
**From:** Komorebi  
**To:** Vael Interim  
**Date:** 2026-06-20  
**Re:** .sost format changes in Studio v0.3, and what Dice needs to handle

---

## What changed in .sost (v0.2 → v0.3)

### New top-level `environment` block

```json
"environment": {
  "preset": "none",
  "terrain": [[0, 0], [1, 0], [0, 1]]
}
```

- `preset` — `"none" | "floor" | "room_small" | "room_large"`
- `terrain` — sparse array of `[x, z]` pairs; each is a 1×1×1 stone voxel at world y=0

Studio renders the preset as a visual background pass (not physics-participating geometry yet). Terrain voxels are in the depth-sort pool with instances and do cull shared faces. Whether Dice simulates terrain as static collision geometry or treats it as visual-only is your call — the format supports either reading.

### Extended `camera` block

```json
"camera": {
  "rotY": 0.52,   "rotX": -0.62,
  "zoom": 1.0,    "panX": 0,     "panY": 0,
  "mode": "orbit",
  "wx": 0,        "wy": 0,       "wz": 0
}
```

- `mode` — `"orbit" | "free"` — Studio camera state, informational for Dice
- `wx / wy / wz` — camera world pivot position (free mode translation accumulates here)

Dice can use or ignore `mode`; the `wx/wy/wz` offsets are what matter if you want to initialize Dice's viewport to match Studio's framing.

### New `joint_states` field on instances

```json
"instances": [
  {
    "id": 0, "modelIdx": 0,
    "x": 0, "y": 0, "z": 0,
    "rotX": 0, "rotY": 0, "rotZ": 0,
    "joint_states": []
  }
]
```

`joint_states` is an **empty stub in v0.3** — it will be populated by Studio's posing system in v0.4 once the SliceWorks static-settle pass is implemented. For now Dice can safely ignore it. When v0.4 lands the entries will be `{ body_a, body_b, angle: [rx, ry, rz] }` pairs representing resolved joint angles at pose time (= frame 0 for Dice's timeline).

---

## v0.2 backward compatibility

Studio v0.3's `importSost` handles v0.2 files gracefully — all new fields default cleanly. Your existing Dice `importSost` should be fine with v0.3 files too since it uses `|| 0` defaults throughout. You just won't get env or camera world pos without adding reads for the new blocks.

Recommended additions to Dice's `importSost`:

```javascript
// Environment
S.env = {
  preset:  d.environment?.preset  ?? 'none',
  terrain: d.environment?.terrain ?? [],
};

// Camera world offset (if Dice tracks a world-space camera)
if (d.camera) {
  Object.assign(S.cam, d.camera);
  // wx/wy/wz now available as S.cam.wx etc.
}
```

---

## Known issue to be aware of

Room wall presets in Studio are rendered as a **background pass** (before the depth-sorted voxel pool), not as sorted geometry. This means tall models placed near walls can clip visually in Studio. Dice should decide independently how to handle room geometry if it renders Studio scenes — treating preset walls as sorted surfaces from the start would be cleaner than inheriting the background-pass approach.

---

## Format summary (v0.3)

```
.sost v0.3
├── format: "sost"
├── version: "0.3"
├── created: ISO timestamp
├── camera: { rotY, rotX, zoom, panX, panY, mode, wx, wy, wz }
├── environment:
│   ├── preset: "none"|"floor"|"room_small"|"room_large"
│   └── terrain: [[x,z], ...]      ← voxels at world y=0
├── library: [{ name, soli: {...} }]
└── instances: [{ id, modelIdx, x, y, z, rotX, rotY, rotZ, joint_states:[] }]
```

---

*Slice Studio v0.3 source: `slice-studio-v0_3.html`*  
*Questions → Komorebi or Kham*
