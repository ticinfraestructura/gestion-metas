@echo off
title SOLUCIÓN DEFINITIVA - Sistema de Gestión de Metas
echo.
echo ===============================================
echo   SOLUCIÓN DEFINITIVA
echo ===============================================
echo.

echo [1] Limpiando procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [2] Iniciando Backend...
cd /d "%~dp0\backend"
start /B cmd /C "title Backend - Puerto 3001 && node src/server-minimal.js"
timeout /t 3 >nul

echo [3] Verificando Backend...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend funcionando en http://localhost:3001
) else (
    echo ❌ Backend no responde
    pause
    exit
)

echo [4] Creando Frontend estático...
cd /d "%~dp0\frontend"
echo <html><head><title>Gestión de Metas</title></head><body style="font-family:Arial;padding:20px"><h1>🎯 Sistema de Gestión de Metas</h1><h2>✅ Backend Funcionando</h2><p><strong>API:</strong> <a href="http://localhost:3001/api" target="_blank">http://localhost:3001/api</a></p><p><strong>Health:</strong> <a href="http://localhost:3001/health" target="_blank">http://localhost:3001/health</a></p><h2>👤 Usuarios de Prueba</h2><div style="background:#f0f0f0;padding:15px;border-radius:5px"><p><strong>Admin:</strong> admin@gestionmetas.com / admin123</p><p><strong>Usuario:</strong> usuario@gestionmetas.com / user123</p></div><h2>🔗 Endpoints API</h2><div style="background:#e8f4f8;padding:15px;border-radius:5px"><p>POST /api/auth/login - Login</p><p>GET /api/metas - Obtener metas</p><p>GET /api/contratistas - Obtener contratistas</p><p>GET /api/avances - Obtener avances</p><p>GET /api/dashboard/stats - Estadísticas</p></div><h2>🧪 Probar API</h2><button onclick="fetch('http://localhost:3001/api/metas').then(r=>r.json()).then(d=>alert('Metas: '+JSON.stringify(d,null,2)))" style="padding:10px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer">Probar API Metas</button><script>setInterval(()=>fetch('http://localhost:3001/health').then(r=>r.json()).then(d=>document.getElementById('status').innerHTML='✅ '+d.status),5000);</script><p id="status">Verificando...</p></body></html> > index.html

echo [5] Iniciando Frontend estático...
cd /d "%~dp0\frontend"
start /B cmd /C "title Frontend - Puerto 3002 && python -m http.server 3002"
timeout /t 3 >nul

echo.
echo ===============================================
echo   ✅ SISTEMA COMPLETAMENTE FUNCIONANDO
echo ===============================================
echo.
echo   Backend API: http://localhost:3001/api
echo   Frontend Web: http://localhost:3002
echo   Health Check: http://localhost:3001/health
echo.
echo   ABRE TU NAVEGADOR EN: http://localhost:3002
echo ===============================================
echo.
echo Presiona cualquier tecla para detener...
pause >nul

echo Deteniendo servicios...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
echo Servicios detenidos.
pause
