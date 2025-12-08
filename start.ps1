# CC Switcher 一键安装启动脚本 (PowerShell)
# 同时启动 local-agent 和 Web UI

$ErrorActionPreference = "Stop"

# 颜色输出
function Write-ColorOutput {
    param([string]$Text, [ConsoleColor]$ForegroundColor = "White")
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Text
    $host.UI.RawUI.ForegroundColor = $fc
}

# ASCII Art Logo
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║     ██████╗ ██████╗    ███████╗██╗    ██╗██╗████████╗██████╗  ║" -ForegroundColor Cyan
Write-Host "║    ██╔════╝██╔════╝    ██╔════╝██║    ██║██║╚══██╔══╝██╔════╝ ║" -ForegroundColor Cyan
Write-Host "║    ██║     ██║         ███████╗██║ █╗ ██║██║   ██║   ██║      ║" -ForegroundColor Cyan
Write-Host "║    ██║     ██║         ╚════██║██║███╗██║██║   ██║   ██║      ║" -ForegroundColor Cyan
Write-Host "║    ╚██████╗╚██████╗    ███████║╚███╔███╔╝██║   ██║   ╚██████╗ ║" -ForegroundColor Cyan
Write-Host "║     ╚═════╝ ╚═════╝    ╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝ ║" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║           Claude / Codex / Gemini 配置管理工具                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# 检查 Node.js
Write-Host "[1/4] 检查 Node.js..." -ForegroundColor Blue
try {
    $nodeVersion = node -v 2>$null
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js 未安装" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先安装 Node.js (推荐 v18+):"
    Write-Host "  - 官网下载: https://nodejs.org/"
    Write-Host "  - 或运行: winget install OpenJS.NodeJS"
    Read-Host "按 Enter 退出"
    exit 1
}

# 检查 npm
try {
    $npmVersion = npm -v 2>$null
    Write-Host "✓ npm v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm 未安装" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

# 安装主项目依赖
Write-Host ""
Write-Host "[2/4] 安装 Web UI 依赖..." -ForegroundColor Blue
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "✓ Web UI 依赖已安装" -ForegroundColor Green
}

# 安装 local-agent 依赖
Write-Host ""
Write-Host "[3/4] 安装本地代理依赖..." -ForegroundColor Blue
if (-not (Test-Path "local-agent\node_modules")) {
    Push-Location "local-agent"
    npm install
    Pop-Location
} else {
    Write-Host "✓ 本地代理依赖已安装" -ForegroundColor Green
}

# 启动服务
Write-Host ""
Write-Host "[4/4] 启动服务..." -ForegroundColor Blue
Write-Host ""

# 启动 local-agent (新窗口)
Write-Host "启动本地代理 (端口 17532)..." -ForegroundColor Cyan
$agentProcess = Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory "$ScriptDir\local-agent" -WindowStyle Minimized -PassThru
Start-Sleep -Seconds 2
Write-Host "✓ 本地代理已启动 (PID: $($agentProcess.Id))" -ForegroundColor Green

# 保存代理进程 ID
$agentProcess.Id | Out-File -FilePath ".agent.pid" -Encoding UTF8

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 Web UI:        " -NoNewline
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host "  🔌 本地代理:      " -NoNewline
Write-Host "http://localhost:17532" -ForegroundColor Cyan
Write-Host ""
Write-Host "  💡 提示: 按 " -NoNewline
Write-Host "Ctrl+C" -ForegroundColor Yellow -NoNewline
Write-Host " 停止所有服务"
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# 清理函数
$cleanup = {
    Write-Host ""
    Write-Host "正在停止服务..." -ForegroundColor Yellow
    if (Test-Path ".agent.pid") {
        $pid = Get-Content ".agent.pid"
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "✓ 本地代理已停止" -ForegroundColor Green
        } catch {}
        Remove-Item ".agent.pid" -Force -ErrorAction SilentlyContinue
    }
}

# 注册清理事件
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $cleanup | Out-Null

try {
    # 启动 Web UI
    Write-Host "启动 Web UI (端口 5173)..." -ForegroundColor Cyan
    npm run dev
} finally {
    # 清理
    & $cleanup
}
