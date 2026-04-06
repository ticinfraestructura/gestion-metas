@echo off
chcp 65001 >nul
title Gestión de Metas — Docker

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║         GESTIÓN DE METAS — STACK DOCKER              ║
echo ║   MySQL 8 + Backend Node.js + Frontend nginx         ║
echo ╚══════════════════════════════════════════════════════╝
echo.

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no está instalado o no está en el PATH.
    echo Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop no está corriendo. Ábrelo primero.
    pause
    exit /b 1
)

echo [1/4] Deteniendo contenedores anteriores si existen...
docker compose down

echo.
echo [2/4] Construyendo imágenes (puede tardar 2-5 minutos la primera vez)...
docker compose build --no-cache

echo.
echo [3/4] Iniciando todos los servicios...
docker compose up -d

echo.
echo [4/4] Esperando que los servicios estén listos...
timeout /t 20 /nobreak >nul

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║            SISTEMA LISTO                             ║
echo ╠══════════════════════════════════════════════════════╣
echo ║  Frontend:  http://localhost:80                      ║
echo ║  Backend:   http://localhost:3001/api                ║
echo ║  MySQL:     localhost:3306                           ║
echo ╠══════════════════════════════════════════════════════╣
echo ║  Admin:  admin@gestionmetas.com / admin123           ║
echo ║  Usuario: usuario@gestionmetas.com / user123         ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo Presiona cualquier tecla para ver los logs en vivo...
pause >nul
docker compose logs -f
