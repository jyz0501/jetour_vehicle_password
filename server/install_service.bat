@echo off
setlocal enabledelayedexpansion
title Jetour Password API - NSSM Service Manager (Python)

REM ==============================================================
REM  Jetour Password API - NSSM Windows Service Manager (Python)
REM
REM  USAGE (run as Administrator):
REM    install_service.bat                default: install
REM    install_service.bat install        install and start service
REM    install_service.bat uninstall      remove service
REM    install_service.bat start          start service
REM    install_service.bat stop           stop service
REM    install_service.bat restart        restart service
REM    install_service.bat status         show service status
REM
REM  REQUIREMENTS:
REM    1) Python 3 installed (py launcher or python in PATH)
REM    2) nssm.exe available at .\nssm\nssm.exe or in PATH
REM       (download from https://nssm.cc/download)
REM
REM  Add " -nopause" as last argument to close window automatically.
REM ==============================================================

set "SERVICE_NAME=JetourPasswordApi"
set "SERVICE_DISPLAY=Jetour Password API"
set "SERVICE_DESC=Jetour vehicle dynamic password calculation API (Python)"
set "APP_DIR=%~dp0"
set "PORT=8080"
REM 生产密钥：显式注入，不依赖 app.py 内置 fallback（保证服务始终用此 key）
set "API_KEY=6c3dc45c96644bf08d0918e0966af662930aa2507ad8419692af2e8f39221c1f"

set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=install"
set "PAUSE_MODE=1"
echo %* | find /i "-nopause" >nul && set "PAUSE_MODE=0"

REM ---------- locate python ----------
REM 优先 python.exe（完整路径，服务环境下最可靠），其次 py launcher
set "PYTHON_EXE="
set "PYTHON_ARGS="
where python >nul 2>nul
if not errorlevel 1 (
    REM 取第一个非 WindowsApps 的 python.exe：Store 版 stub 在服务(SYSTEM)环境下不可用
    for /f "delims=" %%i in ('where python') do (
        echo %%i | find /i "WindowsApps" >nul 2>nul
        if errorlevel 1 if not defined PYTHON_EXE set "PYTHON_EXE=%%i"
    )
)
if not defined PYTHON_EXE (
    where py >nul 2>nul
    if not errorlevel 1 (
        for /f "delims=" %%i in ('where py') do if not defined PYTHON_EXE set "PYTHON_EXE=%%i"
        set "PYTHON_ARGS=-3"
    )
)
if not defined PYTHON_EXE (
    echo [ERROR] Python 3 not found. Please install Python from https://python.org
    echo and make sure "python" or "py" is in PATH ^(not the Microsoft Store version^).
    goto :fail
)
echo [INFO] Python: %PYTHON_EXE% %PYTHON_ARGS%

REM ---------- check app.py exists ----------
if not exist "%APP_DIR%app.py" (
    echo [ERROR] app.py not found in %APP_DIR%
    echo Please make sure app.py is deployed next to this script.
    goto :fail
)

REM ---------- preflight: syntax check ----------
"%PYTHON_EXE%" %PYTHON_ARGS% -m py_compile "%APP_DIR%app.py" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python syntax check failed for app.py.
    "%PYTHON_EXE%" %PYTHON_ARGS% -m py_compile "%APP_DIR%app.py"
    goto :fail
)
echo [INFO] app.py syntax check OK

REM ---------- locate nssm.exe ----------
set "NSSM=%APP_DIR%nssm\nssm.exe"
if not exist "%NSSM%" (
    where nssm >nul 2>nul
    if errorlevel 1 (
        echo [ERROR] nssm.exe not found.
        echo Please download from https://nssm.cc/download and put it in:
        echo   %APP_DIR%nssm\
        echo or add nssm.exe to PATH.
        goto :fail
    )
    for /f "delims=" %%i in ('where nssm') do set "NSSM=%%i"
)
echo [INFO] NSSM: %NSSM%

REM ---------- dispatch action ----------
if /i "%ACTION%"=="install"   goto :install
if /i "%ACTION%"=="uninstall" goto :uninstall
if /i "%ACTION%"=="start"     goto :start
if /i "%ACTION%"=="stop"      goto :stop
if /i "%ACTION%"=="restart"   goto :restart
if /i "%ACTION%"=="status"    goto :status
echo [ERROR] Unknown action: %ACTION%
echo Usage: %~nx0 [install^|uninstall^|start^|stop^|restart^|status] [-nopause]
goto :fail

:install
echo.
echo ============ Installing service: %SERVICE_NAME% ============
echo [1/4] Removing old service (if any)...
"%NSSM%" stop %SERVICE_NAME% >nul 2>nul
"%NSSM%" remove %SERVICE_NAME% confirm >nul 2>nul

echo [2/4] Registering service...
"%NSSM%" install %SERVICE_NAME% "%PYTHON_EXE%" %PYTHON_ARGS% "%APP_DIR%app.py"
if errorlevel 1 (
    echo [ERROR] Failed to register service.
    goto :fail
)
"%NSSM%" set %SERVICE_NAME% DisplayName %SERVICE_DISPLAY%
"%NSSM%" set %SERVICE_NAME% Description %SERVICE_DESC%
REM 注意：不要用 "%APP_DIR%"（以反斜杠结尾），CommandLineToArgvW 会把 \" 转义成字面引号导致目录无效
REM 用 "%APP_DIR%." 结尾加点，路径等价且不会被转义
"%NSSM%" set %SERVICE_NAME% AppDirectory "%APP_DIR%."
"%NSSM%" set %SERVICE_NAME% Start SERVICE_AUTO_START

if not exist "%APP_DIR%logs" mkdir "%APP_DIR%logs" >nul 2>nul
"%NSSM%" set %SERVICE_NAME% AppStdout "%APP_DIR%logs\stdout.log"
"%NSSM%" set %SERVICE_NAME% AppStderr "%APP_DIR%logs\stderr.log"
"%NSSM%" set %SERVICE_NAME% AppRotateFiles 1
"%NSSM%" set %SERVICE_NAME% AppRotateBytes 10485760

"%NSSM%" set %SERVICE_NAME% AppExit Default Restart
"%NSSM%" set %SERVICE_NAME% AppRestartDelay 5000

set "ENV_EXTRA=PORT=%PORT%"
if not "%API_KEY%"=="" set "ENV_EXTRA=%ENV_EXTRA% API_KEY=%API_KEY%"
"%NSSM%" set %SERVICE_NAME% AppEnvironmentExtra %ENV_EXTRA%

echo [3/4] Starting service...
"%NSSM%" start %SERVICE_NAME%
if errorlevel 1 (
    echo [ERROR] Failed to start service.
    echo.
    echo ---------- stderr.log [tail 15] ----------
    if exist "%APP_DIR%logs\stderr.log" (
        powershell -NoProfile -Command "Get-Content -Tail 15 '%APP_DIR%logs\stderr.log'" 2>nul
    ) else (
        echo [stderr.log not found yet]
    )
    echo ---------- stdout.log [tail 15] ----------
    if exist "%APP_DIR%logs\stdout.log" (
        powershell -NoProfile -Command "Get-Content -Tail 15 '%APP_DIR%logs\stdout.log'" 2>nul
    ) else (
        echo [stdout.log not found yet]
    )
    echo ---------- bootstrap.log [tail 20] ----------
    if exist "%APP_DIR%logs\bootstrap.log" (
        powershell -NoProfile -Command "Get-Content -Tail 20 '%APP_DIR%logs\bootstrap.log'" 2>nul
    ) else (
        echo [bootstrap.log not found yet - app.py never reached startup]
    )
    echo -------------------------------------------------
    goto :fail
)

echo [4/4] Done!
echo.
"%NSSM%" status %SERVICE_NAME%
echo Health check: http://localhost:%PORT%/healthz
echo Service name: %SERVICE_NAME%  ^(see services.msc^)
goto :done

:uninstall
echo ============ Uninstalling service: %SERVICE_NAME% ============
"%NSSM%" stop %SERVICE_NAME% >nul 2>nul
"%NSSM%" remove %SERVICE_NAME% confirm
echo Service removed.
goto :done

:start
"%NSSM%" start %SERVICE_NAME%
if errorlevel 1 (
    echo [ERROR] Failed to start service. Check log: %APP_DIR%logs\stderr.log
    goto :fail
)
"%NSSM%" status %SERVICE_NAME%
goto :done

:stop
"%NSSM%" stop %SERVICE_NAME%
"%NSSM%" status %SERVICE_NAME%
goto :done

:restart
"%NSSM%" restart %SERVICE_NAME%
"%NSSM%" status %SERVICE_NAME%
goto :done

:status
"%NSSM%" status %SERVICE_NAME%
goto :done

:fail
echo.
echo [FAILED] Operation completed with errors.
if "%PAUSE_MODE%"=="1" pause
exit /b 1

:done
echo.
echo [OK] Operation finished.
if "%PAUSE_MODE%"=="1" pause
exit /b 0
