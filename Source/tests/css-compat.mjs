// Fails if the stylesheet uses CSS features that Chrome/WebView 64 does not understand.
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/css/style.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const bad = [
  [/\binset\s*:/, 'inset shorthand'], [/(margin|padding|border)-(inline|block)/, 'logical margin/padding'], [/\b(inline|block)-size\b/, 'logical size'],
  [/\bgap\s*:/, 'unprefixed gap (flex-gap needs Chrome 84; use grid-gap/margins)'], [/aspect-ratio/, 'aspect-ratio'], [/\bclamp\(|\bmin\(|\bmax\(/, 'clamp/min/max'],
  [/:is\(|:where\(|:has\(/, 'modern selectors'], [/backdrop-filter/, 'backdrop-filter'], [/:focus-visible/, ':focus-visible'], [/\bdvh\b|\bsvh\b/, 'dvh/svh'],
];
let fail = 0;
for (const [re, name] of bad) {
  // allow grid-gap
  const text = name.startsWith('unprefixed gap') ? css.replace(/grid-gap/g, '') : css;
  if (re.test(text)) { console.error('FAIL css uses', name); fail++; }
}
if (fail) process.exit(1);
console.log('css-compat OK');
