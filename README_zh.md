# cc_switcher

[English](README.md) | 中文

一个用于管理和切换 Claude Code 账户的工具，支持快速在不同 API 端点和认证令牌间切换。包含 CLI（shell 脚本）和 Web UI（React）两个版本。

## 🚀 快速开始

### Web UI 版本

#### 安装

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

#### 使用方法

1. **访问界面**：在浏览器中打开 `http://localhost:5173`（或终端显示的端口）

2. **添加供应商**：点击"添加供应商"按钮添加新的 API 供应商配置
   - 填写供应商名称、API 基础 URL 和认证令牌
   - 选择环境模式：本地 (Local) / WSL / SSH Remote
   - 对于 SSH Remote，配置主机、端口、用户名、SSH 密钥路径和可选的工作目录

3. **管理供应商**：
   - 在列表中查看所有已配置的供应商
   - 点击"使用此配置"激活某个供应商
   - 点击"编辑"修改现有配置
   - 点击"删除"移除供应商

4. **导入/导出**：
   - **导出**：点击"导出配置"将配置下载为 JSON 或 SQL 文件
   - **导入**：点击"导入配置"上传并恢复配置文件
   - SQL 格式与 CLI 版本的数据库兼容

5. **多环境支持**：
   - 本地、WSL 和远程 Linux 可以共用同一个 SQL 配置文件
   - 每个环境可以独立选择当前激活的供应商
   - 配置更改存储在浏览器的 localStorage 中

### CLI 版本（Shell 脚本）

**纯 Shell 脚本实现** - CLI 工具完全使用 shell 脚本（bash/zsh）实现，而非 Python、Node.js 或其他运行时语言。

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

## 📋 配置模板

`templates/` 目录中提供了 Claude Code、OpenAI Codex 和 Google Gemini 的预配置模板：

- **`templates/providers-template.sql`** - SQL 格式模板，包含 Claude、Codex 和 Gemini 配置

### 包含的模板

| 供应商 | API 端点 | 模型 |
|--------|----------|------|
| Claude 官方 API | `https://api.anthropic.com` | claude-sonnet-4, claude-3-5-haiku, claude-3-opus |
| Claude Max (Pro 订阅) | `https://api.claude.ai` | claude-sonnet-4, claude-3-5-haiku, claude-3-opus |
| OpenAI Codex | `https://api.openai.com/v1` | gpt-5.1-codex-max, gpt-5-codex |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | gemini-2.0-flash |
| OpenRouter | `https://openrouter.ai/api/v1` | 多供应商支持 |

### 导出格式

Web UI 支持多种导出格式：

| 格式 | 文件 | 说明 |
|------|------|------|
| JSON | `providers.json` | 标准配置格式 |
| SQL | `providers.sql` | cc-switch 兼容格式 |
| Claude settings.json | `~/.claude/settings.json` | Claude Code 官方格式 |
| Codex config.toml | `~/.codex/config.toml` | Codex CLI 官方格式 |
| Shell 环境变量 | `.env.sh` | Bash/Zsh export 格式 |

### 使用模板

```bash
# 通过 Web UI 导入
1. 打开 cc_switcher Web UI
2. 点击「导入配置」
3. 选择 templates/providers-template.sql
4. 编辑导入的供应商，填入你的 API Key

# 或直接编辑 SQL
cp templates/providers-template.sql my-config.sql
# 编辑 my-config.sql，将 YOUR_API_KEY_HERE 替换为实际密钥
# 然后导入修改后的文件
```

### 官方文档

- **Claude Code**: https://docs.anthropic.com/
- **OpenAI Codex**: https://platform.openai.com/docs
- **Google Gemini**: https://ai.google.dev/docs
- **OpenRouter**: https://openrouter.ai/docs

## 许可证

MIT License

