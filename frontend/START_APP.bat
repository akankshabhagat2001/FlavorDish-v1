@echo off
TITLE FlavourFinder - STARTUP
color 0A
cls

echo.
echo ███████╗██╗      █████╗ ██╗   ██╗ ██████╗ ██████╗ ███████╗██╗███╗   ██╗██████╗ ███████╗██████╗ 
echo ██╔════╝██║     ██╔══██╗██║   ██║██╔═══██╗██╔══██╗██╔════╝██║████╗  ██║██╔══██╗██╔════╝██╔══██╗
echo █████╗  ██║     ███████║██║   ██║██║   ██║██████╔╝█████╗  ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝
echo ██╔══╝  ██║     ██╔══██║██║   ██║██║   ██║██╔══██╗██╔══╝  ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗
echo ██║     ███████╗██║  ██║╚██████╔╝╚██████╔╝██║  ██║███████╗██║██║ ╚████║██████╔╝███████╗██║  ██║
echo ╚═╝     ╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝
echo.
echo ========================================
echo    🚀 Food Delivery Platform Startup
echo ========================================
echo.

REM Check if running with admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Warning: Running without admin privileges (optional)
)

cd /d "%~dp0"

echo [1/3] Starting Backend Server on port 5001...
start "FlavourFinder-Backend" cmd /k "cd server && npm start"
timeout /t 2 >nul

echo [2/3] Starting Frontend on port 3000...
start "FlavourFinder-Frontend" cmd /k "npm run dev"
timeout /t 2 >nul

echo.
echo ========================================
echo    ✅ Services Started!
echo ========================================
echo.
echo 📱 Frontend:  http://localhost:3000
echo 🔧 Backend:   http://localhost:5001  
echo 🗄️  Database: mongodb://localhost:27017
echo.
echo 🔐 Login Credentials:
echo   Email:    customer@demo.local
echo   Password: customer123
echo.
echo Keep these windows open!
echo Press ENTER to close this window...
echo.
pause >nul
