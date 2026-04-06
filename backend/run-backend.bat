@echo off
echo Iniciando Backend...
set PORT=3001
cd /d "%~dp0"
node src/index-simple.js
pause
