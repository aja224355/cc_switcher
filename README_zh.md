# cc_switcher

English | [中文](README_zh.md)

一个用于切换 Claude Code 账户的 CLI 工具，支持快速在不同 API 端点和认证令牌间切换。

## 实现方式

**纯 Shell 脚本实现** - 本工具完全使用 shell 脚本（bash/zsh）实现，而非 Python、Node.js 或其他运行时语言。

### 为什么选择 Shell 脚本？

- **🚀 闪电般快速**：无解释器启动时间 - 瞬间执行
- **📦 零运行时依赖**：在任何类 Unix 系统上都能运行，只需 bash/zsh
- **🔧 原生环境集成**：直接操作 shell 环境变量
- **💾 极低资源占用**：内存占用和 CPU 使用极少
- **🎯 完美适配任务**：环境变量管理是 shell 的原生领域
- **📱 通用兼容性**：几乎在所有开发环境中都可用
- **🔄 即时生效**：更改立即应用到当前 shell 会话
- **🛠️ 易于定制**：简单易读的代码，容易修改
- **📋 无包管理需求**：不需要 pip、npm、cargo 或其他包管理器

## 特性

- **零依赖**：纯 shell 实现，仅需 `jq`
- **跨 shell**：兼容 bash 和 zsh
- **即时生效**：`ccs select/use` 直接更新当前 shell 环境变量
- **安全存储**：配置存储在 `~/.config/cc_switcher/config.json`
- **安全写入**：防注入的 JSON 写入和导出值转义
- **干净安装**：不在 source rc 时产生输出

## 快速开始

### 1. 安装 shell 集成

```bash
# 自动检测当前 shell (zsh/bash)
./setup.sh

# 或手动指定
./setup.sh zsh
./setup.sh bash
./setup.sh both

# 可选：检测 jq 是否安装
./setup.sh --check-jq

# 重新加载配置
source ~/.zshrc  # 或 ~/.bashrc
```

### 2. 添加配置

```bash
# 交互模式
ccs add

# 命令行模式
ccs add work --base-url https://api.anthropic.com --token sk-xxx
ccs add poky --base-url https://api.packycode.com --token sk-yyy
```

### 3. 使用

```bash
# 查看所有配置
ccs list

# 切换配置（自动更新环境变量）
ccs select work
ccs use poky

# 查看当前配置
ccs current

# 删除配置
ccs delete old_config
```

## 命令参考

| 命令 | 说明 | 示例 |
|------|------|------|
| `add [name] [options]` | 添加新配置 | `ccs add work --base-url https://api.anthropic.com --token sk-xxx` |
| `list` | 列出所有配置 | `ccs list` |
| `select <name>` | 选择配置并更新当前 shell 环境变量 | `ccs select work` |
| `use <name>` | 同 select，切换到指定配置 | `ccs use work` |
| `current` | 显示当前配置名称 | `ccs current` |
| `delete <name>` | 删除配置 | `ccs delete work` |
| `env [name]` | 输出 export 语句（不更新环境）| `eval "$(ccs env work)"` |
| `apply [name]` | 同 env，输出 export 语句 | `eval "$(ccs apply)"` |
| `help` | 显示帮助 | `ccs help` |

### 选项

- `--base-url <url>` - API 基础 URL
- `--token <token>` - 认证令牌
- `--set-current` - 添加后立即设为当前配置

## 安装与卸载

### 安装

```bash
# 基本安装
./setup.sh

# 指定 shell
./setup.sh zsh
./setup.sh bash
./setup.sh both

# 检测依赖
./setup.sh --check-jq
```

### 卸载

```bash
# 卸载 shell 集成
./setup.sh uninstall zsh
./setup.sh uninstall bash
./setup.sh uninstall both

# 然后重新加载 rc
source ~/.zshrc  # 或 ~/.bashrc
```

## 工作原理

1. **配置存储**：JSON 格式存储在 `~/.config/cc_switcher/config.json`
2. **环境变量**：设置 `ANTHROPIC_BASE_URL` 和 `ANTHROPIC_AUTH_TOKEN`
3. **Shell 集成**：`setup.sh` 在 rc 文件中写入轻量 `ccs()` 函数
4. **即时生效**：函数通过 `eval "$(ccs env ...)"` 在当前 shell 中应用环境变量

## 安全特性

- **JSON 安全写入**：使用 `jq --arg` 防止注入攻击
- **值转义**：导出的环境变量值经过单引号转义
- **权限控制**：配置文件仅当前用户可读写
- **错误隔离**：stdout/stderr 分离，便于脚本组合

## 兼容性

- **Shell**：bash 4.0+, zsh 5.0+
- **系统**：Linux, macOS, WSL
- **依赖**：jq (JSON 处理)

安装 jq：
```bash
# Debian/Ubuntu
sudo apt install -y jq

# Fedora
sudo dnf install -y jq

# Arch Linux
sudo pacman -S jq

# macOS
brew install jq
```

## 故障排除

### ccs 命令未找到
```bash
# 确认已运行安装
./setup.sh

# 重新加载 shell 配置
source ~/.zshrc  # 或 ~/.bashrc

# 或重启终端
```

### jq 未安装
```bash
# 检测 jq
./setup.sh --check-jq

# 按提示安装 jq
```

### 环境变量未生效
- 确保使用 `ccs select` 或 `ccs use` 而非直接执行脚本
- 在新终端中测试，确认 shell 集成已加载

## 配置文件格式

```json
{
  "current": "work",
  "profiles": {
    "work": {
      "base_url": "https://api.anthropic.com",
      "auth_token": "sk-xxx"
    },
    "poky": {
      "base_url": "https://api.packycode.com", 
      "auth_token": "sk-yyy"
    }
  }
}
```

## 许可证

MIT License
