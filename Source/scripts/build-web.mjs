// Bundles the web game into dist/www (the folder that is packed into the APK as assets/www).
import { build, transform } from 'esbuild';
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'www');
rmSync(join(root, 'dist'), { recursive: true, force: true });
mkdirSync(join(out, 'js'), { recursive: true });
mkdirSync(join(out, 'css'), { recursive: true });

// 1) main bundle – IIFE, minified, ES2018 syntax lowered for Chrome 61 (Android WebView 61+)
await build({
  entryPoints: [join(root, 'src/js/main.js')], bundle: true, minify: true, format: 'iife', target: 'chrome61',
  outfile: join(out, 'js/game.js'), legalComments: 'none', logLevel: 'warning',
});
// 2) boot loader is hand-written ES5; verify and copy as-is
cpSync(join(root, 'src/boot.js'), join(out, 'js/boot.js'));
// 3) css (minified; no CSS features newer than Chrome 61 are used – see tests)
const css = readFileSync(join(root, 'src/css/style.css'), 'utf8');
writeFileSync(join(out, 'css/style.css'), (await transform(css, { loader: 'css', minify: true, target: 'chrome61' })).code);
// 4) static files
cpSync(join(root, 'src/index.html'), join(out, 'index.html'));
cpSync(join(root, 'src/fonts'), join(out, 'fonts'), { recursive: true });
cpSync(join(root, 'src/img'), join(out, 'img'), { recursive: true });

// 5) syntax check – bundle must be ES2018, boot loader must be ES5
const esc = join(root, 'node_modules/.bin/es-check');
if (existsSync(esc)) {
  execFileSync(esc, ['es2018', join(out, 'js/game.js')], { stdio: 'inherit' });
  execFileSync(esc, ['es5', join(out, 'js/boot.js')], { stdio: 'inherit' });
}
console.log('web build OK ->', out);
