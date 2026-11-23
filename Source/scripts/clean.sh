#!/bin/sh
# Removes temporary build output (never touches Keystore/ or keystore.properties).
cd "$(dirname "$0")/.."
rm -rf dist build android/app/build android/.gradle .levelcache
echo "clean done"
