@echo off
echo ===================================================
echo Medisys HMS - Hospital ERP System Startup Script
echo ===================================================

echo Starting Backend Server on port 5000...
start cmd /k "cd backend && npx prisma generate && npm run dev"

echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend Server on port 3000...
start cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo DONE!
echo Backend logs are running in the first window.
echo Frontend logs are running in the second window.
echo Open your browser to: http://localhost:3000
echo Login as: EMP-0000-ADMIN / admin123
echo ===================================================
