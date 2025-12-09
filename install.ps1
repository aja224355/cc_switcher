# Claude Code Switcher GUI - Windows 安装脚本

param(
    [switch]$BuildOnly,
    [switch]$InstallOnly,
    [switch]$CheckRust,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

Write-Host "Claude Code Switcher GUI - Windows 安装脚本" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 检查并安装 Rust
function Install-Rust {
    if (Get-Command rustc -ErrorAction SilentlyContinue) {
        Write-Host "✅ Rust 已安装: $(rustc --version)" -ForegroundColor Green
        return
    }

    Write-Host "❌ Rust 未安装" -ForegroundColor Red
    Write-Host "正在安装 Rust..." -ForegroundColor Yellow

    $rustup = "$env:TEMP\rustup-init.exe"
    Invoke-WebRequest -Uri "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe" -OutFile $rustup
    
    & $rustup -y --default-toolchain stable
    
    # 刷新环境变量
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    
    if (Get-Command rustc -ErrorAction SilentlyContinue) {
        Write-Host "✅ Rust 安装成功" -ForegroundColor Green
    } else {
        Write-Host "❌ Rust 安装失败" -ForegroundColor Red
        exit 1
    }
}

# 构建项目
function Build-Project {
    Write-Host "🔨 构建项目..." -ForegroundColor Yellow
    
    if (!(Test-Path "Cargo.toml")) {
        Write-Host "❌ 未找到 Cargo.toml，请在项目根目录运行此脚本" -ForegroundColor Red
        exit 1
    }
    
    # 更新依赖
    cargo update
    
    # 构建发布版本
    Write-Host "正在编译（这可能需要几分钟）..." -ForegroundColor Yellow
    cargo build --release
    
    if (Test-Path "target\release\cc_switcher_gui.exe") {
        Write-Host "✅ 构建成功" -ForegroundColor Green
    } else {
        Write-Host "❌ 构建失败" -ForegroundColor Red
        exit 1
    }
}

# 安装应用程序
function Install-Application {
    Write-Host "📦 安装应用程序..." -ForegroundColor Yellow
    
    $installDir = "$env:LOCALAPPDATA\Programs\cc_switcher_gui"
    $binaryName = "cc_switcher_gui.exe"
    
    # 创建安装目录
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    
    # 复制二进制文件
    Copy-Item "target\release\$binaryName" $installDir
    
    # 添加到 PATH（当前用户）
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($currentPath -notlike "*$installDir*") {
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$installDir", "User")
        Write-Host "✅ 已添加到 PATH 环境变量" -ForegroundColor Green
    }
    
    # 创建桌面快捷方式
    $WshShell = New-Object -comObject WScript.Shell
    $desktopPath = [System.Environment]::GetFolderPath('Desktop')
    $shortcut = $WshShell.CreateShortcut("$desktopPath\Claude Code Switcher GUI.lnk")
    $shortcut.TargetPath = "$installDir\$binaryName"
    $shortcut.WorkingDirectory = $installDir
    $shortcut.Description = "Claude Code configuration manager with GUI"
    $shortcut.Save()
    
    # 创建开始菜单快捷方式
    $startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
    if (!(Test-Path $startMenuPath)) {
        New-Item -ItemType Directory -Force -Path $startMenuPath | Out-Null
    }
    
    $startMenuShortcut = $WshShell.CreateShortcut("$startMenuPath\Claude Code Switcher GUI.lnk")
    $startMenuShortcut.TargetPath = "$installDir\$binaryName"
    $startMenuShortcut.WorkingDirectory = $installDir
    $startMenuShortcut.Description = "Claude Code configuration manager with GUI"
    $startMenuShortcut.Save()
    
    Write-Host "✅ 应用程序已安装到 $installDir" -ForegroundColor Green
    Write-Host "✅ 桌面快捷方式已创建" -ForegroundColor Green
    Write-Host "✅ 开始菜单快捷方式已创建" -ForegroundColor Green
}

# 设置配置目录
function Setup-Config {
    Write-Host "⚙️ 设置配置目录..." -ForegroundColor Yellow
    
    $configDir = "$env:APPDATA\cc_switcher"
    $configFile = "$configDir\config.json"
    
    # 创建配置目录
    New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    
    # 创建默认配置文件
    if (!(Test-Path $configFile)) {
        @"
{
  "current": null,
  "profiles": {}
}
"@ | Out-File -FilePath $configFile -Encoding UTF8
        Write-Host "✅ 创建默认配置文件" -ForegroundColor Green
    } else {
        Write-Host "✅ 配置文件已存在" -ForegroundColor Green
    }
    
    Write-Host "✅ 配置目录: $configDir" -ForegroundColor Green
}

# 检查 SSH 客户端
function Check-SSH {
    Write-Host "🔍 检查 SSH 客户端..." -ForegroundColor Yellow
    
    $sshAvailable = $false
    
    # 检查 OpenSSH
    if (Get-Command ssh -ErrorAction SilentlyContinue) {
        Write-Host "✅ OpenSSH 客户端已安装" -ForegroundColor Green
        $sshAvailable = $true
    }
    
    # 检查 PuTTY
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "✅ PuTTY 客户端已安装" -ForegroundColor Green
        $sshAvailable = $true
    }
    
    if (!$sshAvailable) {
        Write-Host "⚠️ 未找到 SSH 客户端" -ForegroundColor Yellow
        Write-Host "远程配置功能需要 SSH 客户端" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "安装 OpenSSH (推荐):" -ForegroundColor Cyan
        Write-Host "  Add-WindowsCapability -Online -Name OpenSSH.Client*" -ForegroundColor White
        Write-Host ""
        Write-Host "或安装 PuTTY:" -ForegroundColor Cyan
        Write-Host "  https://www.putty.org/" -ForegroundColor White
    }
}

# 显示完成信息
function Show-Completion {
    Write-Host ""
    Write-Host "🎉 安装完成!" -ForegroundColor Green
    Write-Host "================" -ForegroundColor Green
    Write-Host ""
    Write-Host "使用方法:" -ForegroundColor Cyan
    Write-Host "  命令行: cc_switcher_gui" -ForegroundColor White
    Write-Host "  或直接运行: $env:LOCALAPPDATA\Programs\cc_switcher_gui\cc_switcher_gui.exe" -ForegroundColor White
    Write-Host "  或使用桌面快捷方式" -ForegroundColor White
    Write-Host ""
    Write-Host "配置文件位置:" -ForegroundColor Cyan
    Write-Host "  $env:APPDATA\cc_switcher\config.json" -ForegroundColor White
    Write-Host ""
    Write-Host "功能特性:" -ForegroundColor Cyan
    Write-Host "  • GUI 配置文件管理" -ForegroundColor White
    Write-Host "  • 多供应商切换" -ForegroundColor White
    Write-Host "  • 远程 Linux 配置同步" -ForegroundColor White
    Write-Host "  • 环境变量管理" -ForegroundColor White
    Write-Host ""
    Write-Host "Windows 特定说明:" -ForegroundColor Cyan
    Write-Host "  • 支持 Windows 10/11" -ForegroundColor White
    Write-Host "  • 需要 SSH 客户端进行远程连接" -ForegroundColor White
    Write-Host "  • 配置文件位于用户 AppData 目录" -ForegroundColor White
    Write-Host ""
}

# 主函数
function Main {
    if ($Help) {
        Write-Host "用法: .\install.ps1 [选项]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "选项:" -ForegroundColor Yellow
        Write-Host "  -BuildOnly     仅构建项目" -ForegroundColor White
        Write-Host "  -InstallOnly   仅安装二进制文件" -ForegroundColor White
        Write-Host "  -CheckRust     仅检查 Rust 安装" -ForegroundColor White
        Write-Host "  -Help          显示此帮助信息" -ForegroundColor White
        Write-Host ""
        Write-Host "不带参数运行将执行完整安装过程" -ForegroundColor Yellow
        return
    }
    
    if ($CheckRust) {
        Install-Rust
        return
    }
    
    if ($BuildOnly) {
        Install-Rust
        Build-Project
        return
    }
    
    if ($InstallOnly) {
        if (!(Test-Path "target\release\cc_switcher_gui.exe")) {
            Write-Host "❌ 找不到构建的应用程序，请先运行 -BuildOnly" -ForegroundColor Red
            exit 1
        }
        Install-Application
        Setup-Config
        Check-SSH
        Show-Completion
        return
    }
    
    # 完整安装过程
    Write-Host "开始安装 Claude Code Switcher GUI..." -ForegroundColor Yellow
    Write-Host ""
    
    Install-Rust
    Build-Project
    Install-Application
    Setup-Config
    Check-SSH
    Show-Completion
}

# 执行主函数
Main
