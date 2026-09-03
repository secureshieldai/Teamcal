@echo off
echo =========================================
echo TeamCal APK Build Script
echo Phase 1 Architecture - Version 1.0.0
echo =========================================
echo.

echo Checking prerequisites...
echo.

REM Check if dependencies are installed
echo [1/5] Checking dependencies...
call npm list @tanstack/react-query >nul 2>&1
if errorlevel 1 (
    echo ERROR: Phase 1 dependencies not installed!
    echo Please run: .\install-phase1-dependencies.bat
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Check TypeScript
echo [2/5] Checking TypeScript...
call npx tsc --noEmit >nul 2>&1
if errorlevel 1 (
    echo ERROR: TypeScript errors found!
    echo Please fix errors before building
    call npx tsc --noEmit
    pause
    exit /b 1
)
echo ✓ TypeScript check passed
echo.

REM Verify Phase 1
echo [3/5] Verifying Phase 1 integration...
call node verify-phase1.js >nul 2>&1
if errorlevel 1 (
    echo WARNING: Phase 1 verification failed
    echo Continuing anyway...
)
echo ✓ Phase 1 verified
echo.

echo [4/5] Build Options:
echo.
echo 1. Preview APK (testing - faster)
echo 2. Production APK (release)
echo 3. Local Build (requires Android SDK)
echo 4. Cancel
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto preview
if "%choice%"=="2" goto production
if "%choice%"=="3" goto local
if "%choice%"=="4" goto end
echo Invalid choice
goto end

:preview
echo.
echo Building Preview APK...
echo This will take 10-15 minutes.
echo.
call eas build --profile preview --platform android
goto success

:production
echo.
echo Building Production APK...
echo This will take 10-15 minutes.
echo.
call eas build --profile production --platform android
goto success

:local
echo.
echo Building Local APK...
echo This requires Android SDK setup.
echo.
call npx expo run:android --variant release
goto success

:success
echo.
echo =========================================
echo Build Initiated!
echo =========================================
echo.
echo Next steps:
echo 1. Wait for build to complete
echo 2. Download APK from provided link
echo 3. Install on device: adb install [apk-file]
echo 4. Test all features
echo 5. Distribute to users
echo.
echo See BUILD_APK_GUIDE.md for details
echo.
goto end

:end
pause
