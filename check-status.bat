@echo off
echo Checking Gestion Commerciale Server Status...
echo.

echo Testing Backend Server (http://localhost:5000)...
curl -s -X POST -H "Content-Type: application/json" -d "{\"login\":\"admin\",\"password\":\"RitaFer@2026\"}" http://localhost:5000/api/auth/login >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend: RUNNING
) else (
    echo ❌ Backend: NOT RESPONDING
)

echo.
echo Testing Frontend Server (http://localhost:3001)...
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend: RUNNING
) else (
    echo ❌ Frontend: NOT RESPONDING
)

echo.
echo PowerShell Jobs Status:
powershell -Command "Get-Job | Where-Object {$_.Name -like '*Server'} | Select-Object Name, State | Format-Table -AutoSize"

echo.
echo If servers are not running, run start-servers.bat
echo.
pause