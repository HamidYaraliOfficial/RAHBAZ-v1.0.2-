// Gameplay controller: input (drag), animation loop, undo / hint / solution, win & fail detection.
import { makePuzzle, startPositions, fillOcc, rangeOf, isWin } from './engine.js';
import { solve } from './solver.js';
import { BoardView } from './render.js';
import { sfx, unlockAudio } from './audio.js';
import { starThresholds } from './generator.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Game {
  constructor(canvas, wrap, hooks) {
    this.cv = canvas; this.wrap = wrap; this.hooks = hooks; this.view = new BoardView(canvas);
    this.def = null; this.puz = null; this.state = 'idle'; this.paused = false; this.active = false;
    this.raf = 0; this.last = 0; this.lastDraw = 0; this.t = 0; this.anim = true; this.cfg = {};
    this.drag = null; this.particles = []; this.wig = null; this.hint = null; this.sel = -1; this.auto = null; this.cache = {};
    this.hudT = 0; this.tick = this.tick.bind(this);
    const pd = (e) => this.down(e), pm = (e) => this.move(e), pu = (e) => this.up(e);
    canvas.addEventListener('pointerdown', pd); canvas.addEventListener('pointermove', pm);
    canvas.addEventListener('pointerup', pu); canvas.addEventListener('pointercancel', pu); canvas.addEventListener('lostpointercapture', pu);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  load(def, cfg) {
    this.def = def; this.cfg = cfg || {}; this.puz = makePuzzle(def);
    this.anim = this.cfg.anim !== false;
    this.min = def.min; this.th = def.stars || starThresholds(def.min);
    this.view.setPuzzle(this.puz, this.cfg.skin || 'classic');
    this.cache = {};
    this.restart();
    this.fit();
  }
  restart() {
    const puz = this.puz;
    this.pos = startPositions(puz); this.vis = this.pos.slice(); this.hist = []; this.moves = 0; this.hints = 0; this.undos = 0; this.timeMs = 0;
    this.state = 'play'; this.hint = null; this.auto = null; this.solUsed = false; this.drag = null; this.sel = -1; this.wig = null; this.particles = []; this.heroAlpha = null;
    this.occ = new Uint8Array(puz.n * puz.n); this.pathClear = this.heroClear();
    this.emitHud(); this.kick();
  }
  setActive(a) { this.active = a; if (a) this.kick(); }
  fit() {
    if (!this.puz) return;
    const w = this.wrap.clientWidth, h = this.wrap.clientHeight;
    if (w < 20 || h < 20) return;
    this.view.setSize(w, h); this.kick();
  }
  setSkin(s) { this.view.setSkin(s); this.kick(); }

  // ---- helpers
  heroClear() {
    fillOcc(this.puz, this.pos, this.occ);
    const r = rangeOf(this.puz, this.pos, this.occ, 0);
    return this.puz.goal === 0 ? r[0] === 0 : r[1] === this.puz.goal;
  }
  rating(moves) { return moves <= this.th[0] ? 3 : moves <= this.th[1] ? 2 : 1; }
  snapshot() { return { moves: this.moves, time: this.timeMs / 1000, lim: this.cfg.lim || 0, min: this.min, stars: this.rating(this.moves), hints: this.hints, timeLeft: this.cfg.timeLimit ? Math.max(0, this.cfg.timeLimit - this.timeMs / 1000) : null }; }
  emitHud() { if (this.hooks.hud) this.hooks.hud(this.snapshot()); }
  canInput() { return this.state === 'play' && !this.paused && !this.auto && this.active; }

  // ---- input
  local(e) { const r = this.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  down(e) {
    unlockAudio();
    if (!this.canInput() || this.drag) return;
    e.preventDefault();
    const p = this.local(e), i = this.view.hit(p[0], p[1], this.vis);
    if (i < 0) return;
    const v = this.puz.vs[i];
    fillOcc(this.puz, this.pos, this.occ);
    const rg = rangeOf(this.puz, this.pos, this.occ, i);
    this.drag = { i, id: e.pointerId, a0: this.view.axisCoord(p[0], p[1], v), p0: this.vis[i], lo: rg[0], hi: rg[1], bumped: false, cellNow: Math.round(this.vis[i]), moved: false };
    this.sel = i; this.hint = null;
    try { this.cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    this.kick();
  }
  move(e) {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    e.preventDefault();
    const p = this.local(e), v = this.puz.vs[d.i];
    const raw = d.p0 + (this.view.axisCoord(p[0], p[1], v) - d.a0);
    const tgt = clamp(raw, d.lo, d.hi);
    if (Math.abs(raw - tgt) > 0.2) { if (!d.bumped) { d.bumped = true; if (Math.abs(raw - d.p0) > 0.2) this.bump(d.i); } }
    else d.bumped = false;
    if (Math.abs(tgt - d.p0) > 0.05) d.moved = true;
    this.vis[d.i] = tgt;
    const cn = Math.round(tgt);
    if (cn !== d.cellNow) { d.cellNow = cn; sfx('move'); }
    this.kick();
  }
  up(e) {
    const d = this.drag;
    if (!d || (e && e.pointerId !== undefined && e.pointerId !== d.id)) return;
    this.drag = null; this.sel = -1;
    const i = d.i, snap = clamp(Math.round(this.vis[i]), d.lo, d.hi);
    if (snap !== this.pos[i]) this.commit(i, snap, true);
    this.kick();
  }
  bump(i) {
    this.wig = { i, amp: 0.06 }; sfx('bump');
    this.kick();
  }

  commit(i, to, byPlayer) {
    this.hist.push({ i, from: this.pos[i], to });
    this.pos[i] = to; this.moves++; this.hint = null;
    if (byPlayer) sfx('brake');
    const clear = this.heroClear();
    if (clear && !this.pathClear) sfx('open');
    this.pathClear = clear;
    if (isWin(this.puz, this.pos)) { this.startExit(); }
    else if (this.cfg.lim && this.moves > this.cfg.lim && !this.auto) { this.finishFail('moves'); }
    this.emitHud();
  }

  undo() {
    if (this.state !== 'play' || this.paused || this.auto || !this.hist.length) return;
    const h = this.hist.pop();
    this.pos[h.i] = h.from; this.moves--; this.undos++; this.hint = null; this.pathClear = this.heroClear();
    sfx('tap'); this.emitHud(); this.kick();
  }
  reset() { if (this.state === 'won') return; this.restart(); sfx('tap'); }

  getPath() {
    const key = this.pos.join(',');
    let path = this.cache[key];
    if (!path) {
      const res = solve(this.puz, this.pos, 400000);
      if (!res || res.capped) return null;
      path = res.path; this.cache[key] = path;
    }
    return path;
  }
  showHint() {
    if (!this.canInput()) return false;
    const path = this.getPath();
    if (!path || !path.length) { if (this.hooks.toast) this.hooks.toast('hintNone'); return false; }
    const m = path[0];
    this.hint = { i: m.i, to: m.to, t0: this.t }; this.hints++; sfx('hint'); this.emitHud(); this.kick();
    return true;
  }
  playSolution() {
    if (this.state !== 'play' || this.auto) return false;
    const path = this.getPath();
    if (!path || !path.length) { if (this.hooks.toast) this.hooks.toast('hintNone'); return false; }
    this.solUsed = true; this.hint = null; this.auto = { path: path.slice(), k: 0, wait: 0.5 };
    if (this.hooks.toast) this.hooks.toast('solving');
    this.kick(); return true;
  }

  startExit() {
    this.state = 'exit'; this.exitT = 0; this.hint = null; this.auto = null; this.exitFrom = this.vis[0];
    sfx('exit'); this.kick();
  }
  finishFail(reason) {
    if (this.state === 'won' || this.state === 'failed') return;
    this.state = 'failed'; sfx('fail');
    if (this.hooks.fail) this.hooks.fail(reason);
  }
  finishWin() {
    this.state = 'won';
    const moves = this.moves, perfect = moves <= this.min && !this.solUsed;
    let stars = this.rating(moves);
    if (this.solUsed) stars = 1;
    const sec = this.timeMs / 1000;
    const score = Math.max(0, Math.round(1000 + this.min * 20 - Math.max(0, moves - this.min) * 25 - this.hints * 40 - Math.floor(sec) * 2));
    this.spawnConfetti();
    if (this.hooks.win) this.hooks.win({ moves, time: sec, hints: this.hints, undos: this.undos, solUsed: this.solUsed, stars, score, perfect, min: this.min });
  }
  spawnConfetti() {
    if (!this.anim) return;
    const S = this.cv.width, cols = ['#FFC93C', '#2D6BFF', '#15B887', '#FF8A1F', '#F1F5FB', '#E5484D'];
    for (let k = 0; k < 70; k++) {
      const a = Math.random() * 6.283, sp = (0.4 + Math.random()) * S * 0.5;
      this.particles.push({ x: S / 2, y: S * 0.45, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - S * 0.35, life: 1, col: cols[k % cols.length], s: S * 0.018 });
    }
    this.kick();
  }

  // ---- loop
  kick() { if (!this.raf && this.active) { this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); } }
  busy() {
    if (this.drag || this.state === 'exit' || this.auto || this.particles.length || this.wig || this.hint) return true;
    for (let i = 0; i < this.pos.length; i++) if (Math.abs(this.vis[i] - this.pos[i]) > 0.002) return true;
    return false;
  }
  tick(now) {
    this.raf = 0;
    if (!this.active || !this.puz) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    const idle = !this.busy();
    if (idle && this.anim && !this.paused && now - this.lastDraw < 32) { this.last = now; this.raf = requestAnimationFrame(this.tick); return; }
    this.last = now; this.lastDraw = now; this.t += dt * 1000;
    this.update(dt);
    const vs = this.puz.vs, ps = this.pos;
    this.view.draw({ vis: this.vis, t: this.t, wig: this.wig, hint: this.hint, sel: this.sel, particles: this.particles, anim: this.anim, heroAlpha: this.heroAlpha });
    if (this.anim || this.busy() || (this.state === 'play' && !this.paused)) this.raf = requestAnimationFrame(this.tick);
  }
  update(dt) {
    if (this.state === 'play' && !this.paused) {
      this.timeMs += dt * 1000;
      this.hudT += dt; if (this.hudT > 0.25) { this.hudT = 0; this.emitHud(); }
      if (this.cfg.timeLimit && this.timeMs >= this.cfg.timeLimit * 1000) this.finishFail('time');
    }
    if (this.paused) return;
    const vs = this.puz.vs;
    for (let i = 0; i < vs.length; i++) {
      if (this.drag && this.drag.i === i) continue;
      if (this.state === 'exit' && i === 0) continue;
      const d = this.pos[i] - this.vis[i];
      if (Math.abs(d) < 0.003) { this.vis[i] = this.pos[i]; continue; }
      const k = Math.min(1, dt * 15 * vs[i].type.spd);
      let st = d * k; const min = dt * 3 * vs[i].type.spd * Math.sign(d);
      if (Math.abs(st) < Math.abs(min)) st = Math.abs(min) > Math.abs(d) ? d : min;
      this.vis[i] += st;
    }
    if (this.state === 'exit') {
      this.exitT += dt / 0.75;
      const e = Math.min(1, this.exitT), hero = vs[0], dir = this.puz.goal === 0 ? -1 : 1;
      this.vis[0] = this.exitFrom + dir * (hero.len + 1.0) * e * e;
      this.heroAlpha = e > 0.55 ? Math.max(0, 1 - (e - 0.55) / 0.45) : null;
      if (this.exitT >= 1.05) { this.pos[0] = this.puz.goal; this.heroAlpha = 0; this.finishWin(); }
    }
    if (this.auto && this.state === 'play') {
      this.auto.wait -= dt;
      if (this.auto.wait <= 0) {
        const m = this.auto.path[this.auto.k];
        if (m) { this.hint = null; this.auto.k++; this.commit(m.i, m.to, false); sfx('move'); this.auto.wait = 0.75; }
        if (this.auto && this.auto.k >= this.auto.path.length) this.auto = null;
      }
    }
    if (this.wig) { this.wig.amp *= Math.exp(-dt * 8); if (this.wig.amp < 0.003) this.wig = null; }
    if (this.hint && this.t - this.hint.t0 > 6000) this.hint = null;
    if (this.particles.length) {
      const g = this.cv.width * 1.2;
      for (const q of this.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += g * dt; q.life -= dt * 0.7; }
      this.particles = this.particles.filter((q) => q.life > 0);
    }
  }
}
