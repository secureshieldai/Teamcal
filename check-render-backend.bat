@echo off
echo Checking Render backend status...
echo.
curl -s -o nul -w "HTTP Status: %%{http_code}\n" https://teamcal-mr7g.onrender.com/api/health
echo.
echo If you see 200, the backend is up.
echo If you see 000 or error, it's down.
pause
