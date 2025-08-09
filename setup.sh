#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CCS_SCRIPT="$SCRIPT_DIR/ccs"

echo "Setting up cc_switcher..."

if [[ ! -f "$CCS_SCRIPT" ]]; then
    echo "Error: ccs script not found at $CCS_SCRIPT" >&2
    exit 1
fi

chmod +x "$CCS_SCRIPT"

ACTION="install"
TARGET="auto"
CHECK_JQ=0
for arg in "$@"; do
  case "$arg" in
    uninstall) ACTION="uninstall" ;;
    auto|bash|zsh|both) TARGET="$arg" ;;
    --check-jq) CHECK_JQ=1 ;;
    *) ;;
  esac
done

rc_targets=()
case "$TARGET" in
  auto)
    CURRENT_SHELL="$(ps -p $$ -o comm= 2>/dev/null || echo "unknown")"
    if [[ "$CURRENT_SHELL" == *"zsh"* ]] || [[ "$SHELL" == *"zsh"* ]]; then
      echo "Detected zsh shell"
      rc_targets+=("$HOME/.zshrc")
    elif [[ "$CURRENT_SHELL" == *"bash"* ]] || [[ "$SHELL" == *"bash"* ]]; then
      echo "Detected bash shell"
      rc_targets+=("$HOME/.bashrc")
    else
      echo "Unknown shell. Use: ./setup.sh [auto|bash|zsh|both]"
      exit 1
    fi
    ;;
  bash)
    rc_targets+=("$HOME/.bashrc")
    ;;
  zsh)
    rc_targets+=("$HOME/.zshrc")
    ;;
  both)
    rc_targets+=("$HOME/.bashrc" "$HOME/.zshrc")
    ;;
  *)
    echo "Unknown option. Use: ./setup.sh [auto|bash|zsh|both]"
    exit 1
    ;;
esac

SETUP_MARKER="# cc_switcher setup"
SETUP_FUNCTION="ccs() {
    local script_path='$CCS_SCRIPT'
    case \"\$1\" in
        select|use)
            local name=\"\$2\"
            if [[ -z \"\$name\" ]]; then
                echo \"usage: ccs \$1 <name>\" >&2
                return 2
            fi
            local result
            result=\"\$(CCS_SHELL_INTEGRATION=1 \"\$script_path\" \"\$1\" \"\$name\" 2>&1)\"
            local exit_code=\$?
            if [[ \$exit_code -eq 0 ]]; then
                eval \"\$(CCS_SHELL_INTEGRATION=1 \"\$script_path\" env \"\$name\")\"
                echo \"\$result\" >&2
            else
                echo \"\$result\" >&2
                return \$exit_code
            fi
            ;;
        *)
            \"\$script_path\" \"\$@\"
            ;;
    esac
}"
 
if [[ "$ACTION" == "uninstall" ]]; then
  for SHELL_RC in "${rc_targets[@]}"; do
    if [[ -f "$SHELL_RC" ]]; then
      if grep -Fq "$SETUP_MARKER" "$SHELL_RC" 2>/dev/null; then
        sed -i "/^# cc_switcher setup$/,/^}$/d" "$SHELL_RC"
        echo "Removed cc_switcher from $SHELL_RC"
      else
        echo "No cc_switcher block found in $SHELL_RC"
      fi
    fi
  done
else
  for SHELL_RC in "${rc_targets[@]}"; do
    if [[ ! -f "$SHELL_RC" ]]; then
      : > "$SHELL_RC"
    fi
    sed -i "\~source '$CCS_SCRIPT'~d" "$SHELL_RC" 2>/dev/null || true
    if grep -Fq "$SETUP_MARKER" "$SHELL_RC" 2>/dev/null; then
      echo "cc_switcher is already set up in $SHELL_RC"
    else
      echo "" >> "$SHELL_RC"
      echo "$SETUP_MARKER" >> "$SHELL_RC"
      echo "$SETUP_FUNCTION" >> "$SHELL_RC"
      echo "Added cc_switcher setup to $SHELL_RC"
    fi
  done
fi

if [[ $CHECK_JQ -eq 1 ]]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo
    echo "jq not found. Install with one of:" 
    echo "  Debian/Ubuntu: sudo apt install -y jq"
    echo "  Fedora: sudo dnf install -y jq"
    echo "  Arch: sudo pacman -S jq"
    echo "  macOS: brew install jq"
  else
    echo
    echo "jq is installed: $(command -v jq)"
  fi
fi

echo
if [[ "$ACTION" == "uninstall" ]]; then
  echo "Uninstall complete! Please run:"
else
  echo "Setup complete! Please run:"
fi
for SHELL_RC in "${rc_targets[@]}"; do
  echo "  source $SHELL_RC"
done
echo
echo "Or restart your shell to apply changes."
