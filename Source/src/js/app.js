// RAHBAZ application shell: screens, navigation, modes, rewards. Everything runs offline.
import { LEVELS } from './levels-data.js';
import { PACKS } from './packs.js';
import { TYPES, TYPE_BY_ID, CATEGORIES, CAT_NAMES } from './vehicles.js';
import { t, setLang, getLang, isFa, num, fmtTime, vName } from './i18n.js';
import { h, add, clear, icon, starSvg, coinSvg } from './dom.js';
import { vehicleIcon } from './render.js';
import { Game } from './game.js';
import { generateAsync, starThresholds, difficultyOf } from './generator.js';
import { endlessOpts, dailyOpts, timeOpts, timeLimitFor, TIME_LEVELS } from './presets.js';
import { load, S, save, reset, isDone, doneCount, starsOf, playerLevel, levelProgress, todayKey } from './store.js';
import { ACHIEVEMENTS, SKIN_DEFS, MODES, MODE_PACKS, MODE_ICON } from './meta.js';
import { sfx, configAudio, unlockAudio, setHidden } from './audio.js';
import { hashStr } from './rng.js';

const VERSION = '1.0.2';
const BY_ID = {}; LEVELS.forEach((l) => { BY_ID[l.id] = l; });
const packLevels = (p) => LEVELS.filter((l) => l.pack === p);
const CLASSIC = LEVELS.filter((l) => l.pack <= 10);
const DIFF_COL = ['#15B887', '#2D6BFF', '#FFC93C', '#FF8A1F', '#E5484D', '#7C5CFF'];

let root, layerModal, layerToast, game, cur = '', curParams = {}, stack = [], screens = {}, booting = true;
let modals = [], gctx = null, gameEls = {}, busyEl = null, toastQ = [], toastBusy = false;

// ---------------------------------------------------------------- helpers
const el = h;
const skin = () => S().skin;
function isPackUnlocked(p) { return p === 1 || p === 11 || doneCount(packLevels(p - 1).map((l) => l.id)) >= 5; }
function unlockedIn(list, i) { return i === 0 || isDone(list[i - 1].id); }
function totalDone() { return doneCount(LEVELS.map((l) => l.id)); }
function nextUnfinished() {
  for (let p = 1; p <= 10; p++) { if (!isPackUnlocked(p)) break; const L = packLevels(p); for (let i = 0; i < L.length; i++) if (!isDone(L[i].id) && unlockedIn(L, i)) return { list: L, idx: i }; }
  return null;
}
function levelTitle(def) { return def.pack ? t('level') + ' ' + num(def.k) : def.title || ''; }
function diffName(d) { return t('d' + d); }
const packName = (p) => (isFa() ? p.fa : p.en);

function topbar(title, opts) {
  opts = opts || {};
  return el('div', { class: 'topbar' }, [
    el('button', { class: 'ibtn', 'aria-label': t('back'), onclick: () => { sfx('tap'); goBack(); } }, [icon('back')]),
    el('div', { class: 'ttl', text: title }),
    opts.coins === false ? el('div', { class: 'ibtn ghost' }) : coinChip(),
  ]);
}
function coinChip() { return el('div', { class: 'chip coinchip' }, [coinSvg(18), el('b', { text: num(S().coins) })]); }
function button(label, cls, fn, ico) { return el('button', { class: 'btn ' + (cls || ''), onclick: () => { unlockAudio(); sfx('tap'); fn(); } }, [ico ? icon(ico, 20) : null, el('span', { text: label })]); }

// ---------------------------------------------------------------- navigation
function go(name, params, replace) {
  if (cur && !replace && cur !== 'splash' && cur !== name) stack.push({ name: cur, params: curParams });
  else if (cur === name && !replace) { /* re-render same screen */ }
  cur = name; curParams = params || {}; render();
}
function goBack() {
  const p = stack.pop();
  if (cur === 'game') { leaveGame(); }
  if (!p) { cur = 'home'; curParams = {}; render(); return; }
  cur = p.name; curParams = p.params; render();
}
function render() {
  Object.keys(screens).forEach((k) => screens[k].classList.toggle('on', k === cur));
  if (game) game.setActive(cur === 'game');
  const R = { home, modes, packs, levels, shop, ach, stats, settings, about, help, splash };
  if (R[cur]) R[cur](screens[cur]);
  if (cur === 'game') requestAnimationFrame(() => game.fit());
}

// ---------------------------------------------------------------- toast & modal
function toast(msg, ico) {
  toastQ.push({ msg, ico }); if (!toastBusy) nextToast();
}
function nextToast() {
  const q = toastQ.shift();
  if (!q) { toastBusy = false; return; }
  toastBusy = true; clear(layerToast);
  const b = el('div', { class: 'toast' }, [q.ico ? icon(q.ico, 20) : null, el('span', { text: q.msg })]);
  layerToast.appendChild(b);
  setTimeout(() => { b.classList.add('out'); setTimeout(() => { if (b.parentNode) b.parentNode.removeChild(b); nextToast(); }, 250); }, 2100);
}
const tt = (k) => (/^[a-z][A-Za-z0-9]*$/.test(k) ? t(k) : k);

function openModal(content, opts) {
  opts = opts || {};
  const back = el('div', { class: 'mback' });
  const box = el('div', { class: 'modal' + (opts.cls ? ' ' + opts.cls : '') }, content);
  back.appendChild(box);
  if (opts.dismiss !== false) back.addEventListener('pointerdown', (e) => { if (e.target === back) { closeModal(); if (opts.onClose) opts.onClose(); } });
  layerModal.appendChild(back);
  const m = { back, opts };
  modals.push(m);
  requestAnimationFrame(() => back.classList.add('in'));
  return m;
}
function closeModal(silent) {
  const m = modals.pop();
  if (!m) return;
  if (m.back.parentNode) m.back.parentNode.removeChild(m.back);
  return m;
}
function closeAllModals() { while (modals.length) closeModal(); }
function confirmBox(msg, onYes) {
  openModal([el('p', { class: 'mmsg', text: msg }), el('div', { class: 'mbtns row' }, [button(t('cancel'), 'ghost', () => closeModal()), button(t('yes'), 'danger', () => { closeModal(); onYes(); })])]);
}
function showBusy(on) {
  if (on && !busyEl) { busyEl = el('div', { class: 'busy' }, [el('div', { class: 'spin' }), el('p', { text: t('preparing') })]); root.appendChild(busyEl); }
  else if (!on && busyEl) { busyEl.parentNode.removeChild(busyEl); busyEl = null; }
}

// ---------------------------------------------------------------- SPLASH / HOME
function splash(s) {
  clear(s);
  add(s, el('div', { class: 'splash' }, [el('img', { class: 'logo big', src: 'img/logo.svg', alt: 'RAHBAZ' }), el('h1', { class: 'brand', text: t('app') }), el('p', { class: 'tagline', text: 'RAHBAZ · ' + t('tag') }), el('div', { class: 'bar' }, [el('i')])]));
}
function home(s) {
  clear(s);
  const nu = nextUnfinished();
  const cont = nu ? { list: nu.list, idx: nu.idx } : null;
  const lastDef = S().last && BY_ID[S().last];
  const top = el('div', { class: 'topline' }, [
    el('div', { class: 'chip lvchip' }, [el('b', { text: t('plLevel') + ' ' + num(playerLevel()) }), el('div', { class: 'xpbar' }, [el('i', { style: { width: Math.round(levelProgress() * 100) + '%' } })])]),
    coinChip(),
  ]);
  const brand = el('div', { class: 'brandbox' }, [el('img', { class: 'logo', src: 'img/logo.svg', alt: '' }), el('div', {}, [el('h1', { class: 'brand', text: t('app') }), el('p', { class: 'tagline', text: 'RAHBAZ · ' + t('tag') })])]);
  const menu = el('div', { class: 'menu' }, [
    cont ? button(t('cont') + ' · ' + packName(PACKS[cont.list[0].pack - 1]) + ' ' + num(cont.list[cont.idx].k), 'primary big', () => startLevel('classic', cont.list, cont.idx), 'play')
      : button(t('cont'), 'primary big', () => { const L = lastDef ? packLevels(lastDef.pack) : packLevels(1); startLevel(lastDef ? (lastDef.pack === 11 ? 'moto' : 'classic') : 'classic', L, lastDef ? lastDef.k - 1 : 0); }, 'play'),
    el('div', { class: 'row2' }, [button(t('play'), 'alt', () => go('packs', { mode: 'classic' }), 'map'), button(t('modes'), 'alt', () => go('modes'), 'bolt')]),
    button(t('daily') + (S().daily.done && S().daily.date === todayKey() ? ' ✓' : ''), 'ghost', () => openMode('daily'), 'calendar'),
  ]);
  const dock = el('div', { class: 'dock' }, [['vehicles', 'garage', () => go('shop', { tab: 'garage' })], ['shop', 'shop', () => go('shop', { tab: 'skins' })], ['ach', 'trophy', () => go('ach')], ['stats', 'stats', () => go('stats')], ['help', 'help', () => go('help')], ['settings', 'settings', () => go('settings')], ['about', 'info', () => go('about')]].map((d) =>
    el('button', { class: 'dbtn', onclick: () => { sfx('tap'); d[2](); } }, [icon(d[1], 24), el('span', { text: t(d[0]) })])));
  const fleet = el('div', { class: 'fleet' });
  ['moto_sport', 'taxi', 'bus_city', 'truck_heavy', 'semi', 'excavator', 'ambulance'].forEach((id) => fleet.appendChild(vehicleIcon(id, { skin: skin(), w: 78, h: 38 })));
  add(s, el('div', { class: 'home' }, [top, brand, menu, dock, fleet]));
}

// ---------------------------------------------------------------- MODES / PACKS / LEVELS
function modeProgress(m) {
  if (m === 'classic') return num(doneCount(CLASSIC.map((l) => l.id))) + '/' + num(CLASSIC.length);
  if (MODE_PACKS[m]) { const ids = MODE_PACKS[m].reduce((a, p) => a.concat(packLevels(p)), []).map((l) => l.id); return num(doneCount(ids)) + '/' + num(ids.length); }
  if (m === 'endless') return t('best') + ' ' + num(S().endless.best);
  if (m === 'daily') return S().daily.date === todayKey() && S().daily.done ? '✓' : t('dailyStreak') + ' ' + num(S().daily.streak);
  if (m === 'time') return t('best') + ' ' + num(S().timeBest);
  if (m === 'min') return num(S().st.perfect);
  return '';
}
const MODE_KEYS = { classic: ['mClassic', 'mClassicD'], moto: ['mMoto', 'mMotoD'], heavy: ['mHeavy', 'mHeavyD'], public: ['mPublic', 'mPublicD'], emerg: ['mEmerg', 'mEmergD'], const: ['mConst', 'mConstD'], endless: ['mEndless', 'mEndlessD'], daily: ['mDaily', 'mDailyD'], time: ['mTime', 'mTimeD'], min: ['mMin', 'mMinD'] };
function modes(s) {
  clear(s);
  const list = el('div', { class: 'list' });
  MODES.forEach((m) => {
    const ic = el('div', { class: 'mic' }, [vehicleIcon(MODE_ICON[m], { skin: skin(), w: 64, h: 40 })]);
    list.appendChild(el('button', { class: 'card mode', onclick: () => { sfx('tap'); openMode(m); } }, [ic, el('div', { class: 'mtxt' }, [el('b', { text: t(MODE_KEYS[m][0]) }), el('small', { text: t(MODE_KEYS[m][1]) })]), el('span', { class: 'chip', text: modeProgress(m) })]));
  });
  add(s, [topbar(t('modes')), el('div', { class: 'scroll' }, list)]);
}
function openMode(m) {
  if (m === 'classic') go('packs', { mode: 'classic' });
  else if (m === 'min') go('packs', { mode: 'min' });
  else if (MODE_PACKS[m]) go('levels', { mode: m, packs: MODE_PACKS[m] });
  else if (m === 'endless') startEndless(1, 3, 0);
  else if (m === 'daily') startDaily();
  else if (m === 'time') timePicker();
}
function packs(s) {
  clear(s);
  const mode = curParams.mode || 'classic';
  const list = el('div', { class: 'list' });
  PACKS.filter((p) => mode === 'min' || p.id <= 10).forEach((p) => {
    const L = packLevels(p.id), open = isPackUnlocked(p.id), dn = doneCount(L.map((l) => l.id)), st = L.reduce((a, l) => a + starsOf(l.id), 0);
    const card = el('button', { class: 'card pack' + (open ? '' : ' lock'), onclick: () => { if (!open) { toast(t('locked') + ' · ' + t('packs'), 'lock'); sfx('bump'); return; } sfx('tap'); go('levels', { mode: mode === 'min' ? 'min' : (p.id === 11 ? 'moto' : 'classic'), packs: [p.id] }); } }, [
      el('div', { class: 'pic', style: { borderColor: p.color } }, [vehicleIcon(p.icon, { skin: skin(), w: 64, h: 40 })]),
      el('div', { class: 'mtxt' }, [el('b', { text: num(p.id) + '. ' + packName(p) }), el('small', { text: num(dn) + '/' + num(L.length) + ' · ' + num(st) + '/' + num(L.length * 3) + ' ★' }), el('div', { class: 'pbar' }, [el('i', { style: { width: Math.round(dn / L.length * 100) + '%', background: p.color } })])]),
      open ? icon('next', 22) : icon('lock', 22),
    ]);
    list.appendChild(card);
  });
  add(s, [topbar(mode === 'min' ? t('mMin') : t('packs')), el('div', { class: 'scroll' }, list)]);
}
function levels(s) {
  clear(s);
  const ps = curParams.packs, mode = curParams.mode;
  const full = ps.reduce((a, p) => a.concat(packLevels(p)), []);
  const wrap = el('div', { class: 'scroll' });
  ps.forEach((pid) => {
    const p = PACKS[pid - 1], L = packLevels(pid);
    wrap.appendChild(el('div', { class: 'packhead' }, [vehicleIcon(p.icon, { skin: skin(), w: 52, h: 32 }), el('b', { text: packName(p) })]));
    const grid = el('div', { class: 'lgrid' });
    L.forEach((l, i) => {
      const open = unlockedIn(L, i) || (ps.length > 1 && i === 0), stv = starsOf(l.id);
      const b = el('button', { class: 'lnode' + (open ? '' : ' lock') + (stv ? ' done' : ''), style: { borderColor: open ? DIFF_COL[l.d] : '' }, onclick: () => { if (!open) { sfx('bump'); return; } sfx('tap'); startLevel(mode, L, i); } }, [
        open ? el('b', { text: num(l.k) }) : icon('lock', 20),
        el('div', { class: 'mstars' }, [0, 1, 2].map((k) => starSvg(k < stv, 12))),
        l.lim ? el('i', { class: 'limdot', title: '', text: '⏱' }) : null,
      ]);
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
  });
  const key = { classic: 'mClassic', moto: 'mMoto', heavy: 'mHeavy', public: 'mPublic', emerg: 'mEmerg', const: 'mConst', min: 'mMin' }[mode] || 'map';
  add(s, [topbar(t(key)), wrap, el('div', { class: 'legend' }, DIFF_COL.map((c, i) => el('span', {}, [el('i', { style: { background: c } }), t('d' + i)])))]);
  void full;
}

// ---------------------------------------------------------------- SHOP / GARAGE
function shop(s) {
  clear(s);
  const tab = curParams.tab || 'skins';
  const tabs = el('div', { class: 'tabs' }, [['skins', 'sk'], ['garage', 'g']].map((x) => el('button', { class: 'tab' + (tab === x[0] ? ' on' : ''), onclick: () => { sfx('tap'); curParams.tab = x[0]; shop(s); }, text: x[0] === 'skins' ? t('skins') : t('garage') })));
  const body = el('div', { class: 'scroll' });
  if (tab === 'skins') {
    SKIN_DEFS.forEach((sk) => {
      const owned = S().skins.indexOf(sk.id) >= 0, on = S().skin === sk.id;
      const prev = el('div', { class: 'sprev' });
      ['sedan', 'bus_city', 'truck_heavy', 'moto_sport'].forEach((id, i) => prev.appendChild(vehicleIcon(id, { skin: sk.id, ci: i, w: 70, h: 34 })));
      let btn;
      if (on) btn = el('span', { class: 'chip ok', text: t('equipped') });
      else if (owned) btn = button(t('equip'), 'alt small', () => { S().skin = sk.id; save(true); if (game) game.setSkin(sk.id); shop(s); });
      else btn = button((sk.price ? num(sk.price) + ' ' : '') + t('buy'), 'primary small', () => buySkin(sk, s), 'shop');
      body.appendChild(el('div', { class: 'card skin' + (on ? ' on' : '') }, [el('div', { class: 'mtxt' }, [el('b', { text: t('sk_' + sk.id) }), prev]), btn]));
    });
  } else {
    CATEGORIES.forEach((c) => {
      body.appendChild(el('div', { class: 'packhead' }, [el('b', { text: CAT_NAMES[c][isFa() ? 0 : 1] }), el('small', { text: num(TYPES.filter((x) => x.cat === c).length) })]));
      const g = el('div', { class: 'ggrid' });
      TYPES.filter((x) => x.cat === c).forEach((v) => g.appendChild(el('div', { class: 'gcell' }, [vehicleIcon(v.id, { skin: skin(), w: 96, h: 50 }), el('b', { text: vName(v) }), el('small', { text: num(v.len) + '×' + num(v.wid) + ' ' + t('cells') })])));
      body.appendChild(g);
    });
  }
  add(s, [topbar(tab === 'skins' ? t('shop') : t('vehicles')), tabs, body]);
}
function buySkin(sk, s) {
  if (S().coins < sk.price) { toast(t('notEnough'), 'lock'); sfx('bump'); return; }
  S().coins -= sk.price; S().skins.push(sk.id); S().skin = sk.id; save(true); if (game) game.setSkin(sk.id);
  sfx('star'); toast(t('bought'), 'check'); shop(s);
}

// ---------------------------------------------------------------- ACHIEVEMENTS / STATS / HELP / SETTINGS / ABOUT
function tallies() { return { done: totalDone() }; }
function ach(s) {
  clear(s);
  const list = el('div', { class: 'list' }), tot = tallies();
  ACHIEVEMENTS.forEach((a) => {
    const got = !!S().ach[a.id], val = Math.min(a.n, a.get(S(), tot));
    list.appendChild(el('div', { class: 'card achc' + (got ? ' got' : '') }, [el('div', { class: 'aic' }, [icon(got ? 'trophy' : 'lock', 26)]), el('div', { class: 'mtxt' }, [el('b', { text: t('a_' + a.id) }), el('small', { text: t('a_' + a.id + '_d') }), el('div', { class: 'pbar' }, [el('i', { style: { width: Math.round(val / a.n * 100) + '%' } })])]), el('span', { class: 'chip', text: num(val) + '/' + num(a.n) })]));
  });
  add(s, [topbar(t('ach')), el('div', { class: 'scroll' }, list)]);
}
function row2(k, v) { return el('div', { class: 'srow' }, [el('span', { text: k }), el('b', { text: v })]); }
function stats(s) {
  clear(s);
  const st = S().st, d = totalDone(), stars = LEVELS.reduce((a, l) => a + starsOf(l.id), 0);
  const body = el('div', { class: 'scroll' }, [
    el('div', { class: 'card col' }, [row2(t('plLevel'), num(playerLevel())), row2(t('xp'), num(S().xp)), row2(t('coins'), num(S().coins)), row2(t('completed'), num(d) + '/' + num(LEVELS.length)), row2(t('totalStars'), num(stars) + '/' + num(LEVELS.length * 3)),
      row2(t('played'), num(st.played)), row2(t('totalMoves'), num(st.moves)), row2(t('totalTime'), fmtTime(st.time)), row2(t('hintsUsed'), num(st.hints)), row2(t('undoUsed'), num(st.undos)), row2(t('perfect'), num(st.perfect)), row2(t('bestEndless'), num(S().endless.best)), row2(t('bestTime'), num(S().timeBest)), row2(t('dailyStreak'), num(S().daily.streak))]),
    el('div', { class: 'packhead' }, [el('b', { text: t('packs') })]),
    el('div', { class: 'card col' }, PACKS.map((p) => { const L = packLevels(p.id); return el('div', { class: 'srow' }, [el('span', { text: packName(p) }), el('b', { text: num(doneCount(L.map((l) => l.id))) + '/' + num(L.length) + ' · ' + num(L.reduce((a, l) => a + starsOf(l.id), 0)) + '★' })]); })),
  ]);
  add(s, [topbar(t('stats')), body]);
}
function help(s) {
  clear(s);
  const hero = el('div', { class: 'hdemo' }, [el('div', { class: 'gold' }, [vehicleIcon('sedan', { skin: skin(), w: 90, h: 44 })]), icon('next', 26), el('div', { class: 'gate', text: '›››' })]);
  const items = [1, 2, 3, 4, 5, 6].map((i) => el('div', { class: 'card hitem' }, [el('b', { class: 'hn', text: num(i) }), el('p', { text: t('h' + i) })]));
  add(s, [topbar(t('help')), el('div', { class: 'scroll' }, [el('h2', { class: 'sec', text: t('helpTitle') }), hero, items])]);
}
function toggle(label, key, ico, after) {
  const on = !!S().set[key];
  return el('button', { class: 'srow toggle', onclick: () => { S().set[key] = !S().set[key]; save(true); applyAudio(); if (key === 'anim' && game) game.anim = S().set.anim; sfx('tap'); settings(screens.settings); } }, [el('span', {}, [icon(ico, 20), ' ' + label]), el('i', { class: 'sw' + (on ? ' on' : '') }, [el('u')])]);
}
function settings(s) {
  clear(s);
  const lang = el('div', { class: 'seg' }, [['fa', 'فارسی'], ['en', 'English']].map((l) => el('button', { class: getLang() === l[0] ? 'on' : '', onclick: () => { S().lang = l[0]; save(true); applyLang(); settings(s); }, text: l[1] })));
  add(s, [topbar(t('settings')), el('div', { class: 'scroll' }, [
    el('div', { class: 'card col' }, [el('div', { class: 'srow' }, [el('span', {}, [icon('globe', 20), ' ' + t('lang')]), lang]), toggle(t('sound'), 'sfx', 'sound'), toggle(t('music'), 'music', 'music'), toggle(t('anim'), 'anim', 'bolt')]),
    el('div', { class: 'card col' }, [button(t('resetAll'), 'danger', () => confirmBox(t('resetAsk'), () => { reset(); applyLang(); applyAudio(); stack = []; toast(t('resetDone'), 'check'); go('home', {}, true); }), 'reset')]),
    el('p', { class: 'small', text: t('app') + ' ' + VERSION }),
  ])]);
}
function about(s) {
  clear(s);
  add(s, [topbar(t('about')), el('div', { class: 'scroll about' }, [el('img', { class: 'logo big', src: 'img/logo.svg', alt: '' }), el('h1', { class: 'brand', text: 'RAHBAZ' }), el('p', { class: 'tagline', text: t('app') + ' – ' + t('tag') }), el('p', { text: t('aboutText') }),
    el('div', { class: 'card col' }, [row2(t('version'), VERSION), row2(t('creator'), isFa() ? 'حمید یارعلی (Hamid Yarali)' : 'Hamid Yarali')]), el('p', { class: 'small', text: t('offline') }), el('p', { class: 'small', text: t('fontCredit') })])]);
}

// ---------------------------------------------------------------- GAME SCREEN
function buildGameScreen(s) {
  const hud = el('div', { class: 'hud' });
  gameEls.pause = el('button', { class: 'ibtn', 'aria-label': 'pause', onclick: () => { sfx('tap'); openPause(); } }, [icon('pause')]);
  gameEls.title = el('b', { class: 'gtitle' }); gameEls.diff = el('span', { class: 'chip dchip' }); gameEls.info = el('small', { class: 'ginfo' });
  gameEls.moves = el('b'); gameEls.time = el('b'); gameEls.stars = el('div', { class: 'mstars big' }, [0, 1, 2].map(() => starSvg(true, 20)));
  add(hud, [gameEls.pause, el('div', { class: 'gt' }, [gameEls.title, gameEls.diff, gameEls.info]),
    el('div', { class: 'gstats' }, [el('div', { class: 'gs' }, [el('small', { text: t('moves') }), gameEls.moves]), el('div', { class: 'gs' }, [el('small', { text: t('time') }), gameEls.time]), gameEls.stars])]);
  gameEls.canvas = el('canvas', { class: 'board' });
  gameEls.wrap = el('div', { class: 'bwrap' }, [gameEls.canvas]);
  const mk = (ico, key, fn) => { const b = el('button', { class: 'tool', onclick: () => { unlockAudio(); fn(); } }, [icon(ico, 26), el('span', { text: t(key) })]); return b; };
  gameEls.tools = el('div', { class: 'tools' });
  gameEls.toolDefs = [['undo', 'undo', () => game.undo()], ['hint', 'hint', () => game.showHint()], ['reset', 'reset', () => game.reset()]];
  add(s, el('div', { class: 'gscreen' }, [hud, gameEls.wrap, gameEls.tools]));
  fillTools(mk);
  game = new Game(gameEls.canvas, gameEls.wrap, { hud: hudUpdate, win: onWin, fail: onFail, toast: (k) => toast(tt(k)) });
}
function fillTools(mk) {
  clear(gameEls.tools);
  const mkf = mk || ((ico, key, fn) => el('button', { class: 'tool', onclick: () => { unlockAudio(); fn(); } }, [icon(ico, 26), el('span', { text: t(key) })]));
  gameEls.toolDefs.forEach((d) => gameEls.tools.appendChild(mkf(d[0], d[1], d[2])));
}
function hudUpdate(sn) {
  gameEls.moves.textContent = num(sn.moves) + (sn.lim ? ' / ' + num(sn.lim) : '');
  gameEls.moves.className = sn.lim && sn.lim - sn.moves < 3 ? 'warn' : '';
  if (sn.timeLeft != null) { gameEls.time.textContent = fmtTime(sn.timeLeft); gameEls.time.className = sn.timeLeft < 10 ? 'warn' : ''; } else { gameEls.time.textContent = fmtTime(sn.time); gameEls.time.className = ''; }
  const k = gameEls.stars.children; for (let i = 0; i < 3; i++) k[i].className = 'star' + (i < sn.stars ? ' on' : '');
}
function setGameInfo(def, info) {
  gameEls.title.textContent = levelTitle(def);
  const d = def.d != null ? def.d : difficultyOf(def.min);
  gameEls.diff.textContent = diffName(d); gameEls.diff.style.background = DIFF_COL[d];
  gameEls.info.textContent = info || '';
  const lab = gameEls.moves.parentNode.firstChild; lab.textContent = t('moves'); gameEls.time.parentNode.firstChild.textContent = t('time');
  fillTools();
}
function leaveGame() { if (game) { game.paused = false; game.state = 'idle'; } closeAllModals(); showBusy(false); }

function loadGame(def, cfg, info) {
  cfg = Object.assign({ skin: skin(), anim: S().set.anim }, cfg);
  if (cur !== 'game') { go('game', {}); }
  setGameInfo(def, info);
  closeAllModals();
  game.load(def, cfg);
  S().last = def.id && def.pack ? def.id : S().last; save();
  requestAnimationFrame(() => game.fit());
}
function startLevel(mode, list, idx) {
  const def = list[idx];
  gctx = { kind: 'level', mode, list, idx };
  const info = mode === 'min' ? t('goal') + ': ' + num(def.min) + ' ' + t('moves') : def.lim ? t('limit') + ': ' + num(def.lim) : '';
  loadGame(def, { lim: def.lim }, info);
}
function nextTarget() {
  if (!gctx || gctx.kind !== 'level') return null;
  const { list, idx, mode } = gctx;
  if (idx + 1 < list.length) return { mode, list, idx: idx + 1 };
  if (mode === 'classic' && list[0].pack < 10 && isPackUnlocked(list[0].pack + 1)) return { mode, list: packLevels(list[0].pack + 1), idx: 0 };
  return null;
}

// ---- generated modes
async function makeDef(opts, id, title, fallbackSeed) {
  showBusy(true);
  let r = null;
  try { r = await generateAsync(opts); } catch (e) { r = null; }
  showBusy(false);
  if (!r) { const L = packLevels(2); const base = L[fallbackSeed % L.length]; return Object.assign({}, base, { id, pack: 0, title }); }
  return { id, pack: 0, title, n: r.n, exit: r.exit, walls: r.walls, veh: r.veh, min: r.min, d: difficultyOf(r.min), stars: starThresholds(r.min) };
}
async function startEndless(round, lives, score) {
  gctx = { kind: 'endless', round, lives, score };
  const seed = (hashStr('e' + Date.now()) + round * 97) >>> 0;
  const def = await makeDef(endlessOpts(round, seed), 'endless', t('round') + ' ' + num(round), round);
  if (!gctx || gctx.kind !== 'endless') return;
  def.lim = def.min * 2 + 4;
  loadGame(def, { lim: def.lim }, t('lives') + ': ' + '♥'.repeat(lives));
}
async function startDaily() {
  const key = todayKey();
  gctx = { kind: 'daily', key };
  if (cur !== 'game') go('game', {});
  const def = await makeDef(dailyOpts(key), 'daily-' + key, key, 1);
  if (!gctx || gctx.kind !== 'daily') return;
  loadGame(def, {}, t('daily'));
}
function timePicker() {
  openModal([el('h3', { text: t('mTime') }), el('p', { class: 'mmsg', text: t('pickDiff') }), el('div', { class: 'mbtns' }, ['easy', 'medium', 'hard'].map((d, i) => button(t(d), ['primary', 'alt', 'danger'][i], () => { closeModal(); startTime(d, 0); }))), button(t('cancel'), 'ghost', () => closeModal())]);
}
async function startTime(diff, streak) {
  gctx = { kind: 'time', diff, streak };
  const seed = (hashStr('t' + Date.now()) + streak * 31) >>> 0;
  const def = await makeDef(timeOpts(diff, seed), 'time', t(diff), streak);
  if (!gctx || gctx.kind !== 'time') return;
  const limit = timeLimitFor(diff, def.min);
  loadGame(def, { timeLimit: limit }, t('streak') + ': ' + num(streak));
}

// ---------------------------------------------------------------- PAUSE / WIN / FAIL
function openPause() {
  if (cur !== 'game' || !game || game.state !== 'play' || game.paused || modals.length) return;
  game.paused = true;
  const resume = () => { closeModal(); game.paused = false; game.kick(); };
  const m = openModal([el('h3', { text: t('paused') }), el('div', { class: 'mbtns' }, [
    button(t('resume'), 'primary', resume, 'play'),
    button(t('restart'), 'alt', () => { closeModal(); game.paused = false; game.restart(); }, 'reset'),
    button(t('solution'), 'ghost', () => { closeModal(); game.paused = false; game.playSolution(); toast(t('solUsed')); }, 'hint'),
    el('div', { class: 'row2' }, [toggle(t('sound'), 'sfx', 'sound').cloneNode(false)].slice(0, 0)),
    button(t('quit'), 'danger', () => { closeModal(); goBack(); }, 'home')])], { dismiss: false, cls: 'pause' });
  void m;
}
function levelXp(first, stars) { return first ? 10 + stars * 5 : 3; }

function onWin(res) {
  const sv = S(), def = game.def, st = sv.st;
  let coins = 0, firstSolve = false, newBest = false, unlockMsg = '';
  st.played++; st.solved++; st.moves += res.moves; st.time += Math.round(res.time); st.hints += res.hints; st.undos += res.undos;
  const heroT = TYPE_BY_ID[def.veh[0][0]];
  if (heroT.cat === 'moto') st.exitMoto++;
  if (heroT.id === 'ambulance') st.exitAmb++;
  if (heroT.cat === 'truck' || heroT.cat === 'trailer') st.exitTruck++;
  if (res.hints === 0 && !res.solUsed) st.noHint++;
  if (res.perfect) st.perfect++;
  let extra = '';
  if (gctx && gctx.kind === 'level') {
    const rec = sv.lv[def.id] || { s: 0, b: 0, t: 0, n: 0 };
    firstSolve = rec.s === 0;
    newBest = firstSolve || res.stars > rec.s || (res.stars === rec.s && res.moves < rec.b);
    coins = firstSolve ? 10 + res.stars * 5 : res.stars > rec.s ? (res.stars - rec.s) * 5 : 2;
    if (firstSolve && def.d >= 4) st.expert++;
    const wasPack = def.pack < 11 && def.pack < 10 ? isPackUnlocked(def.pack + 1) : true;
    rec.s = Math.max(rec.s, res.stars); rec.b = rec.b ? Math.min(rec.b, res.moves) : res.moves; rec.t = rec.t ? Math.min(rec.t, Math.round(res.time)) : Math.round(res.time); rec.n++;
    sv.lv[def.id] = rec;
    if (!wasPack && isPackUnlocked(def.pack + 1)) { unlockMsg = t('packUnlocked') + packName(PACKS[def.pack]); }
    if (gctx.mode === 'min' && res.perfect && !sv.minDone[def.id]) { sv.minDone[def.id] = 1; coins += 15; }
    sv.xp += levelXp(firstSolve, res.stars);
  } else if (gctx && gctx.kind === 'endless') { coins = 3; gctx.score++; sv.xp += 6; if (gctx.score > sv.endless.best) { sv.endless.best = gctx.score; newBest = true; } }
  else if (gctx && gctx.kind === 'time') { coins = 4; gctx.streak++; sv.xp += 8; if (gctx.streak > sv.timeBest) { sv.timeBest = gctx.streak; newBest = true; } }
  else if (gctx && gctx.kind === 'daily') {
    const key = gctx.key;
    if (!(sv.daily.date === key && sv.daily.done)) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yk = y.getFullYear() + '-' + ('0' + (y.getMonth() + 1)).slice(-2) + '-' + ('0' + y.getDate()).slice(-2);
      sv.daily.streak = sv.daily.lastDone === yk ? sv.daily.streak + 1 : 1; sv.daily.lastDone = key; sv.daily.date = key; sv.daily.done = true;
      coins = 25 + Math.min(sv.daily.streak, 7) * 3; sv.xp += 20; extra = t('dailyStreak') + ': ' + num(sv.daily.streak);
    }
  }
  sv.coins += coins; sv.lastPlay = Date.now();
  const newAch = checkAch();
  save(true);
  winModal(res, { coins, newBest, unlockMsg, extra, newAch });
}
function checkAch() {
  const tot = tallies(), got = [];
  ACHIEVEMENTS.forEach((a) => { if (!S().ach[a.id] && a.get(S(), tot) >= a.n) { S().ach[a.id] = Date.now(); S().coins += 20; got.push(a.id); } });
  return got;
}
function winModal(res, info) {
  const kind = gctx ? gctx.kind : 'level';
  const stars = el('div', { class: 'wstars' }, [0, 1, 2].map((i) => { const s = starSvg(i < res.stars, 44); s.style.animationDelay = (0.25 + i * 0.3) + 's'; if (i < res.stars) setTimeout(() => sfx('star'), 350 + i * 300); return s; }));
  const nt = nextTarget();
  const isMinFail = gctx && gctx.mode === 'min' && !res.perfect;
  const title = isMinFail ? t('notMin') : gctx && gctx.mode === 'min' ? t('perfectMin') : t('complete');
  const lines = [el('h3', { class: 'win', text: title }), kind === 'level' || kind === 'daily' || kind === 'time' || kind === 'endless' ? stars : null,
    el('div', { class: 'wgrid' }, [row2(t('moves'), num(res.moves) + (res.min ? ' (' + t('minShort') + ' ' + num(res.min) + ')' : '')), row2(t('time'), fmtTime(res.time)), row2(t('score'), num(res.score)),
      kind === 'endless' ? row2(t('round'), num(gctx.score)) : null, kind === 'time' ? row2(t('streak'), num(gctx.streak)) : null])];
  if (info.newBest) lines.push(el('div', { class: 'chip ok', text: t('newBest') }));
  if (info.coins) lines.push(el('div', { class: 'reward' }, [coinSvg(22), el('b', { text: '+' + num(info.coins) })]));
  if (info.extra) lines.push(el('p', { class: 'small', text: info.extra }));
  if (info.unlockMsg) lines.push(el('p', { class: 'unlock', text: info.unlockMsg })), sfx('open');
  if (res.solUsed) lines.push(el('p', { class: 'small', text: t('solUsed') }));
  if (isMinFail) lines.push(el('p', { class: 'small', text: t('moveMin') + num(res.min) }));
  const btns = [];
  if (kind === 'endless') btns.push(button(t('next'), 'primary', () => startEndless(gctx.round + 1, gctx.lives, gctx.score), 'next'));
  else if (kind === 'time') btns.push(button(t('next'), 'primary', () => startTime(gctx.diff, gctx.streak), 'next'));
  else if (kind === 'level') {
    if (isMinFail) btns.push(button(t('tryAgain'), 'primary', () => { closeModal(); game.restart(); }, 'replay'));
    else if (nt) btns.push(button(t('next'), 'primary', () => startLevel(nt.mode, nt.list, nt.idx), 'next'));
    if (!isMinFail) btns.push(button(t('replay'), 'alt', () => { closeModal(); game.restart(); }, 'replay'));
  } else btns.push(button(t('replay'), 'alt', () => { closeModal(); game.restart(); }, 'replay'));
  btns.push(button(kind === 'level' ? t('map') : t('home'), 'ghost', () => { closeModal(); goBack(); }, kind === 'level' ? 'map' : 'home'));
  lines.push(el('div', { class: 'mbtns' }, btns));
  setTimeout(() => { if (cur !== 'game') return; sfx('complete'); openModal(lines, { dismiss: false, cls: 'wmodal' }); announceAch(info.newAch); }, 450);
}
function announceAch(list) { (list || []).forEach((id) => { toast(t('newAch') + ': ' + t('a_' + id), 'trophy'); setTimeout(() => sfx('ach'), 200); }); }

function onFail(reason) {
  const kind = gctx ? gctx.kind : 'level';
  if (kind === 'endless' && reason === 'moves') {
    gctx.lives--;
    if (gctx.lives > 0) { toast(t('outMoves') + ' · ' + t('lives') + ' ' + num(gctx.lives), 'lock'); setTimeout(() => startEndless(gctx.round, gctx.lives, gctx.score), 900); return; }
  }
  S().st.played++; save(true);
  const msg = reason === 'time' ? t('timeUp') : t('outMoves');
  const lines = [el('h3', { class: 'fail', text: t('failed') }), el('p', { class: 'mmsg', text: msg })];
  if (kind === 'endless') lines.push(el('div', { class: 'wgrid' }, [row2(t('round'), num(gctx.score)), row2(t('best'), num(S().endless.best))]));
  if (kind === 'time') lines.push(el('div', { class: 'wgrid' }, [row2(t('streak'), num(gctx.streak)), row2(t('best'), num(S().timeBest))]));
  const btns = [];
  const retry = kind === 'endless' ? () => startEndless(1, 3, 0) : kind === 'time' ? () => startTime(gctx.diff, 0) : () => { closeModal(); game.restart(); };
  btns.push(button(t('tryAgain'), 'primary', retry, 'replay'), button(t('home'), 'ghost', () => { closeModal(); goBack(); }, 'home'));
  lines.push(el('div', { class: 'mbtns' }, btns));
  setTimeout(() => { if (cur === 'game') openModal(lines, { dismiss: false, cls: 'fmodal' }); }, 350);
}

// ---------------------------------------------------------------- app level
function applyAudio() { const s = S().set; configAudio(s.sfx, s.music); }
function applyLang() {
  setLang(S().lang);
  const d = document.documentElement; d.lang = getLang(); d.dir = isFa() ? 'rtl' : 'ltr';
  document.title = t('app') + ' – RAHBAZ';
  if (cur) render();
  if (gameEls.title && cur === 'game' && game.def) setGameInfo(game.def, gameEls.info.textContent);
}
function onBg() {
  setHidden(true); save(true);
  if (cur === 'game' && game && game.state === 'play' && !game.paused && !modals.length) openPause();
}
function backPress() {
  if (booting) return 'busy';
  if (busyEl) return 'busy';
  if (modals.length) {
    const top = modals[modals.length - 1];
    if (cur === 'game' && top.opts.cls === 'pause') { closeModal(); game.paused = false; game.kick(); return 'game'; }
    if (cur === 'game' && (top.opts.cls === 'wmodal' || top.opts.cls === 'fmodal')) { closeModal(); goBack(); return 'menu'; }
    closeModal(); return 'menu';
  }
  if (cur === 'game') { if (game.state === 'play' && !game.paused) { openPause(); return 'game'; } goBack(); return 'menu'; }
  if (cur === 'home' || cur === 'splash') return 'exit';
  goBack(); return 'menu';
}

export function start() {
  load(); setLang(S().lang);
  root = document.getElementById('app');
  ['splash', 'home', 'modes', 'packs', 'levels', 'shop', 'ach', 'stats', 'settings', 'about', 'help', 'game'].forEach((n) => { const d = el('div', { class: 'screen', id: 's-' + n }); screens[n] = d; root.appendChild(d); });
  layerModal = el('div', { id: 'modal' }); layerToast = el('div', { id: 'toast' }); root.appendChild(layerModal); root.appendChild(layerToast);
  buildGameScreen(screens.game);
  applyAudio(); applyLang();
  let rz = 0;
  window.addEventListener('resize', () => { if (rz) return; rz = requestAnimationFrame(() => { rz = 0; if (cur === 'game') game.fit(); }); });
  window.addEventListener('orientationchange', () => setTimeout(() => { if (cur === 'game') game.fit(); }, 250));
  document.addEventListener('visibilitychange', () => { if (document.hidden) onBg(); else { setHidden(false); if (S().set.music) unlockAudio(); } });
  window.addEventListener('pagehide', () => { save(true); });
  document.addEventListener('pointerdown', () => unlockAudio(), { passive: true });
  window.__ic = { back: backPress, bg: onBg, version: VERSION, debug: () => ({ cur, modals: modals.length, state: game && game.state }), _app: { go, startLevel, startEndless, startDaily, startTime, openPause, game: () => game, S, LEVELS } };
  cur = 'splash'; render();
  setTimeout(() => { booting = false; go('home', {}, true); if (window.__boot) window.__boot.done(); }, 1200);
  if (window.__boot) window.__boot.stage('ui-ready');
}
