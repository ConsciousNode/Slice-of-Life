// Engine v0.6 controls: roll, flick, read the dice.
//   npm i playwright   then   node tests/controls.mjs
// 1. The pip readout agrees with the die's orientation (every face of the demo die).
// 2. Rolls are fair: 600 dice from the demo start, and 600 more rolled again
//    from where they landed, each pass a chi-squared test (df 5, p<0.05 → 11.07).
// 3. Space rolls, the HUD shows the sum, a drag shows the aim line and flicks.
// 4. A cartridge carries its controls; a tap on empty canvas rolls in the player.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = 'file://' + path.join(root, 'sliceworks-engine-v0.6.html');
const CART = 'file://' + path.join(root, 'cartridges', 'two-dice.html');
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) fails++; };
const br = await chromium.launch(); const errs = [];
const open = async url => { const p = await br.newPage({ viewport: { width: 1200, height: 800 } }); p.on('pageerror', e => errs.push(e.message)); await p.goto(url); await p.waitForTimeout(300); return p; };

const p = await open(ENGINE);
const r = await p.evaluate(() => {
  // which local axis points up → the face the pip layout puts there
  const expect = b => { const R = ensureR(b), up = [R[3], R[4], R[5]]; let ax = 0; if (Math.abs(up[1]) > Math.abs(up[ax])) ax = 1; if (Math.abs(up[2]) > Math.abs(up[ax])) ax = 2;
    return { '0+': 2, '0-': 5, '1+': 1, '1-': 6, '2+': 3, '2-': 4 }[ax + (up[ax] > 0 ? '+' : '-')]; };
  const settle = () => { let k = 0; while (k < 6000 && dynamicBodies().some(b => !b.sleeping)) { physTick(); k++; } return k < 6000; };
  const chi = h => { const N = h.slice(1).reduce((a, b) => a + b, 0), E = N / 6; return h.slice(1).reduce((a, o) => a + (o - E) ** 2 / E, 0); };
  let agree = 0, n = 0, stuck = 0; const fresh = [0,0,0,0,0,0,0], again = [0,0,0,0,0,0,0];
  for (let t = 0; t < 300; t++) { diceDemo(); S.running = false; rollAll(); S.running = false; if (!settle()) stuck++;
    for (const b of S.bodies) { const v = pipsUp(b); n++; if (v === expect(b)) agree++; fresh[v || 0]++; } }
  diceDemo(); S.running = false;
  for (let t = 0; t < 300; t++) { rollAll(); S.running = false; if (!settle()) stuck++; for (const b of S.bodies) again[pipsUp(b) || 0]++; }
  return { agree, n, stuck, fresh, again, chiFresh: chi(fresh), chiAgain: chi(again) }; });
check(r.agree === r.n && r.fresh[0] === 0, `pip readout matches orientation (${r.agree}/${r.n})`);
check(r.stuck === 0, 'every roll comes to rest');
check(r.chiFresh < 11.07, `rolls from the demo start are fair (chi² ${r.chiFresh.toFixed(2)}; faces ${r.fresh.slice(1).join(' ')})`);
check(r.chiAgain < 11.07, `re-rolls from where the dice landed are fair (chi² ${r.chiAgain.toFixed(2)}; faces ${r.again.slice(1).join(' ')})`);

// Real input
await p.evaluate(() => diceDemo()); await p.waitForTimeout(4000);
await p.keyboard.press('Space'); await p.waitForTimeout(150);
const awake = await p.evaluate(() => dynamicBodies().filter(b => !b.sleeping).length);
check(awake === 2, 'Space throws both dice');
await p.waitForFunction(() => /=\s*\d+/.test(document.getElementById('roll-hud').textContent), null, { timeout: 15000 }).catch(() => {});
const hud = await p.evaluate(() => { const sum = dynamicBodies().reduce((a, b) => a + pipsUp(b), 0); return { text: document.getElementById('roll-hud').textContent, sum }; });
check(new RegExp('=\\s*' + hud.sum + '\\b').test(hud.text), `HUD shows the result ("${hud.text.trim()}")`);
const at = await p.evaluate(() => { const b = dynamicBodies()[0], q = projectPt(b.pos.x, b.pos.y, b.pos.z), c = cv.getBoundingClientRect(); return { x: c.left + q.sx * c.width / cv.width, y: c.top + q.sy * c.height / cv.height }; });
await p.mouse.move(at.x, at.y); await p.mouse.down(); await p.mouse.move(at.x + 120, at.y - 30, { steps: 5 });
const aim = await p.evaluate(() => !!S.aim); await p.mouse.up();
const v = await p.evaluate(() => { const b = dynamicBodies()[0]; return Math.hypot(b.vel.x, b.vel.y, b.vel.z); });
check(aim && v > 0.05, `dragging a die shows the aim line and flicks it (speed ${v.toFixed(3)})`);

// Cartridge
const c = await open(CART);
const ctl = await c.evaluate(() => { const d = JSON.parse(document.getElementById('cartridge').textContent); return d.controls; });
check(ctl && ctl.roll && ctl.flick && ctl.readout, 'the cartridge carries its controls');
await c.evaluate(() => { const b = document.querySelector('.pkeep, #play-btn'); if (b && b.click) b.click(); });
await c.waitForTimeout(4500);
const corner = await c.evaluate(() => { const r = cv.getBoundingClientRect(); return { x: r.left + 8, y: r.top + 8 }; });
await c.mouse.click(corner.x, corner.y); await c.waitForTimeout(150);
const cAwake = await c.evaluate(() => dynamicBodies().filter(b => !b.sleeping).length);
check(cAwake === 2, 'a tap on empty canvas rolls in the player');

check(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
await br.close();
console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
