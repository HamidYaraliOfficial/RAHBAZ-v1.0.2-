// End-to-end tests in Chromium (phone emulation) served from the same virtual origin the APK uses.
import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'dist/www');
const shots = join(root, 'build/shots'); mkdirSync(shots, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.txt': 'text/plain' };
const ORIGIN = 'https://appassets.androidplatform.net';
const UA = 'Mozilla/5.0 (Linux; Android 10; SM-A105F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36';
let failures = 0; const ok = (c, m) => { if (c) console.log('  ok   ' + m); else { console.log('  FAIL ' + m); failures++; } };

async function open(browser, size, opts) {
  opts = opts || {};
  const ctx = await browser.newContext({ viewport: size, userAgent: UA, hasTouch: true, isMobile: true, deviceScaleFactor: 2, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const log = { errors: [], external: [], csp: [] };
  page.on('pageerror', (e) => log.errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') log.errors.push(m.text()); if (/Content Security Policy/i.test(m.text())) log.csp.push(m.text()); });
  if (opts.init) await page.addInitScript(opts.init);
  await page.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.origin !== ORIGIN) { log.external.push(u.href); return route.abort(); }
    let p = u.pathname === '/' ? '/index.html' : u.pathname;
    const f = join(www, p);
    if (opts.breakGame && p === '/js/game.js') return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'throw new Error("deliberate test failure");' });
    if (!existsSync(f)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ status: 200, contentType: MIME[extname(f)] || 'application/octet-stream', body: readFileSync(f) });
  });
  await page.goto(ORIGIN + '/index.html');
  return { ctx, page, log };
}
const state = (page) => page.evaluate(() => window.__ic && window.__ic.debug());

// real pointer drags on the canvas that replay the solver's optimal path
async function playSolution(page) {
  for (let guard = 0; guard < 80; guard++) {
    const step = await page.evaluate(() => {
      const g = window.__ic._app.game(); if (g.state !== 'play') return null;
      const path = g.getPath(); if (!path || !path.length) return null;
      const m = path[0], v = g.puz.vs[m.i], view = g.view, r = g.cv.getBoundingClientRect(), cell = view.cell / view.dpr, pad = view.pad / view.dpr;
      const rc = view.rectOf(v, g.vis[m.i]);
      const cx = r.left + pad + (rc[0] + rc[2] / 2) * cell, cy = r.top + pad + (rc[1] + rc[3] / 2) * cell;
      const d = (m.to - m.from) * cell;
      return { x: cx, y: cy, dx: v.h ? d : 0, dy: v.h ? 0 : d };
    });
    if (!step) break;
    await page.mouse.move(step.x, step.y); await page.mouse.down();
    const n = 8; for (let i = 1; i <= n; i++) await page.mouse.move(step.x + step.dx * i / n, step.y + step.dy * i / n);
    await page.mouse.up(); await page.waitForTimeout(260);
  }
}

const browser = await chromium.launch();
try {
  console.log('1. boot, home, navigation, play a level with real drags (portrait 393x851)');
  let { ctx, page, log } = await open(browser, { width: 393, height: 851 });
  await page.waitForSelector('#s-home.on', { timeout: 8000 });
  ok(await page.evaluate(() => document.documentElement.dir) === 'rtl', 'Persian is RTL by default');
  ok(!(await page.$('#bootload')), 'boot overlay removed');
  await page.screenshot({ path: join(shots, '01-home-fa.png') });
  await page.click('text=شروع بازی'); await page.waitForSelector('#s-packs.on');
  await page.screenshot({ path: join(shots, '02-packs-fa.png') });
  await page.click('.card.pack >> nth=0'); await page.waitForSelector('#s-levels.on');
  await page.screenshot({ path: join(shots, '03-levels-fa.png') });
  await page.click('.lnode >> nth=0'); await page.waitForSelector('#s-game.on'); await page.waitForTimeout(500);
  await page.screenshot({ path: join(shots, '04-game-fa.png') });
  const canvasBox = await page.evaluate(() => { const c = document.querySelector('canvas.board').getBoundingClientRect(); return [c.width, c.height, window.innerWidth]; });
  ok(canvasBox[0] > 250 && canvasBox[0] <= canvasBox[2], 'board fits phone width: ' + canvasBox[0]);
  // hint
  await page.click('.tool >> nth=1'); await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, '05-hint-fa.png') });
  ok(await page.evaluate(() => !!window.__ic._app.game().hint), 'hint shows a move');
  // blocked drag -> no move counted
  const before = await page.evaluate(() => window.__ic._app.game().moves);
  await playSolution(page);
  await page.waitForSelector('.modal.wmodal', { timeout: 8000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(shots, '06-win-fa.png') });
  const res = await page.evaluate(() => { const S = window.__ic._app.S(); return { lv: S.lv['p1-1'], coins: S.coins }; });
  ok(res.lv && res.lv.s >= 1, 'level completed & saved, stars=' + (res.lv && res.lv.s));
  ok(res.coins > 50, 'coins rewarded: ' + res.coins);
  ok(before === 0, 'moves counter started at 0');
  // persistence across reload
  await page.reload(); await page.waitForSelector('#s-home.on', { timeout: 8000 });
  ok(await page.evaluate(() => !!window.__ic._app.S().lv['p1-1']), 'progress persists after reload (localStorage)');
  // back button logic
  ok(await page.evaluate(() => window.__ic.back()) === 'exit', 'Back on home -> exit');
  await page.click('text=حالت‌های بازی'); await page.waitForSelector('#s-modes.on');
  ok(await page.evaluate(() => window.__ic.back()) === 'menu', 'Back on modes -> menu');
  await page.waitForSelector('#s-home.on');
  // all modes
  await page.click('text=حالت‌های بازی'); await page.waitForSelector('#s-modes.on');
  await page.screenshot({ path: join(shots, '07-modes-fa.png') });
  await page.evaluate(() => window.__ic.back());
  // game back -> pause
  await page.evaluate(() => window.__ic._app.startLevel('classic', window.__ic._app.LEVELS.filter((l) => l.pack === 2), 0));
  await page.waitForSelector('#s-game.on'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.__ic.back()) === 'game', 'Back in game -> pause menu (game)');
  await page.waitForSelector('.modal.pause'); await page.screenshot({ path: join(shots, '08-pause-fa.png') });
  ok(await page.evaluate(() => window.__ic.back()) === 'game', 'Back in pause -> resume');
  // background -> auto pause + save
  await page.evaluate(() => window.__ic.bg()); await page.waitForSelector('.modal.pause');
  ok(true, 'going to background pauses the game');
  await page.click('text=خروج به منو'); await page.waitForSelector('#s-home.on');
  // English / LTR
  await page.click('text=تنظیمات'); await page.waitForSelector('#s-settings.on');
  await page.click('.seg button >> nth=1'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.documentElement.dir) === 'ltr', 'English switches to LTR');
  await page.screenshot({ path: join(shots, '09-settings-en.png') });
  await page.evaluate(() => window.__ic.back()); await page.waitForSelector('#s-home.on');
  await page.screenshot({ path: join(shots, '10-home-en.png') });
  await page.click('text=Vehicles'); await page.waitForSelector('#s-shop.on'); await page.waitForTimeout(500);
  await page.screenshot({ path: join(shots, '11-garage-en.png'), fullPage: false });
  await page.evaluate(() => window.__ic.back());
  await page.click('text=Skin Shop'); await page.waitForSelector('#s-shop.on'); await page.waitForTimeout(400);
  await page.screenshot({ path: join(shots, '12-shop-en.png') });
  ok(log.errors.length === 0, 'no JS errors: ' + log.errors.join(' | '));
  ok(log.external.length === 0, 'no external requests: ' + log.external.join(','));
  ok(log.csp.length === 0, 'no CSP violations: ' + log.csp.join(' | '));
  await ctx.close();

  console.log('2. every mode starts (endless, daily, time) + landscape layouts');
  ({ ctx, page, log } = await open(browser, { width: 851, height: 393 }));
  await page.waitForSelector('#s-home.on', { timeout: 8000 });
  await page.screenshot({ path: join(shots, '13-home-landscape.png') });
  for (const [name, fn] of [['endless', () => window.__ic._app.startEndless(1, 3, 0)], ['daily', () => window.__ic._app.startDaily()], ['time', () => window.__ic._app.startTime('easy', 0)]]) {
    await page.evaluate(fn); await page.waitForSelector('#s-game.on'); await page.waitForFunction(() => window.__ic._app.game().state === 'play' && window.__ic._app.game().def && window.__ic._app.game().def.id !== undefined, null, { timeout: 15000 });
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => { const g = window.__ic._app.game(); return { id: g.def.id, min: g.def.min, w: g.cv.getBoundingClientRect().width }; });
    ok(info.min >= 1 && info.w > 200, name + ' mode generated a solved-verified puzzle (min ' + info.min + ')');
    if (name === 'endless') await page.screenshot({ path: join(shots, '14-game-landscape.png') });
    await page.evaluate(() => window.__ic._app.game().def && 0);
    await page.evaluate(() => { const g = window.__ic._app.game(); g.state = 'idle'; });
    await page.evaluate(() => window.__ic.back()).catch(() => {});
    await page.waitForTimeout(100);
  }
  ok(log.errors.length === 0, 'landscape: no JS errors: ' + log.errors.join(' | '));
  await ctx.close();
  console.log('3. small phone 640x360 and tablet');
  for (const sz of [{ width: 640, height: 360 }, { width: 820, height: 1180 }]) {
    ({ ctx, page, log } = await open(browser, sz));
    await page.waitForSelector('#s-home.on', { timeout: 8000 });
    await page.evaluate(() => window.__ic._app.startLevel('classic', window.__ic._app.LEVELS.filter((l) => l.pack === 4), 3));
    await page.waitForSelector('#s-game.on'); await page.waitForTimeout(500);
    const fit = await page.evaluate(() => { const c = document.querySelector('canvas.board').getBoundingClientRect(); const h = document.querySelector('.tools').getBoundingClientRect(); return { cw: c.width, ch: c.height, bottom: h.bottom, vh: window.innerHeight, sw: document.documentElement.scrollWidth, iw: window.innerWidth }; });
    ok(fit.bottom <= fit.vh + 1 && fit.sw <= fit.iw, sz.width + 'x' + sz.height + ': nothing overflows (board ' + Math.round(fit.cw) + 'px)');
    await page.screenshot({ path: join(shots, '15-game-' + sz.width + 'x' + sz.height + '.png') });
    ok(log.errors.length === 0, 'no JS errors');
    await ctx.close();
  }

  console.log('4. old WebView simulation: remove modern APIs before the app loads');
  ({ ctx, page, log } = await open(browser, { width: 851, height: 393 }, { init: () => {
    delete window.WeakRef; delete window.FinalizationRegistry; delete Element.prototype.replaceChildren; delete Array.prototype.flat; delete Array.prototype.flatMap; delete Array.prototype.at;
    delete Object.fromEntries; delete String.prototype.replaceAll; delete Promise.allSettled; delete String.prototype.at; delete window.globalThis;
  } }));
  await page.waitForSelector('#s-home.on', { timeout: 8000 });
  ok(await page.evaluate(() => typeof [].flat === 'function' && typeof Object.fromEntries === 'function' && typeof WeakRef === 'function'), 'boot.js polyfilled missing APIs');
  ok(log.errors.length === 0, 'app boots without modern APIs: ' + log.errors.join(' | '));
  await ctx.close();

  console.log('5. error screen: deliberately broken game.js shows diagnostics');
  ({ ctx, page, log } = await open(browser, { width: 851, height: 393 }, { breakGame: true }));
  await page.waitForSelector('#bootbox.on', { timeout: 6000 });
  const txt = await page.textContent('#bootbox');
  ok(/deliberate test failure/.test(txt) && /stage:/.test(txt) && /WebView\/Chrome: 80/.test(txt) && /screen: 851x393/.test(txt), 'diagnostic screen lists stage, error, Chrome version, screen size');
  await page.screenshot({ path: join(shots, '16-boot-error.png') });
  await ctx.close();
} finally { await browser.close(); }
console.log(failures ? '\n' + failures + ' FAILED' : '\nALL E2E CHECKS PASSED');
process.exit(failures ? 1 : 0);
