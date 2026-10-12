// SliceWorks physics checks, run in headless Chromium on the real tool files.
//   npm i playwright   (or use a global install)   then   node tests/physics.mjs
// 1. Dice dropped in the Engine land flat on a face (v0.3.2: 0 of 16 did).
// 2. A die set down just past balance on an edge tips onto a face.
// 3. Slice and Dice bakes the same throw to the same result as the Engine.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = 'file://' + path.join(root, 'sliceworks-engine-v0.4.html');
const DICE = 'file://' + path.join(root, 'slice-and-dice-v0.3.html');
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
  const init = S.bodies.map((b, i) => ({ inst: S.instances[i], com: { ...b.com }, angVel: { ...b.angVel } }));
  const raw = S.models[0].raw;
  for (let n = 0; n < 300; n++) physTick();
  const fin = S.bodies.map(b => { const R = ensureR(b), o = matVec(R, -b.com.x, -b.com.y, -b.com.z); return [b.pos.x + o[0], b.pos.y + o[1], b.pos.z + o[2], ...R]; });
  return { init, raw, fin };
});
const pd = await br.newPage(); pd.on('pageerror', e => errs.push(e.message));
await pd.goto(DICE); await pd.waitForTimeout(200);
const dice = await pd.evaluate(({ init, raw }) => {
  S.models = [parseSoli(JSON.stringify(raw), 'die.soli')];
  const m = S.models[0];
  S.instances = init.map((d, i) => { const { inst, com, angVel } = d, R = eulerToMat(inst.rotX, inst.rotY, inst.rotZ);
    const r = matVec(R, com.x - m.RX / 2, com.y, com.z - m.RZ / 2);
    return { id: i, modelIdx: 0, x: inst.x + com.x - r[0], y: inst.y + com.y - r[1], z: inst.z + com.z - r[2], rotX: inst.rotX, rotY: inst.rotY, rotZ: inst.rotZ,
      vx: 0, vy: 0, vz: 0, ax: angVel.x * 60, ay: angVel.y * 60, az: angVel.z * 60, trackType: 'physics', joint_states: [] }; });
  S.simDirty = true; bakeSimulation();
  return S.instances.map(inst => { const fs = S.baked[299][inst.id], R = eulerToMat(fs.rotX, fs.rotY, fs.rotZ), o = matVec(R, -m.RX / 2, 0, -m.RZ / 2);
    return [fs.x + o[0], fs.y + o[1], fs.z + o[2], ...R]; });
}, { init: eng.init, raw: eng.raw });
const diff = Math.max(...eng.fin.flatMap((a, i) => a.map((v, k) => Math.abs(v - dice[i][k]))));
check(diff < 1e-6, `Slice and Dice matches the Engine after 300 frames (max diff ${diff.toExponential(1)})`);
check(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join('; ') : ''));
await br.close();
console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
