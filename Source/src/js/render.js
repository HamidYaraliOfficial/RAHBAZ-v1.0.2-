// Canvas renderer for the game board + helpers that turn vehicle artwork into small DOM icons.
import { drawVehicleArt, makePal } from './art.js';
import { TYPE_BY_ID } from './vehicles.js';

const ANG = { h0: 0, h1: Math.PI, v0: Math.PI / 2, v1: -Math.PI / 2 };
function rrect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r); c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.closePath();
}

const iconCache = {};
function baseSprite(typeId, ci, skin, u) {
  const key = typeId + '|' + ci + '|' + skin + '|' + u;
  if (iconCache[key]) return iconCache[key];
  const type = TYPE_BY_ID[typeId], m = Math.ceil(u * 0.3), L = type.len * u, W = type.wid * u;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(L + 2 * m); cv.height = Math.ceil(W + 2 * m);
  const c = cv.getContext('2d'); c.translate(m, m);
  drawVehicleArt(c, type, L, W, u, makePal(skin, type, ci));
  const out = { cv, m, L, W };
  iconCache[key] = out; return out;
}
// A canvas element showing one vehicle (facing right), scaled to fit maxW × maxH css pixels.
export function vehicleIcon(typeId, opts) {
  opts = opts || {};
  const skin = opts.skin || 'classic', ci = opts.ci != null ? opts.ci : TYPE_BY_ID[typeId].col, maxW = opts.w || 64, maxH = opts.h || 40;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), type = TYPE_BY_ID[typeId];
  const u = 40, sp = baseSprite(typeId, ci, skin, u);
  const scale = Math.min(maxW / (type.len * u + 0.2 * u), maxH / (type.wid * u + 0.2 * u));
  const w = Math.ceil((sp.L + 0.2 * u) * scale), h = Math.ceil((sp.W + 0.2 * u) * scale);
  const cv = document.createElement('canvas'); cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high';
  const dw = sp.cv.width * scale * dpr, dh = sp.cv.height * scale * dpr;
  c.drawImage(sp.cv, (cv.width - dw) / 2, (cv.height - dh) / 2, dw, dh);
  cv.className = 'vicon';
  return cv;
}

export class BoardView {
  constructor(canvas) {
    this.cv = canvas; this.c = canvas.getContext('2d'); this.dpr = 1; this.size = 0; this.cell = 0; this.pad = 0;
    this.puz = null; this.skin = 'classic'; this.sprites = {};
  }
  setPuzzle(puz, skin) { this.puz = puz; this.skin = skin; this.sprites = {}; this.layout(); }
  setSkin(skin) { this.skin = skin; this.sprites = {}; }
  setSize(w, h) {
    const size = Math.max(120, Math.floor(Math.min(w, h)));
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.style.width = size + 'px'; this.cv.style.height = size + 'px';
    this.cv.width = Math.floor(size * this.dpr); this.cv.height = Math.floor(size * this.dpr);
    this.size = size; this.sprites = {}; this.layout();
  }
  layout() {
    if (!this.puz) return;
    const n = this.puz.n, S = this.cv.width;
    this.cell = Math.floor(S / (n + 1.3)); this.pad = Math.floor((S - n * this.cell) / 2);
  }
  sprite(v) {
    const key = v.t + '|' + v.c;
    let s = this.sprites[key];
    if (s) return s;
    const u = this.cell, m = Math.ceil(u * 0.3), L = v.len * u, W = v.wid * u;
    const cv = document.createElement('canvas'); cv.width = L + 2 * m; cv.height = W + 2 * m;
    const c = cv.getContext('2d'); c.translate(m, m);
    drawVehicleArt(c, v.type, L, W, u, makePal(this.skin, v.type, v.c));
    const sh = document.createElement('canvas'); sh.width = cv.width; sh.height = cv.height;
    const sc = sh.getContext('2d'); sc.drawImage(cv, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = 'rgba(0,0,0,.55)'; sc.fillRect(0, 0, sh.width, sh.height);
    s = { cv, sh, m, L, W }; this.sprites[key] = s; return s;
  }
  rectOf(v, p) { return v.h ? [p, v.f, v.len, v.wid] : [v.f, p, v.wid, v.len]; }
  // Pointer (css px relative to canvas) -> index of vehicle under it, or -1
  hit(px, py, vis) {
    const cx = (px * this.dpr - this.pad) / this.cell, cy = (py * this.dpr - this.pad) / this.cell;
    const vs = this.puz.vs;
    for (let i = vs.length - 1; i >= 0; i--) {
      const r = this.rectOf(vs[i], vis[i]);
      if (cx >= r[0] - 0.04 && cx <= r[0] + r[2] + 0.04 && cy >= r[1] - 0.04 && cy <= r[1] + r[3] + 0.04) return i;
    }
    return -1;
  }
  axisCoord(px, py, v) { const k = (v.h ? px : py) * this.dpr; return (k - this.pad) / this.cell; }

  drawBoard(st) {
    const c = this.c, n = this.puz.n, cell = this.cell, pad = this.pad, bs = n * cell;
    // curb + asphalt plate
    c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = cell * 0.3; c.shadowOffsetY = cell * 0.08;
    rrect(c, pad - cell * 0.1, pad - cell * 0.1, bs + cell * 0.2, bs + cell * 0.2, cell * 0.32); c.fillStyle = '#5C7DB8'; c.fill(); c.restore();
    rrect(c, pad - cell * 0.05, pad - cell * 0.05, bs + cell * 0.1, bs + cell * 0.1, cell * 0.28); c.lineWidth = cell * 0.05; c.strokeStyle = '#2D4A80'; c.stroke();
    const g = c.createLinearGradient(0, pad, 0, pad + bs); g.addColorStop(0, '#34445F'); g.addColorStop(1, '#232F47');
    rrect(c, pad, pad, bs, bs, cell * 0.24); c.fillStyle = g; c.fill();
    c.save(); rrect(c, pad, pad, bs, bs, cell * 0.24); c.clip();
    // asphalt grain
    if (!this.grain || this.grainN !== bs) { const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d'); let sd = 12345; for (let i = 0; i < 520; i++) { sd = (sd * 1664525 + 1013904223) >>> 0; const x = (sd >>> 8) % 128; sd = (sd * 1664525 + 1013904223) >>> 0; const y = (sd >>> 8) % 128; gx.fillStyle = (sd & 1) ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.14)'; gx.fillRect(x, y, 2, 2); } this.grain = c.createPattern(gc, 'repeat'); this.grainN = bs; }
    c.fillStyle = this.grain; c.fillRect(pad, pad, bs, bs);
    // painted parking-bay / lane markings: dashed white lines between cells, with small tick crosses at the corners
    c.strokeStyle = 'rgba(241,245,251,.26)'; c.lineWidth = Math.max(1.5, cell * 0.03); c.setLineDash([cell * 0.16, cell * 0.12]); c.beginPath();
    for (let i = 1; i < n; i++) { c.moveTo(pad + i * cell, pad); c.lineTo(pad + i * cell, pad + bs); c.moveTo(pad, pad + i * cell); c.lineTo(pad + bs, pad + i * cell); }
    c.stroke(); c.setLineDash([]);
    // hero lane highlight
    const hero = this.puz.vs[0];
    c.fillStyle = 'rgba(21,184,135,.16)';
    if (hero.h) c.fillRect(pad, pad + hero.f * cell, bs, cell); else c.fillRect(pad + hero.f * cell, pad, cell, bs);
    // walls
    const w = this.puz.walls;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (w[y * n + x]) this.drawWall(pad + x * cell, pad + y * cell, cell);
    c.restore();
    this.drawGate(st && st.t || 0);
  }
  drawWall(x, y, s) {
    const c = this.c;
    c.save(); rrect(c, x + s * 0.07, y + s * 0.07, s * 0.86, s * 0.86, s * 0.16); c.clip();
    c.fillStyle = '#AAB6C8'; c.fillRect(x, y, s, s);
    c.fillStyle = '#F2B705';
    for (let k = -2; k < 6; k++) { c.beginPath(); c.moveTo(x + k * s * 0.26, y + s); c.lineTo(x + k * s * 0.26 + s * 0.13, y + s); c.lineTo(x + k * s * 0.26 + s * 0.13 + s, y); c.lineTo(x + k * s * 0.26 + s, y); c.closePath(); c.fill(); }
    c.restore();
    rrect(c, x + s * 0.07, y + s * 0.07, s * 0.86, s * 0.86, s * 0.16); c.lineWidth = Math.max(1, s * 0.05); c.strokeStyle = 'rgba(8,20,44,.6)'; c.stroke();
  }
  drawGate(t) {
    const c = this.c, n = this.puz.n, cell = this.cell, pad = this.pad, hero = this.puz.vs[0], ex = this.puz.exit;
    let cx, cy, ang;
    if (ex === 'R') { cx = pad + n * cell; cy = pad + (hero.f + 0.5) * cell; ang = 0; }
    else if (ex === 'L') { cx = pad; cy = pad + (hero.f + 0.5) * cell; ang = Math.PI; }
    else if (ex === 'B') { cx = pad + (hero.f + 0.5) * cell; cy = pad + n * cell; ang = Math.PI / 2; }
    else { cx = pad + (hero.f + 0.5) * cell; cy = pad; ang = -Math.PI / 2; }
    c.save(); c.translate(cx, cy); c.rotate(ang);
    // opening in the curb
    c.fillStyle = '#15B887'; rrect(c, -cell * 0.16, -cell * 0.5, cell * 0.32, cell, cell * 0.08); c.fill();
    c.fillStyle = '#0E7A5A'; c.fillRect(-cell * 0.04, -cell * 0.5, cell * 0.08, cell);
    // animated chevrons pointing out
    const ph = ((t || 0) / 700) % 1;
    for (let k = 0; k < 3; k++) {
      const f = (k + ph) % 3, x = cell * (0.12 + f * 0.17), a = Math.sin((f / 3) * Math.PI);
      c.globalAlpha = Math.max(0.2, Math.min(1, a * 1.3)); c.strokeStyle = '#4BE3B0'; c.lineWidth = cell * 0.08; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(x, -cell * 0.17); c.lineTo(x + cell * 0.12, 0); c.lineTo(x, cell * 0.17); c.stroke();
    }
    c.globalAlpha = 1; c.restore();
  }
  blit(v, p, alpha) {
    const c = this.c, u = this.cell, s = this.sprite(v);
    const r = this.rectOf(v, p);
    const cx = this.pad + (r[0] + r[2] / 2) * u, cy = this.pad + (r[1] + r[3] / 2) * u;
    const ang = ANG[(v.h ? 'h' : 'v') + (v.r ? 1 : 0)];
    const a0 = alpha != null ? alpha : 1;
    c.save(); c.translate(cx + u * 0.05, cy + u * 0.08); c.rotate(ang); c.globalAlpha = 0.5 * a0; c.drawImage(s.sh, -(s.L / 2 + s.m), -(s.W / 2 + s.m)); c.restore();
    c.save(); c.translate(cx, cy); c.rotate(ang); c.globalAlpha = a0;
    c.drawImage(s.cv, -(s.L / 2 + s.m), -(s.W / 2 + s.m));
    c.restore();
  }
  outline(v, p, col, width, pulse) {
    const c = this.c, u = this.cell, r = this.rectOf(v, p);
    const x = this.pad + r[0] * u, y = this.pad + r[1] * u, w = r[2] * u, h = r[3] * u, e = u * 0.04;
    c.save(); c.shadowColor = col; c.shadowBlur = u * (0.25 + 0.2 * pulse);
    rrect(c, x + e, y + e, w - 2 * e, h - 2 * e, u * 0.26); c.lineWidth = width; c.strokeStyle = col; c.globalAlpha = 0.55 + 0.45 * pulse; c.stroke(); c.restore();
  }
  // st: {vis[], t, wig:{i,amp}, hint:{i,to}, sel, heroAlpha, anim, particles[]}
  draw(st) {
    if (!this.puz) return;
    const c = this.c, vs = this.puz.vs, u = this.cell;
    c.clearRect(0, 0, this.cv.width, this.cv.height);
    this.drawBoard(st);
    const t = st.t || 0, pulse = st.anim === false ? 1 : 0.5 + 0.5 * Math.sin(t / 380);
    // hero marker underneath
    const order = [];
    for (let i = 1; i < vs.length; i++) order.push(i);
    if (st.sel > 0) { order.splice(order.indexOf(st.sel), 1); order.push(st.sel); }
    order.push(0);
    for (const i of order) {
      let p = st.vis[i];
      if (st.wig && st.wig.i === i) p += Math.sin(t / 28) * st.wig.amp;
      if (i === 0) this.outline(vs[0], p, '#FFC93C', Math.max(2, u * 0.07), pulse);
      this.blit(vs[i], p, i === 0 && st.heroAlpha != null ? st.heroAlpha : null);
      if (st.sel === i) this.outline(vs[i], p, '#FFFFFF', Math.max(2, u * 0.05), 0.6);
    }
    if (st.hint) this.drawHint(st, pulse);
    const ps = st.particles;
    if (ps && ps.length) for (const q of ps) { c.globalAlpha = Math.max(0, q.life); c.fillStyle = q.col; c.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s * 0.6); }
    c.globalAlpha = 1;
  }
  drawHint(st, pulse) {
    const c = this.c, u = this.cell, h = st.hint, v = this.puz.vs[h.i], from = st.vis[h.i];
    this.outline(v, from, '#19E3F3', Math.max(2, u * 0.06), pulse);
    const rt = this.rectOf(v, h.to), x = this.pad + rt[0] * u, y = this.pad + rt[1] * u;
    c.save(); c.setLineDash([u * 0.18, u * 0.12]); c.lineDashOffset = -(st.t || 0) / 40; c.lineWidth = Math.max(2, u * 0.06); c.strokeStyle = '#19E3F3';
    rrect(c, x + u * 0.05, y + u * 0.05, rt[2] * u - u * 0.1, rt[3] * u - u * 0.1, u * 0.24); c.stroke(); c.restore();
    // arrow chevrons from current to target
    const rf = this.rectOf(v, from);
    const x0 = this.pad + (rf[0] + rf[2] / 2) * u, y0 = this.pad + (rf[1] + rf[3] / 2) * u, x1 = this.pad + (rt[0] + rt[2] / 2) * u, y1 = this.pad + (rt[1] + rt[3] / 2) * u;
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, ph = ((st.t || 0) / 600) % 1;
    c.save(); c.strokeStyle = '#E8FDFF'; c.lineWidth = u * 0.09; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let k = 0; k < 3; k++) {
      const f = ((k + ph) % 3) / 3, px = x0 + dx * (0.2 + f * 0.6), py = y0 + dy * (0.2 + f * 0.6);
      c.globalAlpha = 0.25 + 0.75 * Math.sin(f * Math.PI);
      c.beginPath(); c.moveTo(px - ux * u * 0.12 - uy * u * 0.17, py - uy * u * 0.12 + ux * u * 0.17); c.lineTo(px + ux * u * 0.12, py + uy * u * 0.12); c.lineTo(px - ux * u * 0.12 + uy * u * 0.17, py - uy * u * 0.12 - ux * u * 0.17); c.stroke();
    }
    c.restore();
  }
}
