#!/bin/sh
# RAHBAZ – build the signed release APK (Linux / macOS). Output: release/RAHBAZ-v<version>.apk
set -e
cd "$(dirname "$0")/.."
fail() { echo "ERROR: $1" >&2; exit 1; }
command -v node >/dev/null 2>&1 || fail "Node.js 18+ is required (https://nodejs.org)"
command -v java >/dev/null 2>&1 || fail "JDK 11+ (java) is required"
command -v keytool >/dev/null 2>&1 || fail "keytool not found – install a full JDK"
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
[ "$NODE_MAJOR" -ge 18 ] || fail "Node 18+ required (found $(node -v))"
[ -d node_modules ] || { echo "Installing dependencies..."; npm ci || fail "npm ci failed"; }
echo "Running tests..."
npm test --silent || fail "unit tests failed"
node tests/css-compat.mjs || fail "css compatibility test failed"
[ -f keystore.properties ] || { echo "No release key yet – creating one (keep Keystore/ safe!)"; node scripts/make-keystore.mjs || fail "keystore creation failed"; }
node scripts/build-apk.mjs || fail "APK build failed"
V=$(node -p "require('./package.json').version")
echo ""
echo "SUCCESS: release/RAHBAZ-v$V.apk"
if command -v gradle >/dev/null 2>&1; then
  echo "Gradle found – building AAB for Google Play..."
  (cd android && gradle --no-daemon bundleRelease) && mkdir -p release && cp android/app/build/outputs/bundle/release/*.aab "release/RAHBAZ-v$V.aab" && echo "AAB: release/RAHBAZ-v$V.aab"
else
  echo "(AAB skipped: Gradle not installed. See README 'Build AAB'.)"
fi
