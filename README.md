# cc_switcher

[中文](README_zh.md) | English

A CLI tool for switching Claude Code accounts, supporting quick switching between different API endpoints and authentication tokens.

## Implementation

**Pure Shell Script Implementation** - This tool is implemented entirely in shell script (bash/zsh), not Python, Node.js, or other runtime languages.

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

## License

MIT License