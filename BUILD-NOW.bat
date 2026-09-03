@echo off
echo ========================================
echo TeamCal - Quick APK Build
echo ========================================
echo.
echo Building Preview APK for Testing...
echo This will take 10-15 minutes.
echo.
eas build --profile preview --platform android
echo.
echo Done! Download APK from the link above.
echo.
pause
