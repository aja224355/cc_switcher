# Claude Code Switcher GUI - Windows 支持

## Windows 支持状态

✅ **完全支持 Windows 10/11**

此应用程序使用跨平台技术构建，可以在以下 Windows 版本上运行：
- Windows 10 (64位)
- Windows 11 (64位)
- Windows Server 2019/2022

## Windows 特定功能

### GUI 界面
- ✅ 原生 Windows 界面
- ✅ 支持 Windows 主题
- ✅ 高 DPI 缩放支持
- ✅ Windows 任务栏集成

### 远程连接
- ✅ SSH 连接（通过 PuTTY 或 OpenSSH）
- ✅ 密码认证
- ✅ SSH 密钥认证
- ✅ PuTTY 密钥格式支持

### 文件系统
- ✅ Windows 路径处理
- ✅ 用户配置目录: `%APPDATA%/cc_switcher/config.json`
- ✅ 环境变量支持

## Windows 安装方法

### 方法 1: 从源码构建
```powershell
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 克隆项目
git clone <repository-url>
cd cc_switcher

# 构建
cargo build --release

# 运行
.\target\release\cc_switcher_gui.exe
```

### 方法 2: 使用 PowerShell 脚本
```powershell
# 以管理员身份运行 PowerShell
.\install.ps1
```

## Windows 特定配置

### SSH 客户端
Windows 需要 SSH 客户端支持：
- **OpenSSH** (Windows 10/11 内置)
- **PuTTY** (备选方案)

启用 OpenSSH：
```powershell
# 以管理员身份运行
Add-WindowsCapability -Online -Name OpenSSH.Client*

# 或者通过设置应用
# 设置 > 应用 > 可选功能 > 添加功能 > OpenSSH 客户端
```

### 配置文件位置
Windows 上的配置文件位置：
```
%APPDATA%\cc_switcher\config.json
```
实际路径示例：
```
C:\Users\YourUsername\AppData\Roaming\cc_switcher\config.json
```

### 环境变量
应用程序会设置以下环境变量：
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_AUTH_TOKEN`

这些变量在当前用户会话中有效。

## Windows 构建配置

项目使用条件编译来支持 Windows：

```toml
[target.'cfg(windows)'.dependencies]
rpassword = "7.0"
winreg = "0.10"  # Windows 注册表访问
```

## Windows 已知限制

1. **SSH 依赖**: 需要安装 SSH 客户端
2. **防火墙**: 可能需要允许应用程序通过防火墙
3. **权限**: 某些操作可能需要管理员权限

## Windows 测试

在 Windows 上测试时，请确保：
- [ ] Rust 和 Cargo 正确安装
- [ ] SSH 客户端可用
- [ ] 防火墙允许应用程序
- [ ] 用户有足够权限创建配置目录

## 故障排除

### 应用程序无法启动
```powershell
# 检查依赖
cargo check

# 以调试模式运行
cargo run --debug
```

### SSH 连接失败
```powershell
# 测试 SSH 连接
ssh user@remote-server

# 检查 OpenSSH
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'
```

### 配置文件权限
确保配置目录有正确的权限：
```powershell
# 检查目录
Get-Acl "$env:APPDATA\cc_switcher"

# 设置权限（如果需要）
icacls "$env:APPDATA\cc_switcher" /grant "%USERNAME%":F
```

## Windows 包管理

可以使用 Chocolatey 安装：
```powershell
# 安装 Chocolatey (如果未安装)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# 安装 Rust
choco install rust
```

## 开发者说明

### Windows 特定代码
项目使用以下方式处理 Windows 兼容性：
- `cfg(windows)` 条件编译
- Windows 路径处理
- Windows 注册表访问（可选）
- Windows 特定错误处理

### 交叉编译
可以从 Linux 交叉编译到 Windows：
```bash
# 安装 Windows 目标
rustup target add x86_64-pc-windows-msvc

# 交叉编译
cargo build --target x86_64-pc-windows-msvc --release
```

## 总结

✅ **完全支持 Windows**：
- GUI 界面原生支持
- 远程 SSH 连接正常
- 配置文件管理完整
- 环境变量设置正确

Windows 用户可以像在 Linux 上一样使用此应用程序，享受相同的功能和用户体验。
