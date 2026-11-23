// Seeded level generator: random layout -> BFS verification -> hill-climbing to raise the minimum move count.
// Only layouts the solver proves solvable are ever returned.
import { mulberry32, pick, pickW, rint } from './rng.js';
import { TYPE_BY_ID } from './vehicles.js';
import { makePuzzle, startPositions, fillOcc, validate } from './engine.js';
import { solve } from './solver.js';

const EXITS = ['R', 'L', 'T', 'B'];

function colourFor(r, t) { return r() < 0.55 ? t.col : rint(r, 10); }

export class Generator {
  // opts: {seed, n, exit?, heroTypes:[id], pool:[{t,w}], count:[a,b], walls:[a,b], target:[lo,hi], steps, cap, wideMaxLen}
  constructor(opts) {
    this.o = opts;
    this.r = mulberry32(opts.seed);
    this.cap = opts.cap || 40000;
    this.stepsLeft = opts.steps || 60;
    this.cur = null; this.best = null; this.done = false;
    this.layoutTries = 0;
  }

  free(layout, rect, ignore) {
    const n = this.o.n;
    if (rect[0] < 0 || rect[1] < 0 || rect[0] + rect[2] > n || rect[1] + rect[3] > n) return false;
    for (let y = rect[1]; y < rect[1] + rect[3]; y++) {
      for (let x = rect[0]; x < rect[0] + rect[2]; x++) {
        for (const w of layout.walls) if (w[0] === x && w[1] === y) return false;
        for (let i = 0; i < layout.veh.length; i++) {
          if (i === ignore) continue;
          const v = layout.veh[i];
          const t = TYPE_BY_ID[v[0]];
          const h = v[3] === 'h';
          const w2 = h ? t.len : t.wid, h2 = h ? t.wid : t.len;
          if (x >= v[1] && x < v[1] + w2 && y >= v[2] && y < v[2] + h2) return false;
        }
      }
    }
    return true;
  }

  // Would a vehicle (type t, orientation o, at x,y) permanently block the hero's lane ahead of the hero?
  blocksForever(layout, t, o, x, y) {
    const hero = layout.veh[0], ht = TYPE_BY_ID[hero[0]];
    const heroH = hero[3] === 'h';
    if ((o === 'h') !== heroH) return false;
    const lane = heroH ? hero[2] : hero[1];
    const myLane = o === 'h' ? y : x;
    if (myLane + t.wid <= lane || myLane >= lane + 1) return false; // lanes do not overlap
    const heroPos = heroH ? hero[1] : hero[2];
    const myPos = o === 'h' ? x : y;
    const ex = layout.exit;
    if (ex === 'R' || ex === 'B') return myPos + t.len > heroPos + ht.len - 0 && myPos >= heroPos;
    return myPos < heroPos + 0 && myPos + t.len > 0 && myPos <= heroPos;
  }

  placeRandom(layout, tries) {
    const r = this.r, n = this.o.n;
    for (let k = 0; k < tries; k++) {
      const it = pickW(r, this.o.pool);
      const t = TYPE_BY_ID[it.t];
      if (t.len > n - 1 || t.wid > 2) continue;
      const o = r() < 0.5 ? 'h' : 'v';
      const w = o === 'h' ? t.len : t.wid, h = o === 'h' ? t.wid : t.len;
      const x = rint(r, n - w + 1), y = rint(r, n - h + 1);
      if (!this.free(layout, [x, y, w, h], -1)) continue;
      if (this.blocksForever(layout, t, o, x, y)) continue;
      layout.veh.push([t.id, x, y, o, r() < 0.5 ? 0 : 1, colourFor(r, t)]);
      return true;
    }
    return false;
  }

  randomLayout() {
    const r = this.r, o = this.o, n = o.n;
    const exit = o.exit || pick(r, o.exits || EXITS);
    const heroT = TYPE_BY_ID[pick(r, o.heroTypes)];
    const heroH = exit === 'R' || exit === 'L';
    const lane = rint(r, n);
    let hp;
    const room = n - heroT.len; // max start position
    if (exit === 'R' || exit === 'B') hp = rint(r, Math.max(1, room - 1));
    else hp = 2 > room ? room : 2 + rint(r, Math.max(1, room - 1));
    if (exit === 'R' || exit === 'B') hp = Math.min(hp, Math.max(0, room - 1));
    const layout = { exit, walls: [], veh: [] };
    layout.veh.push([heroT.id, heroH ? hp : lane, heroH ? lane : hp, heroH ? 'h' : 'v', exit === 'L' || exit === 'T' ? 1 : 0, heroT.col]);
    // walls (never in hero lane)
    const wn = o.walls ? o.walls[0] + rint(r, o.walls[1] - o.walls[0] + 1) : 0;
    for (let k = 0, tries = 0; k < wn && tries < 60; tries++) {
      const x = rint(r, n), y = rint(r, n);
      if ((heroH ? y : x) === lane) continue;
      if (!this.free(layout, [x, y, 1, 1], -1)) continue;
      layout.walls.push([x, y]); k++;
    }
    // crossing blockers
    const pathCells = [];
    if (heroH) { for (let x = 0; x < n; x++) if (x < hp || x >= hp + heroT.len) pathCells.push(x); }
    else { for (let y = 0; y < n; y++) if (y < hp || y >= hp + heroT.len) pathCells.push(y); }
    const nb = 1 + rint(r, 2);
    for (let k = 0, tries = 0; k < nb && tries < 40; tries++) {
      const it = pickW(r, o.pool), t = TYPE_BY_ID[it.t];
      if (t.len > n - 1 || t.wid > 2) continue;
      const orient = heroH ? 'v' : 'h';
      const c = pick(r, pathCells);
      const along = rint(r, n - t.len + 1);
      const x = heroH ? c : along, y = heroH ? along : c;
      const w = orient === 'h' ? t.len : t.wid, h = orient === 'h' ? t.wid : t.len;
      if (heroH && (y > lane || y + h <= lane)) continue;
      if (!heroH && (x > lane || x + w <= lane)) continue;
      if (!this.free(layout, [x, y, w, h], -1)) continue;
      layout.veh.push([t.id, x, y, orient, r() < 0.5 ? 0 : 1, colourFor(r, t)]);
      k++;
    }
    const target = o.count[0] + rint(r, o.count[1] - o.count[0] + 1);
    let guard = 0;
    while (layout.veh.length < target && guard++ < 40) this.placeRandom(layout, 20);
    return layout;
  }

  evaluate(layout) {
    const def = { n: this.o.n, exit: layout.exit, walls: layout.walls, veh: layout.veh };
    const puz = makePuzzle(def);
    if (validate(puz)) return null;
    const res = solve(puz, startPositions(puz), this.cap);
    if (!res || res.capped) return null;
    return { layout, min: res.moves, states: res.states };
  }

  clone(layout) {
    return { exit: layout.exit, walls: layout.walls.map((w) => w.slice()), veh: layout.veh.map((v) => v.slice()) };
  }

  mutate(layout) {
    const r = this.r, n = this.o.n, c = this.clone(layout);
    const roll = r();
    if (roll < 0.7 && c.veh.length > 1) {
      const j = 1 + rint(r, c.veh.length - 1);
      const v = c.veh[j], t = TYPE_BY_ID[v[0]];
      for (let k = 0; k < 10; k++) {
        const o = r() < 0.75 ? v[3] : (v[3] === 'h' ? 'v' : 'h');
        const w = o === 'h' ? t.len : t.wid, h = o === 'h' ? t.wid : t.len;
        const x = rint(r, n - w + 1), y = rint(r, n - h + 1);
        if (!this.free(c, [x, y, w, h], j)) continue;
        if (this.blocksForever(c, t, o, x, y)) continue;
        v[1] = x; v[2] = y; v[3] = o; return c;
      }
      return null;
    }
    if (roll < 0.85 && c.veh.length > this.o.count[0]) { c.veh.splice(1 + rint(r, c.veh.length - 1), 1); return c; }
    if (c.veh.length < this.o.count[1]) return this.placeRandom(c, 20) ? c : null;
    return null;
  }

  step() {
    if (this.done) return;
    if (!this.best) { // find a first solvable layout
      for (let k = 0; k < 12 && !this.best; k++) {
        this.layoutTries++;
        const ev = this.evaluate(this.randomLayout());
        if (ev) { this.best = ev; this.cur = ev; }
      }
      if (!this.best && this.layoutTries > 400) this.done = true;
      return;
    }
    const tgt = this.o.target;
    if (this.best.min >= tgt[1] || this.stepsLeft <= 0) { this.done = true; return; }
    this.stepsLeft--;
    const cand = this.mutate(this.cur.layout);
    if (!cand) return;
    const ev = this.evaluate(cand);
    // plain hill climbing, or (opts.anneal) occasionally accept a slightly worse layout to escape local optima
    const slack = this.o.anneal && this.r() < this.o.anneal ? 2 : 0;
    if (ev && ev.min >= this.cur.min - slack) {
      this.cur = ev;
      if (ev.min > this.best.min) this.best = ev;
    }
  }

  result() {
    if (!this.best) return null;
    const l = this.best.layout;
    return { n: this.o.n, exit: l.exit, walls: l.walls, veh: l.veh, min: this.best.min, states: this.best.states, ok: this.best.min >= this.o.target[0] };
  }
}

export function generate(opts) {
  const g = new Generator(opts);
  let guard = 0;
  while (!g.done && guard++ < 100000) g.step();
  return g.result();
}

// Browser-friendly variant: yields to the UI thread between steps so the interface never freezes.
export function generateAsync(opts, onProgress) {
  return new Promise((resolve) => {
    const g = new Generator(opts);
    let spent = 0;
    const tick = () => {
      const t0 = Date.now();
      while (!g.done && Date.now() - t0 < 24) g.step();
      spent++;
      if (onProgress) onProgress(spent);
      if (g.done) resolve(g.result()); else setTimeout(tick, 0);
    };
    tick();
  });
}

export const starThresholds = (min) => [min + Math.max(0, Math.ceil(min * 0.15)), min + Math.ceil(min * 0.6) + 2];
export function difficultyOf(min) {
  return min <= 5 ? 0 : min <= 10 ? 1 : min <= 14 ? 2 : min <= 17 ? 3 : min <= 23 ? 4 : 5;
}
