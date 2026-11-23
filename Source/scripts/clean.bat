@echo off
cd /d "%~dp0\.."
rmdir /s /q dist build android\app\build android\.gradle .levelcache 2>nul
echo clean done
