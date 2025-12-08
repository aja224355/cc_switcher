@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: CC Switcher 一键安装启动脚本 (Windows)
:: 同时启动 local-agent 和 Web UI

title CC Switcher

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║     ██████╗ ██████╗    ███████╗██╗    ██╗██╗████████╗██████╗  ║
echo ║    ██╔════╝██╔════╝    ██╔════╝██║    ██║██║╚══██╔══╝██╔════╝ ║
echo ║    ██║     ██║         ███████╗██║ █╗ ██║██║   ██║   ██║      ║
echo ║    ██║     ██║         ╚════██║██║███╗██║██║   ██║   ██║      ║
echo ║    ╚██████╗╚██████╗    ███████║╚███╔███╔╝██║   ██║   ╚██████╗ ║
echo ║     ╚═════╝ ╚═════╝    ╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝ ║
echo ║                                                               ║
echo ║           Claude / Codex / Gemini 配置管理工具                ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: 获取脚本所在目录
cd /d "%~dp0"

:: 检查 Node.js
echo [1/4] 检查 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装
    echo.
    echo 请先安装 Node.js ^(推荐 v18+^):
    echo   - 官网下载: https://nodejs.org/
    echo   - 或运行: winget install OpenJS.NodeJS
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%

:: 检查 npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] npm 未安装
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm v%NPM_VERSION%

:: 安装主项目依赖
echo.
echo [2/4] 安装 Web UI 依赖...
if not exist "node_modules" (
    call npm install
) else (
    echo [OK] Web UI 依赖已安装
)

:: 安装 local-agent 依赖
echo.
echo [3/4] 安装本地代理依赖...
if not exist "local-agent\node_modules" (
    cd local-agent
    call npm install
    cd ..
) else (
    echo [OK] 本地代理依赖已安装
)

:: 启动服务
echo.
echo [4/4] 启动服务...
echo.

:: 启动 local-agent (新窗口)
echo 启动本地代理 (端口 17532)...
start "CC Switcher Agent" /min cmd /c "cd local-agent && node index.js"
timeout /t 2 /nobreak >nul
echo [OK] 本地代理已在新窗口启动

echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo   Web UI:        http://localhost:5173
echo   本地代理:      http://localhost:17532
echo.
echo   提示: 关闭此窗口将停止 Web UI
echo         手动关闭 "CC Switcher Agent" 窗口以停止代理
echo.
echo ════════════════════════════════════════════════════════════════
echo.

:: 启动 Web UI
echo 启动 Web UI (端口 5173)...
call npm run dev

pause
