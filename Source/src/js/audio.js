// Fully synthesised audio (no sound files): short effects + a light procedural background loop. WebAudio only.
let ctx = null, master = null, sfxG = null, musG = null;
const flags = { sfx: true, music: true };
let musicTimer = 0, step = 0, nextT = 0, wantMusic = false, hidden = false;

function ensure() {
  if (ctx) { if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } } return true; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxG = ctx.createGain(); sfxG.gain.value = 0.7; sfxG.connect(master);
    musG = ctx.createGain(); musG.gain.value = 0.16; musG.connect(master);
  } catch (e) { ctx = null; return false; }
  return true;
}
export function unlockAudio() { if (ensure() && wantMusic) startMusic(); }
export function configAudio(sfx, music) { flags.sfx = sfx; flags.music = music; wantMusic = music; if (music) startMusic(); else stopMusic(); }
export function setHidden(h) { hidden = h; if (h) stopMusic(); else if (wantMusic) startMusic(); }

function tone(type, f0, f1, dur, vol, delay, dest) {
  const t = ctx.currentTime + (delay || 0);
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur, vol, fHi, delay) {
  const t = ctx.currentTime + (delay || 0), n = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fHi || 1200;
  const g = ctx.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(sfxG); s.start(t);
}
const FX = {
  tap: () => tone('sine', 880, 700, 0.06, 0.25),
  move: () => { tone('triangle', 240, 170, 0.09, 0.22); noise(0.05, 0.1, 900); },
  brake: () => { tone('sawtooth', 820, 380, 0.14, 0.05); noise(0.12, 0.08, 3000); },
  bump: () => { tone('sine', 130, 55, 0.13, 0.4); noise(0.07, 0.18, 700); },
  open: () => { tone('sine', 520, 520, 0.12, 0.2); tone('sine', 780, 780, 0.16, 0.2, 0.09); },
  exit: () => { tone('sawtooth', 70, 260, 0.6, 0.12); tone('triangle', 140, 520, 0.6, 0.08); noise(0.5, 0.05, 600); },
  complete: () => { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.28, 0.28, i * 0.11)); },
  star: () => { tone('sine', 1200, 1800, 0.18, 0.22); tone('sine', 1800, 2400, 0.12, 0.1, 0.05); },
  ach: () => { [659, 784, 988, 1319].forEach((f, i) => tone('square', f, f, 0.2, 0.09, i * 0.09)); tone('triangle', 1319, 1319, 0.5, 0.2, 0.36); },
  hint: () => tone('sine', 600, 980, 0.22, 0.2),
  fail: () => { tone('sawtooth', 300, 120, 0.4, 0.14); tone('triangle', 200, 90, 0.5, 0.15, 0.1); },
};
export function sfx(name) {
  if (!flags.sfx || !ensure() || !FX[name]) return;
  try { FX[name](); } catch (e) { /* audio must never break gameplay */ }
}

const SCALE = [0, 3, 5, 7, 10, 12, 15, 17];
const BASS = [110, 110, 82.4, 98];
function playStep() {
  const base = 220, i = step % 32;
  const bar = Math.floor(i / 8);
  const pat = [0, 2, 4, 2, 5, 4, 2, 1];
  if (i % 2 === 0) tone('triangle', base * Math.pow(2, SCALE[pat[(i / 2 + bar) % 8]] / 12), 0, 0.28, 0.5, nextT - ctx.currentTime, musG);
  if (i % 8 === 0) tone('sine', BASS[bar], 0, 0.9, 0.9, nextT - ctx.currentTime, musG);
  step++;
}
function pump() {
  if (!ctx || !wantMusic || hidden) return;
  while (nextT < ctx.currentTime + 0.35) { if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.02; playStep(); nextT += 0.26; }
}
function startMusic() {
  if (!flags.music || !ensure() || musicTimer) return;
  nextT = ctx.currentTime + 0.1; musicTimer = setInterval(pump, 120);
}
function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = 0; } }
