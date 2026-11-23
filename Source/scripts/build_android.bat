@echo off
REM RAHBAZ - build the signed release APK (Windows). Output: release\RAHBAZ-v<version>.apk
setlocal
cd /d "%~dp0\.."
where node >nul 2>nul || (echo ERROR: Node.js 18+ is required & exit /b 1)
where java >nul 2>nul || (echo ERROR: JDK 11+ is required & exit /b 1)
where keytool >nul 2>nul || (echo ERROR: keytool not found - install a full JDK & exit /b 1)
if not exist node_modules ( call npm ci || (echo ERROR: npm ci failed & exit /b 1) )
call npm test --silent || (echo ERROR: unit tests failed & exit /b 1)
node tests\css-compat.mjs || (echo ERROR: css compatibility test failed & exit /b 1)
if not exist keystore.properties ( echo Creating a release key - keep the Keystore folder safe! & node scripts\make-keystore.mjs || (echo ERROR: keystore creation failed & exit /b 1) )
node scripts\build-apk.mjs || (echo ERROR: APK build failed & exit /b 1)
for /f %%v in ('node -p "require('./package.json').version"') do set V=%%v
echo.
echo SUCCESS: release\RAHBAZ-v%V%.apk
endlocal
