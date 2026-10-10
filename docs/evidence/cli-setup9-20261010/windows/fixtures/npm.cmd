@echo off
rem cli9 (cf591d7 round) C96/C97 fixture: intercepts ONLY "npm install" according to npm-mode.txt; every other
rem npm subcommand is handed to the real scoop npm.cmd unchanged. Each call is logged (redirect-first echo; no parenthesized blocks so %TIME% is evaluated per line).
setlocal
set "FX=C:\bkn-verify\cli9\fixtures"
set /p MODE=<"%FX%\npm-mode.txt"
>> "%FX%\calls.log" echo %DATE% %TIME% npm-fixture mode=%MODE% argv=%*
if /i not "%~1"=="install" goto passthrough
if /i "%MODE%"=="eacces" goto eacces
if /i "%MODE%"=="econnreset" goto econnreset
if /i "%MODE%"=="cert" goto cert
if /i "%MODE%"=="exit0-nobin" goto exit0nobin
if /i "%MODE%"=="delay" goto delay
goto passthrough
:eacces
>&2 echo npm error code EACCES
>&2 echo npm error syscall mkdir
>&2 echo npm error Error: EACCES: permission denied, mkdir CANARY-C96-RAW-STDERR-EACCES
>> "%FX%\calls.log" echo %DATE% %TIME% npm-fixture eacces exit=243
exit /b 243
:econnreset
>&2 echo npm error code ECONNRESET
>&2 echo npm error network read ECONNRESET CANARY-C96-RAW-STDERR-ECONNRESET
>> "%FX%\calls.log" echo %DATE% %TIME% npm-fixture econnreset exit=1
exit /b 1
:cert
>&2 echo npm error code UNABLE_TO_VERIFY_LEAF_SIGNATURE
>&2 echo npm error request to https://registry.npmjs.org/ failed, reason: unable to verify the first certificate CANARY-C96-RAW-STDERR-CERT
>> "%FX%\calls.log" echo %DATE% %TIME% npm-fixture cert exit=1
exit /b 1
:exit0nobin
echo added 0 packages CANARY-C96-RAW-STDOUT-EXIT0
>> "%FX%\calls.log" echo %DATE% %TIME% npm-fixture exit0-nobin exit=0
exit /b 0
:delay
set /p DSEC=<"%FX%\delay-seconds.txt"
set /a PINGN=DSEC+1
>> "%FX%\calls.log" echo %DATE% %TIME% npm-fixture delay start seconds=%DSEC%
ping -n %PINGN% 127.0.0.1 >nul
>> "%FX%\calls.log" echo %DATE% %TIME% npm-fixture delay end, handing to real npm
goto passthrough
:passthrough
call "C:\Users\kalia\scoop\apps\nodejs-lts\current\npm.cmd" %*
set RC=%ERRORLEVEL%
>> "%FX%\calls.log" echo %DATE% %TIME% npm-fixture passthrough exit=%RC%
exit /b %RC%
