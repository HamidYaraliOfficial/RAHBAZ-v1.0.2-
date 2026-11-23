// Tiny DOM helpers + inline SVG icon set (no external assets, CSP friendly).
export function h(tag, props, kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'style') { for (const s in v) el.style[s] = v[s]; }
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  if (kids != null) add(el, kids);
  return el;
}
export function add(el, kids) {
  if (Array.isArray(kids)) kids.forEach((k) => add(el, k));
  else if (kids != null && kids !== false) el.appendChild(typeof kids === 'object' ? kids : document.createTextNode(String(kids)));
  return el;
}
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

const P = {
  back: '<path d="M15 5l-7 7 7 7" />', pause: '<path d="M8 5v14M16 5v14" />', undo: '<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 010 12" transform="translate(0 -6)"/>',
  reset: '<path d="M4 12a8 8 0 108-8"/><path d="M4 4v5h5"/>', hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
  play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>', settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 20h8M10 17h4"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 115 0c0 1.7-2.5 2-2.5 4M12 17v.5"/>', stats: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  shop: '<path d="M5 8h14l-1 12H6zM9 8a3 3 0 016 0"/>', garage: '<path d="M3 11l9-7 9 7v9H3zM7 20v-6h10v6"/>', calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 016 0v3"/>', check: '<path d="M5 12l5 5 9-10"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 010 6"/>', music: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
  home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>', next: '<path d="M9 5l7 7-7 7"/>', replay: '<path d="M4 12a8 8 0 108-8"/><path d="M4 4v5h5"/>', map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>', film: '<path d="M5 5h14v14H5z"/>',
};
export function icon(name, size) {
  const s = size || 22;
  const el = document.createElement('span'); el.className = 'ico';
  el.innerHTML = '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  return el;
}
export function starSvg(on, size) {
  const el = document.createElement('span'); el.className = 'star' + (on ? ' on' : '');
  el.innerHTML = '<svg viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) + '"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
  return el;
}
export function coinSvg(size) {
  const el = document.createElement('span'); el.className = 'coin';
  el.innerHTML = '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) + '"><circle cx="12" cy="12" r="10" fill="#FFC93C"/><circle cx="12" cy="12" r="7" fill="none" stroke="#E8A200" stroke-width="2"/><path d="M12 8v8M9.5 10.5h5" stroke="#E8A200" stroke-width="2" stroke-linecap="round"/></svg>';
  return el;
}
