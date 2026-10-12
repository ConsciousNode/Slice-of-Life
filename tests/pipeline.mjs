// The Slice pipeline end to end, through the real files each tool writes.
//   npm i playwright   then   node tests/pipeline.mjs
// 1. A Studio .sost (with terrain) loads into the Engine as authored, and the
//    terrain is solid ground.
// 2. Dice → parametric .soan → Engine replays the throw to Dice's result.
// 3. Dice → baked .soan → Engine plays the recorded frames exactly.
// 4. Engine → .soga → Engine: a saved game resumes where it left off.
// 5. Engine → cartridge (.html): boots as a player and runs the scene; the
//    blank player asks for a .soga.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = 'file://' + path.join(root, 'sliceworks-engine-v0.5.html');
const DICE = 'file://' + path.join(root, 'slice-and-dice-v0.4.html');
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails++; };
const br = await chromium.launch(); const errs = [];
const open = async url => { const p = await br.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(url); await p.waitForTimeout(200);
  // capture downloads instead of saving them
  await p.evaluate(() => { URL.createObjectURL = b => { window._blob = b; return 'blob:captured'; }; URL.revokeObjectURL = () => {}; HTMLAnchorElement.prototype.click = function () {}; });
  return p; };

// A die .soli (taken from the Engine's demo) and a Studio-format scene
const pe = await open(ENGINE);
const dieSoli = await pe.evaluate(() => soliFromModel(makeDie('die')));
const sost = JSON.stringify({ format: 'sost', version: '0.3', library: [{ name: 'die.soli', soli: dieSoli }],
  instances: [ { id: 0, modelIdx: 0, x: 0, y: 1, z: 0, rotX: 0, rotY: 0, rotZ: 0 },          // on the terrain patch
               { id: 1, modelIdx: 0, x: 14, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 },         // on the floor
               { id: 2, modelIdx: 0, x: -6, y: 18, z: 2, rotX: 0.4, rotY: 0.3, rotZ: 0.2 } ], // in the air
  environment: { preset: 'floor', terrain: [-4,-3,-2,-1,0,1,2,3].flatMap(x => [-4,-3,-2,-1,0,1,2,3].map(z => [x, z])) } });

// 1. Engine loads the scene as authored; terrain holds the die up
const r1 = await pe.evaluate(sost => { const { models, instances, terrain } = parseSost(sost); loadScene(models, instances, terrain);
  const placed = S.bodies.filter(b => !b.static).map(b => +b.aabb.minY.toFixed(3));
  let n = 0; while (n < 2000 && S.bodies.some(b => !b.sleeping && !b.static)) { physTick(); n++; }
  return { placed, rest: S.bodies.filter(b => !b.static).map(b => +b.aabb.minY.toFixed(3)), terrain: S.bodies.some(b => b.static && b.name === 'terrain') }; }, sost);
check(r1.terrain && Math.abs(r1.placed[0] - 1) < 1e-9 && Math.abs(r1.placed[1]) < 1e-9, `scene loads as authored (die bottoms at ${r1.placed.slice(0, 2).join(', ')})`);
check(Math.abs(r1.rest[0] - 1) < 0.05 && Math.abs(r1.rest[1]) < 0.05, `terrain is solid: the die on it rests at y≈1 (${r1.rest[0]}), the other at the floor (${r1.rest[1]})`);

// 2 + 3. Dice: same scene, give the airborne die a throw, export both kinds of .soan
const pd = await open(DICE);
const dice = await pd.evaluate(async sost => {
  importSost(sost);
  const s = S.instances.find(i => i.id === 2); s.vx = 9; s.vy = 3; s.vz = -2; s.ax = 6; s.ay = -4; s.az = 5;
  S.simDirty = true; bakeSimulation();
  exportSoan(false); const parametric = await window._blob.text();
  exportSoan(true); const baked = await window._blob.text();
  return { parametric, baked, last: S.baked[299][2], f150: S.baked[150][2] }; }, sost);

const r2 = await pe.evaluate(({ sost, soan }) => { const { models, instances, terrain } = parseSost(sost); loadScene(models, instances, terrain);
  applySoan(JSON.parse(soan)); for (let i = 0; i < 299; i++) physTick();
  const inst = S.instances[2], b = S.bodies.find(x => x.instIdx === 2), R = ensureR(b);
  const m = S.models[inst.modelIdx], o = matVec(R, b.com.x - m.RX / 2, b.com.y, b.com.z - m.RZ / 2);
  return { x: b.pos.x - o[0], y: b.pos.y - o[1], z: b.pos.z - o[2] }; }, { sost, soan: dice.parametric });
const d2 = Math.max(Math.abs(r2.x - dice.last.x), Math.abs(r2.y - dice.last.y), Math.abs(r2.z - dice.last.z));
check(d2 < 1e-9, `parametric .soan: the Engine replays Dice's throw to the same spot (diff ${d2.toExponential(1)})`);

const r3 = await pe.evaluate(({ sost, soan }) => { const { models, instances, terrain } = parseSost(sost); loadScene(models, instances, terrain);
  applySoan(JSON.parse(soan)); for (let i = 0; i < 150; i++) physTick();
  const b = S.bodies.find(x => x.instIdx === 2), R = ensureR(b), m = S.models[0], o = matVec(R, b.com.x - m.RX / 2, b.com.y, b.com.z - m.RZ / 2);
  return { x: b.pos.x - o[0], y: b.pos.y - o[1], z: b.pos.z - o[2], playback: !!S.playback }; }, { sost, soan: dice.baked });
const d3 = Math.max(Math.abs(r3.x - dice.f150.x), Math.abs(r3.y - dice.f150.y), Math.abs(r3.z - dice.f150.z));
check(r3.playback && d3 < 2e-3, `baked .soan plays Dice's recorded frames (frame 150 within ${d3.toExponential(1)}; frames are stored to 3 decimals)`);

// 4. .soga save and resume
const r4 = await pe.evaluate(async () => {
  diceDemo(); S.running = false; for (let i = 0; i < 40; i++) physTick();
  exportSoga(); const soga = await window._blob.text();
  for (let i = 0; i < 100; i++) physTick();
  const straight = S.bodies.map(b => [b.pos.x, b.pos.y, b.pos.z]);
  applySoga(JSON.parse(soga)); const tick = S.tick; for (let i = 0; i < 100; i++) physTick();
  const resumed = S.bodies.map(b => [b.pos.x, b.pos.y, b.pos.z]);
  return { tick, diff: Math.max(...straight.flatMap((p, i) => p.map((v, k) => Math.abs(v - resumed[i][k])))) };
});
check(r4.tick === 40 && r4.diff < 1e-6, `.soga saves and resumes: tick ${r4.tick}, then 100 more ticks match an unbroken run (diff ${r4.diff.toExponential(1)})`);

// 5. cartridge
const fs = await import('node:fs'); const os = await import('node:os');
const cartHtml = await pe.evaluate(async () => { diceDemo(); S.running = false; document.getElementById('cart-title').value = 'Two Dice'; exportCartridge(); return await window._blob.text(); });
const cartPath = path.join(os.tmpdir(), 'slice-cartridge-test.html'); fs.writeFileSync(cartPath, cartHtml);
const pc = await br.newPage(); pc.on('pageerror', e => errs.push('cartridge: ' + e.message));
await pc.goto('file://' + cartPath); await pc.waitForTimeout(3000);
const cart = await pc.evaluate(() => ({ player: document.body.classList.contains('player'), title: document.getElementById('player-title').textContent,
  bodies: S.bodies.length, running: S.running, tick: S.tick, play: getComputedStyle(document.getElementById('btn-play')).display !== 'none' }));
check(cart.player && cart.title === 'Two Dice' && cart.bodies === 2 && cart.running && cart.tick > 60 && cart.play,
  `cartridge boots as a player and runs (${(cartHtml.length/1024).toFixed(0)} KB, "${cart.title}", tick ${cart.tick})`);
const pp = await br.newPage(); pp.on('pageerror', e => errs.push('player: ' + e.message));
await pp.goto('file://' + path.join(root, 'sliceworks-player-v0.1.html')); await pp.waitForTimeout(400);
const blank = await pp.evaluate(() => getComputedStyle(document.getElementById('player-insert')).display);
check(blank === 'flex', 'blank player shows "Insert cartridge"');
check(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join('; ') : ''));
await br.close();
console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
