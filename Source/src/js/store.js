// Local, versioned save data. A corrupted save never crashes the game: it is backed up and replaced by a fresh one.
const KEY = 'rahbaz.save', BAD = 'rahbaz.save.bad';
export const SAVE_VERSION = 1;

export function freshSave() {
  return {
    v: SAVE_VERSION, lang: 'fa', coins: 50, xp: 0, skin: 'classic', skins: ['classic'],
    set: { sfx: true, music: true, anim: true },
    lv: {}, ach: {}, last: null, lastPlay: 0,
    daily: { date: '', done: false, streak: 0, lastDone: '' },
    endless: { best: 0 }, timeBest: 0, minDone: {},
    st: { played: 0, solved: 0, moves: 0, time: 0, hints: 0, undos: 0, exitMoto: 0, exitAmb: 0, exitTruck: 0, expert: 0, perfect: 0, noHint: 0 },
  };
}

function migrate(d) {
  // Future schema upgrades go here: keep old fields, add new ones with defaults.
  const f = freshSave();
  const out = Object.assign({}, f, d);
  out.set = Object.assign({}, f.set, d.set || {});
  out.st = Object.assign({}, f.st, d.st || {});
  out.daily = Object.assign({}, f.daily, d.daily || {});
  out.endless = Object.assign({}, f.endless, d.endless || {});
  if (!Array.isArray(out.skins) || out.skins.indexOf('classic') < 0) out.skins = ['classic'].concat(Array.isArray(out.skins) ? out.skins : []);
  if (typeof out.lv !== 'object' || !out.lv) out.lv = {};
  if (typeof out.ach !== 'object' || !out.ach) out.ach = {};
  if (typeof out.minDone !== 'object' || !out.minDone) out.minDone = {};
  out.v = SAVE_VERSION;
  return out;
}

let data = freshSave();
let timer = 0;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try { data = migrate(JSON.parse(raw)); }
      catch (e) { try { localStorage.setItem(BAD, raw); } catch (e2) { /* ignore */ } data = freshSave(); }
    }
  } catch (e) { data = freshSave(); }
  return data;
}
export const S = () => data;
export function save(now) {
  if (now) { clearTimeout(timer); timer = 0; write(); return; }
  if (timer) return;
  timer = setTimeout(() => { timer = 0; write(); }, 400);
}
function write() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage full or blocked – game keeps running */ } }
export function reset() { const keep = data.lang, set = data.set; data = freshSave(); data.lang = keep; data.set = set; write(); }

export const levelRec = (id) => data.lv[id] || null;
export const isDone = (id) => !!(data.lv[id] && data.lv[id].s > 0);
export const doneCount = (ids) => ids.filter(isDone).length;
export const starsOf = (id) => (data.lv[id] ? data.lv[id].s : 0);
export const playerLevel = () => Math.floor(Math.sqrt(data.xp / 40)) + 1;
export const levelProgress = () => { const l = playerLevel(); const a = 40 * (l - 1) * (l - 1), b = 40 * l * l; return (data.xp - a) / (b - a); };
export const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
