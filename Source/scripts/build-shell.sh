#!/bin/sh
# Rebuilds android/template/rahbaz-shell.apk (the unsigned WebView shell: dex + manifest + resources, no game assets).
# Needs: JDK 11+, aapt2, dx (apt: aapt dalvik-exchange openjdk-21-jdk-headless) and an android.jar (API 33).
# The normal build (scripts/build-apk.mjs) only needs Node + a JDK and re-uses the committed template.
set -e
cd "$(dirname "$0")/.."
VN=$(node -p "require('./package.json').version")
VC=$(node -p "const [a,b,c]='$VN'.split('.').map(Number); a*10000+b*100+c")
JAR=${ANDROID_JAR:-tools/android-33.jar}
if [ ! -f "$JAR" ]; then
  echo "downloading android.jar (API 33) from GitHub..."
  curl -fsSL -o "$JAR" https://raw.githubusercontent.com/Sable/android-platforms/master/android-33/android.jar
fi
DX=${DX:-$(command -v dx || echo /usr/lib/android-sdk/build-tools/debian/dx)}
SRC=android/app/src/main
W=build/shell; rm -rf $W; mkdir -p $W/classes
aapt2 compile --dir $SRC/res -o $W/res.zip
aapt2 link -o $W/base.apk -I "$JAR" --manifest $SRC/AndroidManifest.xml --min-sdk-version 24 --target-sdk-version 34 \
  --version-code "$VC" --version-name "$VN" --no-auto-version $W/res.zip
javac -nowarn --release 8 -cp "$JAR" -d $W/classes $(find $SRC/java -name '*.java')
"$DX" --dex --min-sdk-version=24 --output=$W/classes.dex $W/classes
(cd $W && zip -q -j base.apk classes.dex)
cp $W/base.apk android/template/rahbaz-shell.apk
echo "$VN $VC" > android/template/version.txt
echo "shell built: android/template/rahbaz-shell.apk (versionName $VN, versionCode $VC)"
