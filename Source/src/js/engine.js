// Pure puzzle engine (no DOM). A puzzle is an N×N grid. Every vehicle is a rectangle (len × wid cells) that can
// only slide along its own axis. Vehicle 0 is the "hero": it has to reach the exit side of the board.
import { TYPE_BY_ID } from './vehicles.js';

// def.veh rows: [typeId, x, y, 'h'|'v', facingReversed(0|1), colourIndex]
export function makePuzzle(def) {
  const n = def.n;
  const walls = new Uint8Array(n * n);
  (def.walls || []).forEach((w) => { walls[w[1] * n + w[0]] = 1; });
  const vs = def.veh.map((v) => {
    const type = TYPE_BY_ID[v[0]];
    if (!type) throw new Error('Unknown vehicle type ' + v[0]);
    const h = v[3] === 'h';
    return { t: v[0], type, len: type.len, wid: type.wid, h, f: h ? v[2] : v[1], p0: h ? v[1] : v[2], r: v[4] | 0, c: v[5] | 0 };
  });
  const hero = vs[0];
  const ex = def.exit;
  const goal = ex === 'R' || ex === 'B' ? n - hero.len : 0;
  return { n, walls, vs, exit: ex, goal, def };
}

export const startPositions = (puz) => puz.vs.map((v) => v.p0);

// Cells covered by vehicle v at axis position p -> [x0,y0,w,h]
export function rectOf(v, p) {
  return v.h ? [p, v.f, v.len, v.wid] : [v.f, p, v.wid, v.len];
}

// Fill occupancy grid: 0 free, 255 wall, i+1 vehicle index. Returns false on overlap / out of bounds.
export function fillOcc(puz, pos, occ) {
  const n = puz.n;
  for (let i = 0; i < occ.length; i++) occ[i] = puz.walls[i] ? 255 : 0;
  for (let i = 0; i < puz.vs.length; i++) {
    const r = rectOf(puz.vs[i], pos[i]);
    if (r[0] < 0 || r[1] < 0 || r[0] + r[2] > n || r[1] + r[3] > n) return false;
    for (let y = r[1]; y < r[1] + r[3]; y++) {
      for (let x = r[0]; x < r[0] + r[2]; x++) {
        if (occ[y * n + x] !== 0) return false;
        occ[y * n + x] = i + 1;
      }
    }
  }
  return true;
}

// Reachable axis interval [lo, hi] for vehicle i, given current occupancy.
export function rangeOf(puz, pos, occ, i) {
  const n = puz.n, v = puz.vs[i], p = pos[i];
  let lo = p, hi = p;
  if (v.h) {
    for (;;) {
      if (lo <= 0) break;
      let ok = true;
      for (let y = v.f; y < v.f + v.wid; y++) if (occ[y * n + lo - 1] !== 0) { ok = false; break; }
      if (!ok) break;
      lo--;
    }
    for (;;) {
      const e = hi + v.len;
      if (e >= n) break;
      let ok = true;
      for (let y = v.f; y < v.f + v.wid; y++) if (occ[y * n + e] !== 0) { ok = false; break; }
      if (!ok) break;
      hi++;
    }
  } else {
    for (;;) {
      if (lo <= 0) break;
      let ok = true;
      for (let x = v.f; x < v.f + v.wid; x++) if (occ[(lo - 1) * n + x] !== 0) { ok = false; break; }
      if (!ok) break;
      lo--;
    }
    for (;;) {
      const e = hi + v.len;
      if (e >= n) break;
      let ok = true;
      for (let x = v.f; x < v.f + v.wid; x++) if (occ[e * n + x] !== 0) { ok = false; break; }
      if (!ok) break;
      hi++;
    }
  }
  return [lo, hi];
}

export const isWin = (puz, pos) => pos[0] === puz.goal;

export function validate(puz) {
  const hero = puz.vs[0];
  if ((puz.exit === 'R' || puz.exit === 'L') !== hero.h) return 'hero orientation does not match exit';
  const occ = new Uint8Array(puz.n * puz.n);
  if (!fillOcc(puz, startPositions(puz), occ)) return 'overlap or out of bounds';
  return null;
}
