# Slice Suite

**ConsciousNode SoftWorks** · voxel modeling, scenes, animation and physics in a browser tab.

**[→ Open the suite](https://consciousnode.github.io/Slice-of-Life/)**

> *You don't animate dice. You build dice, then you let go.*

Most 3D tools model a hollow shell and then bolt an invisible physics proxy onto it. The Slice Suite builds the other way round. A model is a solid block of voxels, and every voxel is a real material with a density and a bounciness. So a model is already a physics object: the engine reads what it's made of and simulates that. Bodies aren't declared, they're *found* (connected voxels of rigid material). Where structure can't be inferred from material alone, like whether two bones meet at a hinge or a ball joint, you author it.

Every tool is a single HTML file. No install, no server, no dependencies, works offline. The Xinu philosophy: the constraint is the source of the invention.

## The pipeline

```
Slice of Life  →  Slice Studio  →  Slice and Dice  →  SliceWorks Engine  →  (future) the console
    .soli            .sost             .soan               .soga
    model            scene             animation           game / runtime
```

| Tool | File | What it does | Lead |
|---|---|---|---|
| **Slice of Life** | `slice-of-life-v0.3.html` | Volumetric modeler. Build slice by slice like a 3D printer, with real materials and authored joints (fixed, hinge, ball). WebGL2 ray-cast preview. | Kehai Interim |
| **Slice Studio** | `slice-studio-v0.3.html` | Scene composer. Place models, draw terrain, room presets, free-fly camera. | Komorebi |
| **Slice and Dice** | `slice-and-dice-v0.3.html` | Animation studio. Set a throw (position, spin, velocity), preview it with the Engine's own physics, export `.soan` (parametric or baked). | Vael Interim |
| **SliceWorks Engine** | `sliceworks-engine-v0.4.html` | Physics and runtime. Rigid bodies with contact physics, soft bodies, gas, fracture, joints. Exports `.soga`. | Ed Interim |

Older versions stay in the repo next to the current ones.

## The goal

A fifth platform: a standalone player that loads a `.soga` file the way a console loads a cartridge. The whole engine in one HTML file, the scene pre-baked. The `.soga` is the ROM, the HTML is the console. Model it, stage it, throw it, ship it, all in a browser.

## What's new (2026-10-12)

**The dice land on a face now.** In Engine v0.3.2, 0 of 16 dropped dice came to rest flat; they froze tilted on edges and corners, because nothing turned a collision into torque. Engine v0.4 adds real contact physics: rotation matrices, a full inertia tensor per body, and impulses at the touching voxel corners with restitution and friction from the material tables. A die on its edge now tips onto a face by itself, and which face comes up is decided by the physics. In a 60-die test all six faces turned up.

**One physics core.** Slice and Dice used to run its own physics (spheres, gravity about 10× weaker, different units), so a throw authored there played out differently in the Engine. Dice v0.3 runs the Engine's core, and the same throw ends in the same place to within 10⁻¹² voxels.

Details in [CHANGELOG.md](CHANGELOG.md).

## Tests

```bash
npm i playwright        # once
node tests/physics.mjs  # dice land flat · edge tipping · Dice and Engine agree
```

## Docs

- [Slice of Life user guide and `.soli` format](docs/slice-of-life.md)
- [SliceWorks Engine spec v0.1](docs/sliceworks-engine-spec-v0.1.md)
- [Slice and Dice spec v0.1](docs/slice-and-dice-spec-v0.1.md)
- [Slice Studio v0.3 → Dice handoff (`.sost` v0.3)](docs/slice-studio-v0.3-handoff.md)
- [Goals and roadmap](GOALS.md)

## Credits

**Kham** (Khamerron Ramsey Kizer): concept, vision, direction
**Kehai Interim**: Slice of Life, voxel format and renderer; Engine v0.4 contact physics; Dice v0.3 core
**Komorebi**: Slice Studio, `.sost` format; Engine bug-fix pass
**Vael Interim**: Slice and Dice
**Ed Interim**: SliceWorks Engine

MIT License · ConsciousNode SoftWorks · 2026
