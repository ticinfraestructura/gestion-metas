@echo off
title Iniciando Servidor Web
echo.
echo ===============================================
echo   INICIANDO SERVIDOR WEB
echo ===============================================
echo.

echo [1] Verificando directorio...
cd /d "%~dp0"
echo Directorio actual: %CD%

echo [2] Iniciando servidor Node.js...
echo Puerto: 3002
echo Archivo principal: login-simple.html
echo.

node servidor-web.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al iniciar el servidor
    echo Código de error: %errorlevel%
    echo.
    echo Posibles soluciones:
    echo 1. Verifica que el puerto 3002 esté libre
    echo 2. Verifica que Node.js esté instalado
    echo 3. Ejecuta como administrador
    echo.
    pause
)
