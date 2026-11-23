/* RAHBAZ boot loader – plain ES5 on purpose. Runs BEFORE the main bundle so that old Android System WebView
   versions get polyfills and, if anything goes wrong, a readable status screen instead of an endless spinner. */
(function () {
  'use strict';
  var w = window, d = document, stageName = 'boot', t0 = Date.now(), finished = false, failed = false, errs = [];
  // ---- polyfills (only what the bundle or libraries may touch on WebView < 80)
  function def(o, k, v) { if (!o[k]) { try { Object.defineProperty(o, k, { value: v, configurable: true, writable: true }); } catch (e) { o[k] = v; } } }
  if (typeof w.globalThis === 'undefined') { w.globalThis = w; }
  if (typeof w.WeakRef === 'undefined') { w.WeakRef = function (o) { this._o = o; }; w.WeakRef.prototype.deref = function () { return this._o; }; }
  if (typeof w.FinalizationRegistry === 'undefined') { w.FinalizationRegistry = function () {}; w.FinalizationRegistry.prototype.register = function () {}; w.FinalizationRegistry.prototype.unregister = function () {}; }
  def(Element.prototype, 'replaceChildren', function () { while (this.firstChild) this.removeChild(this.firstChild); for (var i = 0; i < arguments.length; i++) { var a = arguments[i]; this.appendChild(typeof a === 'string' ? d.createTextNode(a) : a); } });
  function flat(depth) { var dd = depth === undefined ? 1 : Number(depth), out = []; (function rec(a, l) { for (var i = 0; i < a.length; i++) { if (Array.isArray(a[i]) && l > 0) rec(a[i], l - 1); else out.push(a[i]); } })(this, dd); return out; }
  def(Array.prototype, 'flat', flat);
  def(Array.prototype, 'flatMap', function (fn, th) { return flat.call(Array.prototype.map.call(this, fn, th), 1); });
  def(Array.prototype, 'at', function (i) { i = Math.trunc(i) || 0; if (i < 0) i += this.length; return this[i]; });
  def(String.prototype, 'at', function (i) { i = Math.trunc(i) || 0; if (i < 0) i += this.length; return this.charAt(i); });
  def(Object, 'fromEntries', function (it) { var o = {}; var a = Array.from(it); for (var i = 0; i < a.length; i++) o[a[i][0]] = a[i][1]; return o; });
  def(String.prototype, 'replaceAll', function (s, r) { if (s instanceof RegExp) return this.replace(s, r); return this.split(s).join(r); });
  if (typeof Promise !== 'undefined') {
    def(Promise, 'allSettled', function (ps) { return Promise.all(Array.from(ps).map(function (p) { return Promise.resolve(p).then(function (v) { return { status: 'fulfilled', value: v }; }, function (e) { return { status: 'rejected', reason: e }; }); })); });
    def(Promise.prototype, 'finally', function (f) { var P = this.constructor; return this.then(function (v) { return P.resolve(f()).then(function () { return v; }); }, function (e) { return P.resolve(f()).then(function () { throw e; }); }); });
  }
  def(Math, 'trunc', function (x) { return x < 0 ? Math.ceil(x) : Math.floor(x); });
  // ---- status overlay
  var box = null;
  function chromeVer() { var m = /Chrome\/(\d+[\.\d]*)/.exec(navigator.userAgent); return m ? m[1] : 'unknown'; }
  function show(title, err) {
    if (!box) { box = d.createElement('div'); box.id = 'bootbox'; d.body.appendChild(box); }
    var txt = (title || '') + '\n\nstage: ' + stageName + '\nerror: ' + (err || errs.join(' | ') || '-') + '\nWebView/Chrome: ' + chromeVer() +
      '\nscreen: ' + w.innerWidth + 'x' + w.innerHeight + ' @' + (w.devicePixelRatio || 1) + '\nWebGL2: ' + (function () { try { return !!d.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } })() +
      '\nelapsed: ' + (Date.now() - t0) + 'ms\nua: ' + navigator.userAgent;
    box.textContent = txt;
    box.className = 'on';
  }
  w.addEventListener('error', function (e) { errs.push(String(e.message || 'error') + (e.filename ? ' @' + String(e.filename).split('/').pop() + ':' + e.lineno : '')); if (!finished) { failed = true; show('RAHBAZ failed to start – send a screenshot of this screen'); } });
  w.addEventListener('unhandledrejection', function (e) { errs.push('promise: ' + String(e.reason && e.reason.message || e.reason)); if (!finished) { failed = true; show('RAHBAZ failed to start – send a screenshot of this screen'); } });
  w.__boot = {
    stage: function (s) { stageName = s; },
    done: function () { finished = true; if (box && !failed) { box.className = ''; } var l = d.getElementById('bootload'); if (l && l.parentNode) l.parentNode.removeChild(l); },
    fail: function (e) { failed = true; errs.push(String(e && e.message || e)); show('RAHBAZ failed to start – send a screenshot of this screen'); },
  };
  setTimeout(function () { if (!finished && !failed) show('Still loading… (' + Math.round((Date.now() - t0) / 1000) + 's)'); }, 12000);
})();
