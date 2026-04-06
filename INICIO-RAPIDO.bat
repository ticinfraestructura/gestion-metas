@echo off
title Sistema de Gestion de Metas - Inicio Rapido
echo.
echo ===============================================
echo   SISTEMA DE GESTION DE METAS
echo ===============================================
echo.
echo [1] Iniciando Backend en puerto 3001...
cd /d "%~dp0\backend"
start /B cmd /C "set PORT=3001 && node src/server-minimal.js"
timeout /t 3 >nul

echo [2] Iniciando Frontend en puerto 3002...
cd /d "%~dp0\frontend"
start /B cmd /C "node start-simple.js"
timeout /t 3 >nul

echo.
echo ===============================================
echo   SERVICIOS INICIADOS
echo ===============================================
echo.
echo   Backend API: http://localhost:3001/api
echo   Frontend:  http://localhost:3002
echo   Health Check: http://localhost:3001/health
echo.
echo Usuarios de prueba:
echo   Admin: admin@gestionmetas.com / admin123
echo   Usuario: usuario@gestionmetas.com / user123
echo.
echo Abre tu navegador en: http://localhost:3002
echo ===============================================
echo.
echo Presiona cualquier tecla para detener todos los servicios...
pause >nul

echo Deteniendo servicios...
taskkill /F /IM node.exe >nul 2>&1
echo Servicios detenidos.
pause
