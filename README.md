# Slice Suite

**ConsciousNode SoftWorks** · voxel modeling, scenes, animation and physics in a browser tab.

**[→ Open the suite](https://consciousnode.github.io/Slice-of-Life/)**

> *You don't animate dice. You build dice, then you let go.*

Most 3D tools model a hollow shell and then bolt an invisible physics proxy onto it. The Slice Suite builds the other way round. A model is a solid block of voxels, and every voxel is a real material with a density and a bounciness. So a model is already a physics object: the engine reads what it's made of and simulates that. Bodies aren't declared, they're *found* (connected voxels of rigid material). Where structure can't be inferred from material alone, like whether two bones meet at a hinge or a ball joint, you author it.

Every tool is a single HTML file. No install, no server, no dependencies, works offline. The Xinu philosophy: the constraint is the source of the invention.

## The pipeline

```
Slice of Life  →  Slice Studio  →  Slice and Dice  →  SliceWorks Engine  →  SliceWorks Player
    .soli            .sost             .soan               .soga                cartridge (.html)
    model            scene             animation           game / runtime       the console
```

| Tool | File | What it does | Lead |
|---|---|---|---|
| **Slice of Life** | `slice-of-life-v0.3.html` | Volumetric modeler. Build slice by slice like a 3D printer, with real materials and authored joints (fixed, hinge, ball). WebGL2 ray-cast preview. | Kehai Interim |
| **Slice Studio** | `slice-studio-v0.3.html` | Scene composer. Place models, draw terrain, room presets, free-fly camera. | Komorebi |
| **Slice and Dice** | `slice-and-dice-v0.4.html` | Animation studio. Set a throw (position, spin, velocity), preview it with the Engine's own physics, export `.soan` (parametric or baked). | Vael Interim |
| **SliceWorks Engine** | `sliceworks-engine-v0.5.html` | Physics and runtime. Rigid bodies with voxel contact physics, soft bodies, gas, fracture, joints with limits, terrain. Loads `.soli`, `.sost`, `.soan`, `.soga`; exports `.soga` and cartridges. | Ed Interim |
| **SliceWorks Player** | `sliceworks-player-v0.1.html` | The console. Plays a `.soga`, or boots straight into a cartridge. Try [`cartridges/two-dice.html`](cartridges/two-dice.html). | — |

Older versions stay in the repo next to the current ones.

## The goal

A fifth platform: a console. **It exists now, as v0.1.** The Engine can export a *cartridge*: one HTML file holding the whole engine plus your scene, which boots straight into it with nothing but PLAY, RESET and the camera. The `.soga` is the ROM; the HTML is the console. Model it, stage it, throw it, ship it, all in a browser. Next: input, so cartridges can be games and not only scenes.

## What's new (2026-10-12)

**Morning: the dice land on a face.** Engine v0.4 added real floor contact physics (rotation matrices, inertia tensors, impulses at the touching voxel corners). Dropped dice went from 0/16 landing flat to 16/16.

**Then the rest of the pipeline:**
- **Engine v0.5: bodies hit each other properly.** Voxel-accurate body–body contacts: dice clatter and spin off each other, stack (a die stays on another up to ~2.5 voxels of overhang), and conserve momentum. All contacts are solved together, with 4-point contact manifolds.
- **One placement convention for all tools.** Studio scenes now load into the Engine exactly as authored (they used to arrive shifted and lifted 35 voxels up), and rotated multi-body models stay in one piece.
- **Studio terrain is solid ground** (static stone), in the Engine and in Dice.
- **The Engine loads `.soan` and `.soga`.** A parametric `.soan` from Dice replays to *exactly* Dice's result (bit for bit, through the files); a baked one plays back as recorded; a `.soga` resumes a saved game bit for bit.
- **Hinge limits** (`limit_deg`) are enforced, measured from the authored pose, and hinge axes follow the model when it's rotated.
- **SliceWorks Player v0.1 and cartridges.** See above.

Formats and conventions: [docs/formats.md](docs/formats.md). Details in [CHANGELOG.md](CHANGELOG.md).

## Tests

```bash
npm i playwright        # once
node tests/physics.mjs   # dice land flat · tipping · stacking · momentum · hinge limits · Dice = Engine
node tests/pipeline.mjs  # .sost + terrain · .soan (parametric, baked) · .soga resume · cartridges
```

## Docs

- [Formats, units and the placement convention](docs/formats.md)
- [Slice of Life user guide and `.soli` format](docs/slice-of-life.md)
- [SliceWorks Engine spec v0.1](docs/sliceworks-engine-spec-v0.1.md)
- [Slice and Dice spec v0.1](docs/slice-and-dice-spec-v0.1.md)
- [Slice Studio v0.3 → Dice handoff (`.sost` v0.3)](docs/slice-studio-v0.3-handoff.md)
- [Goals and roadmap](GOALS.md)

## Credits

**Kham** (Khamerron Ramsey Kizer): concept, vision, direction
**Kehai Interim**: Slice of Life, voxel format and renderer; Engine v0.4–v0.5 contact physics, imports, cartridges and the Player; Dice v0.3–v0.4 core
**Komorebi**: Slice Studio, `.sost` format; Engine bug-fix pass
**Vael Interim**: Slice and Dice
**Ed Interim**: SliceWorks Engine

MIT License · ConsciousNode SoftWorks · 2026
