// Creates a fresh, app-specific release keystore (JKS, RSA 4096, 30 years). NEVER commit the result.
// Usage: node scripts/make-keystore.mjs   (needs `keytool` from a JDK)
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'Keystore');
const jks = join(dir, 'rahbaz-release.jks');
if (existsSync(jks)) { console.error('Keystore already exists: ' + jks + '\nRefusing to overwrite (losing the key means you can never update the app).'); process.exit(1); }
mkdirSync(dir, { recursive: true });
const pass = randomBytes(18).toString('base64').replace(/[^A-Za-z0-9]/g, 'x');
const alias = 'rahbaz-release';
execFileSync('keytool', ['-genkeypair', '-v', '-keystore', jks, '-storetype', 'JKS', '-alias', alias, '-keyalg', 'RSA', '-keysize', '4096', '-validity', '10950',
  '-storepass', pass, '-keypass', pass, '-dname', 'CN=Hamid Yarali, OU=RAHBAZ, O=Hamid Yarali'], { stdio: 'inherit' });
writeFileSync(join(root, 'keystore.properties'), 'storeFile=Keystore/rahbaz-release.jks\nstorePassword=' + pass + '\nkeyAlias=' + alias + '\nkeyPassword=' + pass + '\n');
writeFileSync(join(dir, 'KEYSTORE_INFO.txt'),
`!!! CONFIDENTIAL – DO NOT SHARE, DO NOT COMMIT TO GIT !!!
RAHBAZ release signing key. Keep a backup. If you lose it you can never publish an update of the same app.

file     : rahbaz-release.jks
alias    : ${alias}
password : ${pass}   (store password = key password)
owner    : CN=Hamid Yarali, OU=RAHBAZ, O=Hamid Yarali
algo     : RSA 4096, validity 30 years
`);
console.log('\nKeystore created: ' + jks + '\nCredentials: keystore.properties and Keystore/KEYSTORE_INFO.txt (both git-ignored).');
