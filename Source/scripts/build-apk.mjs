// Offline APK build (no Android SDK / Gradle needed): web bundle -> WebView shell template -> sign with the release key.
// Needs Node 18+ and a JDK 11+ (java, keytool). Tools are downloaded from GitHub Releases and pinned by SHA-256.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const VERSION = pkg.version;
const [a, b, c] = VERSION.split('.').map(Number);
const VERSION_CODE = a * 10000 + b * 100 + c;
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const die = (m) => { console.error('\nBUILD FAILED: ' + m); process.exit(1); };

const SIGNER = { file: 'uber-apk-signer-1.3.0.jar', url: 'https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar', sha256: 'e1299fd6fcf4da527dd53735b56127e8ea922a321128123b9c32d619bba1d835' };

async function fetchTool(t) {
  const dir = join(root, 'tools'); mkdirSync(dir, { recursive: true });
  const f = join(dir, t.file);
  if (existsSync(f) && sha(readFileSync(f)) === t.sha256) return f;
  console.log('downloading ' + t.file + ' ...');
  const res = await fetch(t.url, { redirect: 'follow' });
  if (!res.ok) die('download failed (' + res.status + ') for ' + t.url);
  const buf = Buffer.from(await res.arrayBuffer());
  if (sha(buf) !== t.sha256) die('SHA-256 mismatch for ' + t.file + ' (expected ' + t.sha256 + ', got ' + sha(buf) + ')');
  writeFileSync(f, buf); return f;
}
function walk(dir) { const out = []; for (const n of readdirSync(dir)) { const p = join(dir, n); if (statSync(p).isDirectory()) out.push(...walk(p)); else out.push(p); } return out; }
function props(file) { const o = {}; readFileSync(file, 'utf8').split(/\r?\n/).forEach((l) => { const i = l.indexOf('='); if (i > 0 && !l.startsWith('#')) o[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }); return o; }

// 1) web bundle
execFileSync(process.execPath, [join(root, 'scripts/build-web.mjs')], { stdio: 'inherit' });
const www = join(root, 'dist', 'www');

// 2) template + version check
const tpl = join(root, 'android/template/rahbaz-shell.apk');
if (!existsSync(tpl)) die('missing android/template/rahbaz-shell.apk – run scripts/build-shell.sh');
const tv = readFileSync(join(root, 'android/template/version.txt'), 'utf8').trim();
if (tv !== VERSION + ' ' + VERSION_CODE) die('template version (' + tv + ') differs from package.json (' + VERSION + ' ' + VERSION_CODE + '). Run scripts/build-shell.sh first.');

// 3) assemble unsigned APK (resources.arsc must stay STORED for targetSdk >= 30)
const zip = await JSZip.loadAsync(readFileSync(tpl));
const out = new JSZip();
for (const name of Object.keys(zip.files)) {
  const f = zip.files[name]; if (f.dir || name.startsWith('META-INF/')) continue;
  out.file(name, await f.async('nodebuffer'), { compression: name === 'resources.arsc' ? 'STORE' : 'DEFLATE', date: new Date('2026-01-01T00:00:00Z') });
}
for (const p of walk(www).sort()) {
  const rel = relative(www, p).split(sep).join('/');
  out.file('assets/www/' + rel, readFileSync(p), { compression: /\.(woff2|png)$/.test(rel) ? 'STORE' : 'DEFLATE', date: new Date('2026-01-01T00:00:00Z') });
}
const buildDir = join(root, 'build'); mkdirSync(buildDir, { recursive: true });
const unsigned = join(buildDir, 'rahbaz-unsigned.apk');
writeFileSync(unsigned, await out.generateAsync({ type: 'nodebuffer', platform: 'UNIX' }));

// 4) release key (never the debug key)
const kpFile = process.env.RAHBAZ_KEYSTORE_PROPS || join(root, 'keystore.properties');
if (!existsSync(kpFile)) die('no keystore.properties. Create your own release key first:\n   node scripts/make-keystore.mjs');
const kp = props(kpFile);
const ks = join(root, kp.storeFile);
if (!existsSync(ks)) die('keystore file not found: ' + ks);
if (/debug/i.test(kp.keyAlias) || /debug\.keystore/i.test(kp.storeFile)) die('refusing to sign with a debug key');

// 5) sign (v1+v2+v3, zipalign) with uber-apk-signer
const signer = await fetchTool(SIGNER);
const signedDir = join(buildDir, 'signed'); rmSync(signedDir, { recursive: true, force: true }); mkdirSync(signedDir, { recursive: true });
execFileSync('java', ['-jar', signer, '-a', unsigned, '--ks', ks, '--ksAlias', kp.keyAlias, '--ksPass', kp.storePassword, '--ksKeyPass', kp.keyPassword, '--out', signedDir], { stdio: 'inherit' });
const produced = readdirSync(signedDir).find((n) => n.endsWith('.apk'));
if (!produced) die('signer produced no APK');
const releaseDir = join(root, 'release'); mkdirSync(releaseDir, { recursive: true });
const apk = join(releaseDir, 'RAHBAZ-v' + VERSION + '.apk');
copyFileSync(join(signedDir, produced), apk);
// Optional: if the Android SDK's `apksigner` is on PATH, re-sign with v1 + v2 + v3 (uber-apk-signer omits v1 when minSdk >= 24).
let hasApksigner = true;
try { execFileSync('apksigner', ['--version'], { stdio: 'ignore' }); } catch (e) { hasApksigner = false; }
if (hasApksigner) {
  execFileSync('apksigner', ['sign', '--ks', ks, '--ks-key-alias', kp.keyAlias, '--ks-pass', 'pass:' + kp.storePassword, '--key-pass', 'pass:' + kp.keyPassword,
    '--v1-signing-enabled', 'true', '--v2-signing-enabled', 'true', '--v3-signing-enabled', 'true', '--v4-signing-enabled', 'false', '--min-sdk-version', '24', apk], { stdio: 'inherit' });
  console.log('re-signed with apksigner: v1 + v2 + v3');
} else console.log('NOTE: apksigner not found on PATH -> APK carries v2 + v3 signatures only (valid for Android 7+).');

// 6) verification: certificate must NOT be the Android debug cert; fingerprint pinned with --verifySha256
let kt;
try { kt = execFileSync('keytool', ['-list', '-v', '-keystore', ks, '-storepass', kp.storePassword, '-alias', kp.keyAlias], { encoding: 'utf8' }); } catch (e) { die('keytool failed: ' + e.message); }
const fp = (/SHA256:\s*([0-9A-F:]+)/i.exec(kt) || [])[1];
const owner = (/Owner:\s*(.+)/.exec(kt) || [])[1] || '';
if (/Android Debug/i.test(owner)) die('certificate owner is "Android Debug"');
const fpHex = fp.replace(/:/g, '').toLowerCase();
let verify = '';
try { verify = execFileSync('java', ['-jar', signer, '--onlyVerify', '-a', apk, '--verifySha256', fpHex], { encoding: 'utf8' }); } catch (e) { die('signature verification failed:\n' + (e.stdout || e.message)); }
if (!/VERIFIED/i.test(verify) && !/Successfully verified/i.test(verify)) console.log(verify);
const apkSha = sha(readFileSync(apk));
writeFileSync(apk + '.sha256', apkSha + '  ' + 'RAHBAZ-v' + VERSION + '.apk\n');
writeFileSync(join(releaseDir, 'CERTIFICATE.txt'), 'Owner: ' + owner + '\nCertificate SHA-256: ' + fp + '\nAPK SHA-256: ' + apkSha + '\nversionName ' + VERSION + ', versionCode ' + VERSION_CODE + '\n');
console.log('\nAPK ready: ' + apk + ' (' + (statSync(apk).size / 1048576).toFixed(2) + ' MB)\nOwner: ' + owner + '\nCert SHA-256: ' + fp);
