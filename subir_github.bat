@echo off
title Subir proyecto a GitHub
cd /d "c:\Users\cristiangarcia\Desktop\Nueva carpeta"
echo ====================================================
echo   Subiendo a GitHub (CristianGa27)...
echo   Si se abre una ventana de GitHub, dale a:
echo   "Sign in with your browser" -> "Authorize"
echo ====================================================
git push -u origin main
echo.
echo ====================================================
echo   ¡Listo! Ya puedes revisar tu GitHub.
echo ====================================================
pause

