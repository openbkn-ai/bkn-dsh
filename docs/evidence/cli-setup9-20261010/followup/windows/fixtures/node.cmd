@echo off
rem cli9 (cf591d7 round) C95 fixture: intercepts ONLY "node --version" according to node-mode.txt (v23 / v22-18 / real);
rem everything else runs the real node.exe. Each call is logged with its argv.
setlocal
set "FX=C:\bkn-verify\cli9f\fixtures"
set /p NMODE=<"%FX%\node-mode.txt"
>> "%FX%\calls.log" echo %DATE% %TIME% node-fixture mode=%NMODE% argv=%*
if /i not "%~1"=="--version" goto real
if /i "%NMODE%"=="v23" goto v23
if /i "%NMODE%"=="v22-18" goto v2218
goto real
:v23
echo v23.11.0
exit /b 0
:v2218
echo v22.18.0
exit /b 0
:real
"C:\Users\kalia\scoop\apps\nodejs-lts\current\node.exe" %*
exit /b %ERRORLEVEL%
