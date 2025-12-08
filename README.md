# cc_switcher

[中文](README_zh.md) | English

A management tool for switching Claude Code accounts, supporting quick switching between different API endpoints and authentication tokens. Includes both CLI (shell script) and Web UI (React) versions.

## 🚀 Quick Start

### Web UI Version

#### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Usage

1. **Access the UI**: Open your browser and navigate to `http://localhost:5173` (or the port shown in terminal)

2. **Add Provider**: Click "添加供应商" button to add a new API provider configuration
   - Fill in provider name, API base URL, and authentication token
   - Select environment mode: Local / WSL / SSH Remote
   - For SSH Remote, configure host, port, username, SSH key path, and optional working directory

3. **Manage Providers**: 
   - View all configured providers in the list
   - Click "使用此配置" to activate a provider
   - Click "编辑" to modify existing configuration
   - Click "删除" to remove a provider

4. **Import/Export**:
   - **Export**: Click "导出配置" to download configuration as JSON or SQL file
   - **Import**: Click "导入配置" to upload and restore configuration from file
   - SQL format is compatible with the CLI version's database and [cc-switch](https://github.com/farion1231/cc-switch) project

5. **Multi-Environment Support**:
   - Local, WSL, and Remote Linux can share the same SQL configuration file
   - Each environment can independently select its active provider
   - Configuration changes are stored in browser localStorage

### 🔌 Local Agent (Recommended for Windows)

The Web UI runs in a browser and cannot directly write configuration files. Use the **Local Agent** to enable one-click configuration:

```bash
# Install and start the local agent
cd local-agent
npm install
npm start
```

Once the agent is running (default port: 17532), the Web UI will detect it and enable:
- **Direct File Writing**: One-click apply configuration to `~/.claude/settings.json`, `~/.codex/config.toml`, etc.
- **Auto Backup**: Automatically backup existing configuration before writing
- **Multi-Platform**: Works on Windows, Linux, macOS, and WSL

The agent status indicator will appear in the Web UI header showing connection status.

### CLI Version (Shell Script)

**Pure Shell Script Implementation** - The CLI tool is implemented entirely in shell script (bash/zsh), not Python, Node.js, or other runtime languages.

### Why Shell Script?

- **🚀 Lightning Fast**: No interpreter startup time - executes instantly
- **📦 Zero Runtime Dependencies**: Works on any Unix-like system with bash/zsh
- **🔧 Native Environment Integration**: Direct shell environment variable manipulation
- **💾 Minimal Resource Usage**: Extremely low memory footprint and CPU usage
- **🎯 Perfect for the Job**: Environment variable management is shell's native domain
- **📱 Universal Compatibility**: Available on virtually every development environment
- **🔄 Instant Effect**: Changes apply immediately to current shell session
- **🛠️ Easy to Customize**: Simple, readable code that's easy to modify
- **📋 No Package Management**: No need for pip, npm, cargo, or other package managers

## Features

- **Zero Dependencies**: Pure shell implementation, only requires `jq`
- **Cross-Shell**: Compatible with bash and zsh
- **Instant Effect**: `ccs select/use` directly updates current shell environment variables
- **Secure Storage**: Configuration stored in `~/.config/cc_switcher/config.json`
- **Safe Writing**: Injection-proof JSON writing and export value escaping
- **Clean Installation**: No output when sourcing rc files

## Quick Start

### 1. Install Shell Integration

```bash
# Auto-detect current shell (zsh/bash)
./setup.sh

# Or specify manually
./setup.sh zsh
./setup.sh bash
./setup.sh both

# Optional: Check if jq is installed
./setup.sh --check-jq

# Reload configuration
source ~/.zshrc  # or ~/.bashrc
```

### 2. Add Configuration

```bash
# Interactive mode
ccs add

# Command line mode
ccs add work --base-url https://api.anthropic.com --token sk-xxx
ccs add poky --base-url https://api.packycode.com --token sk-yyy
```

### 3. Usage

```bash
# View all configurations
ccs list

# Switch configuration (automatically update environment variables)
ccs select work
ccs use poky

# View current configuration
ccs current

# Delete configuration
ccs delete old_config
```

## Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `add [name] [options]` | Add new configuration | `ccs add work --base-url https://api.anthropic.com --token sk-xxx` |
| `list` | List all configurations | `ccs list` |
| `select <name>` | Select configuration and update current shell environment | `ccs select work` |
| `use <name>` | Same as select, switch to specified configuration | `ccs use work` |
| `current` | Show current configuration name | `ccs current` |
| `delete <name>` | Delete configuration | `ccs delete work` |
| `env [name]` | Output export statements (without updating environment) | `eval "$(ccs env work)"` |
| `apply [name]` | Same as env, output export statements | `eval "$(ccs apply)"` |
| `help` | Show help | `ccs help` |

### Options

- `--base-url <url>` - API base URL
- `--token <token>` - Authentication token
- `--set-current` - Set as current configuration after adding

## Installation & Uninstallation

### Installation

```bash
# Basic installation
./setup.sh

# Specify shell
./setup.sh zsh
./setup.sh bash
./setup.sh both

# Check dependencies
./setup.sh --check-jq
```

### Uninstallation

```bash
# Uninstall shell integration
./setup.sh uninstall zsh
./setup.sh uninstall bash
./setup.sh uninstall both

# Then reload rc
source ~/.zshrc  # or ~/.bashrc
```

## How It Works

1. **Configuration Storage**: JSON format stored in `~/.config/cc_switcher/config.json`
2. **Environment Variables**: Sets `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN`
3. **Shell Integration**: `setup.sh` writes lightweight `ccs()` function in rc files
4. **Instant Effect**: Function applies environment variables in current shell via `eval "$(ccs env ...)"`

## Security Features

- **Safe JSON Writing**: Uses `jq --arg` to prevent injection attacks
- **Value Escaping**: Exported environment variable values are single-quote escaped
- **Permission Control**: Configuration files are readable/writable by current user only
- **Error Isolation**: stdout/stderr separation for easy script composition

## Compatibility

- **Shell**: bash 4.0+, zsh 5.0+
- **System**: Linux, macOS, WSL
- **Dependencies**: jq (JSON processing)

Install jq:
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

## Troubleshooting

### ccs command not found
```bash
# Confirm installation has been run
./setup.sh

# Reload shell configuration
source ~/.zshrc  # or ~/.bashrc

# Or restart terminal
```

### jq not installed
```bash
# Check jq
./setup.sh --check-jq

# Install jq as prompted
```

### Environment variables not taking effect
- Ensure using `ccs select` or `ccs use` instead of directly executing script
- Test in new terminal to confirm shell integration is loaded

## Configuration File Format

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

## 📋 Configuration Templates

Pre-configured templates for Claude Code, OpenAI Codex, and Google Gemini are available in the `templates/` directory:

- **`templates/providers-template.sql`** - SQL format template with Claude, Codex, and Gemini configurations

### Included Templates

| Provider | API Endpoint | Models |
|----------|--------------|--------|
| Claude Official API | `https://api.anthropic.com` | claude-sonnet-4, claude-3-5-haiku, claude-3-opus |
| Claude Max (Pro) | `https://api.claude.ai` | claude-sonnet-4, claude-3-5-haiku, claude-3-opus |
| OpenAI Codex | `https://api.openai.com/v1` | gpt-5.1-codex-max, gpt-5-codex |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | gemini-2.0-flash |
| OpenRouter | `https://openrouter.ai/api/v1` | Multiple providers |

### Export Formats

The Web UI supports multiple export formats:

| Format | File | Description |
|--------|------|-------------|
| JSON | `providers.json` | Standard configuration format |
| SQL | `providers.sql` | cc-switch compatible format |
| Claude settings.json | `~/.claude/settings.json` | Claude Code official format |
| Codex config.toml | `~/.codex/config.toml` | Codex CLI official format |
| Shell Environment | `.env.sh` | Bash/Zsh export format |

### Using Templates

```bash
# Import via Web UI
1. Open cc_switcher Web UI
2. Click "导入配置" (Import)
3. Select templates/providers-template.sql
4. Edit imported providers to add your API keys

# Or edit SQL directly
cp templates/providers-template.sql my-config.sql
# Edit my-config.sql to replace YOUR_API_KEY_HERE with actual keys
# Then import the modified file
```

### Official Documentation

- **Claude Code**: https://docs.anthropic.com/
- **OpenAI Codex**: https://platform.openai.com/docs
- **Google Gemini**: https://ai.google.dev/docs
- **OpenRouter**: https://openrouter.ai/docs

## License

MIT License