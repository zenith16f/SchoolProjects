@echo off
REM Calculadora IP - CIDR y VLSM :: arranque del sitio en Windows
REM Requiere Node.js instalado (https://nodejs.org). No necesita nada mas.

setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado o no esta en el PATH.
  echo Instalalo desde https://nodejs.org y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

REM En el ZIP de entrega el sitio esta en "web"; en el repositorio, en "dist".
set "SITE=web"
if not exist "%SITE%\index.html" set "SITE=dist"
if not exist "%SITE%\index.html" (
  echo [ERROR] No se encontro el sitio compilado ^(web\index.html o dist\index.html^).
  echo Ejecuta "pnpm build" antes de usar este archivo.
  pause
  exit /b 1
)

REM En el ZIP el servidor esta en la raiz; en el repositorio, en scripts/.
set "SERVER=servidor.mjs"
if not exist "%SERVER%" set "SERVER=scripts\serve.mjs"

echo Abriendo la Calculadora IP en tu navegador...
start "" "http://127.0.0.1:4173/"

echo.
echo Servidor iniciado (carpeta: %SITE%). Cierra esta ventana o presiona Ctrl+C para detenerlo.
echo.
node "%SERVER%" "%SITE%" 4173
pause
