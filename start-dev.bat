@echo off
echo Starting Community Library Development Environment...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d "%~dp0web" && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo The web browser should open automatically in a few moments.

timeout /t 5 /nobreak > nul
start http://localhost:3000

pause
