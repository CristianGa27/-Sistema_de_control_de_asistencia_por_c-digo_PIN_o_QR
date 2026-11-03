@echo off
title Control de Asistencia - Servidor Next.js
set "PATH=C:\Users\cristiangarcia\Desktop\node-v26.13.0-win-x64\node-v26.13.0-win-x64;%PATH%"
cd /d "%~dp0"
echo ====================================================
echo   Iniciando Control de Asistencia en:
echo   - Kiosco: http://localhost:3000/kiosco
echo   - Admin:  http://localhost:3000/admin
echo ====================================================
npm.cmd run dev
pause

