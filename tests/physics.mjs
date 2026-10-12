// SliceWorks physics checks, run in headless Chromium on the real tool files.
//   npm i playwright   (or use a global install)   then   node tests/physics.mjs
// 1. Dice dropped in the Engine land flat on a face (v0.3.2: 0 of 16 did).
// 2. A die set down just past balance on an edge tips onto a face.
// 3. Slice and Dice bakes the same throw to the same result as the Engine.
// 5. An authored hinge stops at its limit.
// 4. A die rests stacked on another (2 voxels of overhang); a head-on hit
//    conserves momentum; two dice thrown into each other both land flat.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = 'file://' + path.join(root, 'sliceworks-engine-v0.6.html');
const DICE = 'file://' + path.join(root, 'slice-and-dice-v0.4.html');
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails++; };

const br = await chromium.launch();
const pe = await br.newPage(); const errs = []; pe.on('pageerror', e => errs.push(e.message));
await pe.goto(ENGINE); await pe.waitForTimeout(200);

const tilts = await pe.evaluate(() => {
  const tilt = b => { const R = ensureR(b); return Math.acos(Math.min(1, Math.max(Math.abs(R[3]), Math.abs(R[4]), Math.abs(R[5])))) * 180 / Math.PI; };
  const out = [];
  for (let trial = 0; trial < 8; trial++) {
    diceDemo(); S.running = false;
    S.bodies.forEach((b, i) => { b.angVel = { x: 0.05 + 0.03 * ((trial + i) % 5), y: 0.11 - 0.02 * trial, z: -0.08 + 0.025 * trial }; });
    let t = 0; while (t < 6000 && S.bodies.some(b => !b.sleeping)) { physTick(); t++; }
    for (const b of S.bodies) out.push(b.sleeping ? tilt(b) : 90);
  }
  return out;
});
check(tilts.every(t => t < 3), `16 dropped dice rest flat (max tilt ${Math.max(...tilts).toFixed(2)}°)`);

const edge = await pe.evaluate(() => {
  diceDemo(); S.running = false; S.bodies = [S.bodies[0]];
  const b = S.bodies[0]; b.rot = { x: 0, y: 0, z: 0.80 }; b.R = null; b.vel = { x: 0, y: 0, z: 0 }; b.angVel = { x: 0, y: 0, z: 0 };
  updateAABB(b); b.pos.y += -b.aabb.minY + 0.001;
  let n = 0; while (n < 3000 && !b.sleeping) { physTick(); n++; }
  const R = ensureR(b); return Math.acos(Math.max(Math.abs(R[3]), Math.abs(R[4]), Math.abs(R[5]))) * 180 / Math.PI;
});
check(edge < 3, `die on its edge tips onto a face (tilt ${edge.toFixed(2)}°)`);

const eng = await pe.evaluate(() => {
  diceDemo(); S.running = false;
  // velocities that survive the per-second ↔ per-tick conversion exactly
  // (×60 then ÷60), so any difference left is the physics, not rounding
  S.bodies[0].vel = { x: 0.15625, y: 0, z: 0.015625 }; S.bodies[1].vel = { x: -0.15625, y: 0, z: -0.015625 };
  S.bodies[0].angVel = { x: 0.125, y: 0.0625, z: 0.140625 }; S.bodies[1].angVel = { x: -0.09375, y: 0.125, z: -0.109375 };
  const init = S.bodies.map((b, i) => ({ inst: S.instances[i], com: { ...b.com }, angVel: { ...b.angVel }, vel: { ...b.vel } }));
  const raw = S.models[0].raw;
  for (let n = 0; n < 300; n++) physTick();
  const fin = S.bodies.map(b => { const R = ensureR(b); return [b.pos.x, b.pos.y, b.pos.z, ...R]; });   // centre of mass + orientation
  return { init, raw, fin };
});
const pd = await br.newPage(); pd.on('pageerror', e => errs.push(e.message));
await pd.goto(DICE); await pd.waitForTimeout(200);
const dice = await pd.evaluate(({ init, raw }) => {
  S.models = [parseSoli(JSON.stringify(raw), 'die.soli')];
  const m = S.models[0];
  // v0.5: Engine, Studio and Dice share one placement convention, so the
  // instances carry over unchanged; only velocities convert (per tick → per second)
  S.instances = init.map((d, i) => { const { inst, angVel, vel } = d;
    return { id: i, modelIdx: 0, x: inst.x, y: inst.y, z: inst.z, rotX: inst.rotX, rotY: inst.rotY, rotZ: inst.rotZ,
      vx: vel.x * 60, vy: vel.y * 60, vz: vel.z * 60, ax: angVel.x * 60, ay: angVel.y * 60, az: angVel.z * 60, trackType: 'physics', joint_states: [] }; });
  S.simDirty = true; bakeSimulation();
  // Dice records the pivot; turn it back into the centre of mass to compare
  const b0 = buildDiceBody(S.instances[0], m);
  return S.instances.map(inst => { const fs = S.baked[299][inst.id], R = eulerToMat(fs.rotX, fs.rotY, fs.rotZ), o = matVec(R, ...b0.dL);
    return [fs.x + o[0], fs.y + o[1], fs.z + o[2], ...R]; });
}, { init: eng.init, raw: eng.raw });
const diff = Math.max(...eng.fin.flatMap((a, i) => a.map((v, k) => Math.abs(v - dice[i][k]))));
// Same core, same order of operations, same placement and the same sums in the
// same order: the two tools agree bit for bit, collisions included.
check(diff < 1e-9, `Slice and Dice matches the Engine after 300 frames, dice clattering (max diff ${diff.toExponential(1)} voxels)`);

const more = await pe.evaluate(() => {
  const tilt = b => { const R = ensureR(b); return Math.acos(Math.min(1, Math.max(Math.abs(R[3]), Math.abs(R[4]), Math.abs(R[5])))) * 180 / Math.PI; };
  const out = {};
  // stacked die, 2 voxels of overhang
  S.models = [makeDie('a'), makeDie('b')];
  S.instances = [{ modelIdx: 0, x: -3, y: 0, z: -3, rotX: 0, rotY: 0, rotZ: 0 }, { modelIdx: 1, x: -1, y: 6.001, z: -3, rotX: 0, rotY: 0, rotZ: 0 }];
  buildBodies(); S.running = false;
  let n = 0; while (n < 4000 && S.bodies.some(b => !b.sleeping)) { physTick(); n++; }
  out.stacked = S.bodies[1].aabb.minY > 5 && S.bodies.every(b => b.sleeping);
  // head-on in the air, gravity cancelled
  diceDemo(); S.running = false; const [A, B] = S.bodies;
  for (const b of [A, B]) { b.rot = { x: 0, y: 0, z: 0 }; b.R = null; b.angVel = { x: 0, y: 0, z: 0 }; }
  A.pos = { x: -8, y: 40, z: 0 }; B.pos = { x: 8, y: 40.7, z: 0.4 }; A.vel = { x: 0.3, y: 0, z: 0 }; B.vel = { x: -0.3, y: 0, z: 0 };
  let spin = 0; for (let i = 0; i < 80; i++) { A.vel.y += G; B.vel.y += G; physTick(); spin = Math.max(spin, Math.hypot(A.angVel.x, A.angVel.y, A.angVel.z)); }
  out.momentum = Math.abs(A.mass * A.vel.x + B.mass * B.vel.x); out.bounced = A.vel.x < 0 && B.vel.x > 0; out.spin = spin;
  // the demo throw: they hit, then both land flat
  let hits = 0; const orig = pairContact; window.pairContact = (a, b) => { const g = orig(a, b); if (g) hits++; return g; };
  diceDemo(); S.running = false; n = 0; while (n < 4000 && S.bodies.some(b => !b.sleeping)) { physTick(); n++; }
  window.pairContact = orig;
  out.demoHits = hits; out.demoTilt = Math.max(...S.bodies.map(tilt));
  return out;
});
check(more.stacked, 'a die rests stacked on another with 2 voxels of overhang');
check(more.momentum < 1e-9 && more.bounced, `head-on hit conserves momentum (error ${more.momentum.toExponential(1)}) and the dice bounce apart`);
check(more.spin > 0.005, `an off-centre hit makes spin (${more.spin.toFixed(4)} rad/tick)`);
check(more.demoHits > 0 && more.demoTilt < 3, `demo dice hit each other (${more.demoHits} contact ticks) and both land flat (max tilt ${more.demoTilt.toFixed(2)}°)`);
const hinge = await pe.evaluate(() => {
  // two metal bars with a 1-voxel gap and an authored hinge (axis x, ±30°), model turned 0.9 rad
  const RX = 2, RY = 2, RZ = 21, vox = new Uint8Array(RX*RY*RZ);
  for (let z = 0; z < RZ; z++) if (z !== 10) for (let y = 0; y < RY; y++) for (let x = 0; x < RX; x++) vox[x + y*RX + z*RX*RY] = 7;
  const m = makeDie('bars'); Object.assign(m, { RX, RY, RZ, voxels: vox, name: 'bars',
    raw: { magic: 'SOLI', joints: [{ name: 'knee', type: 'hinge', position: [1, 1, 10.5], axis: [1, 0, 0], limit_deg: [-30, 30] }] } });
  S.terrain = []; S.playback = null; G = 0; FLOOR_Y = -1000;
  S.models = [m]; S.instances = [{ id: 0, modelIdx: 0, x: 0, y: 30, z: 0, rotX: 0, rotY: 0.9, rotZ: 0 }]; buildBodies(); S.running = false;
  const jl = S.jointLinks[0], A = bodyByUid(jl.aUid), B = bodyByUid(jl.bUid), w = matVec(ensureR(A), 1, 0, 0);
  B.angVel = { x: w[0]*0.05, y: w[1]*0.05, z: w[2]*0.05 };
  let maxAng = 0;
  for (let i = 0; i < 400; i++) { physTick(); maxAng = Math.max(maxAng, Math.abs(twistAngle(matMul(matMul(matT(ensureR(A)), ensureR(B)), matT(jl.bind)), [1,0,0])) * 180 / Math.PI); }
  G = 0.028; FLOOR_Y = 0; return maxAng;
});
check(hinge > 25 && hinge < 30.5, `hinge limit_deg holds on a rotated model (swung to ${hinge.toFixed(1)}° of ±30°)`);
check(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join('; ') : ''));
await br.close();
console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
