# Architecture
```
index.html ─ boot.js (ES5: polyfills, status/diagnostic overlay) ─ game.js (bundle of src/js/*)
main.js → app.js (screens, modes, rewards, navigation, Back protocol)
            ├─ game.js (Game: pointer input, tweening, undo/hint/solution, win/fail)
            │    ├─ render.js (BoardView: canvas drawing, sprite cache) ← art.js (procedural vehicle drawings, skins)
            │    ├─ engine.js (pure grid logic)  ├─ solver.js (BFS)  └─ generator.js (seeded generator)
            ├─ store.js (versioned save)  ├─ audio.js (WebAudio)  ├─ i18n.js  ├─ meta.js  ├─ packs.js  └─ presets.js
android/ MainActivity (WebView shell): serves assets/www from https://appassets.androidplatform.net/ via shouldInterceptRequest
```
- **Engine/solver/generator are DOM-free** and shared by the game, the offline level factory and the unit tests.
- **Back button protocol**: the shell calls `window.__ic.back()` which returns `'exit' | 'game' | 'menu' | 'busy'`; only `'exit'` closes the Activity. `window.__ic.bg()` is called when the app goes to the background (pauses, saves).
- **Old WebViews**: bundle target `chrome61`, ES5 `boot.js` with polyfills (WeakRef, FinalizationRegistry, replaceChildren, flat/flatMap/at, Object.fromEntries, replaceAll, Promise.allSettled/finally, globalThis); `tests/css-compat.mjs` forbids CSS newer than Chrome 64 (no flex-gap, logical properties, inset, clamp()).
- **CSP**: no inline scripts, `script-src 'self'`, `style-src 'self'`, `connect-src 'self'`.
- Runtime generation (Endless/Daily/Time) runs on the UI thread in 24 ms slices (`generateAsync`) with a "building a puzzle" overlay and solver verification before a puzzle is shown.
