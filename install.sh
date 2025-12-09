#!/bin/bash

# Claude Code Switcher GUI 安装脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="cc_switcher_gui"
INSTALL_DIR="$HOME/.local/bin"
CONFIG_DIR="$HOME/.config/cc_switcher"

echo "Claude Code Switcher GUI 安装脚本"
echo "=================================="

# 检查 Rust 是否安装
check_rust() {
    if ! command -v rustc >/dev/null 2>&1; then
        echo "❌ Rust 未安装"
        echo "正在安装 Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
        
        if ! command -v rustc >/dev/null 2>&1; then
            echo "❌ Rust 安装失败"
            exit 1
        fi
        echo "✅ Rust 安装成功"
    else
        echo "✅ Rust 已安装: $(rustc --version)"
    fi
}

# 构建项目
build_project() {
    echo "🔨 构建项目..."
    cd "$SCRIPT_DIR"
    
    # 更新依赖
    cargo update
    
    # 构建发布版本
    cargo build --release
    
    if [[ ! -f "target/release/$PROJECT_NAME" ]]; then
        echo "❌ 构建失败"
        exit 1
    fi
    
    echo "✅ 构建成功"
}

# 安装二进制文件
install_binary() {
    echo "📦 安装二进制文件..."
    
    # 创建安装目录
    mkdir -p "$INSTALL_DIR"
    
    # 复制二进制文件
    cp "target/release/$PROJECT_NAME" "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/$PROJECT_NAME"
    
    # 检查 PATH
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        echo "⚠️  请将 $INSTALL_DIR 添加到 PATH 环境变量中"
        echo "添加以下行到 ~/.bashrc 或 ~/.zshrc:"
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi
    
    echo "✅ 二进制文件已安装到 $INSTALL_DIR/$PROJECT_NAME"
}

# 设置配置目录
setup_config() {
    echo "⚙️  设置配置目录..."
    mkdir -p "$CONFIG_DIR"
    
    # 创建默认配置文件
    if [[ ! -f "$CONFIG_DIR/config.json" ]]; then
        cat > "$CONFIG_DIR/config.json" << 'EOF'
{
  "current": null,
  "profiles": {}
}
EOF
        echo "✅ 创建默认配置文件"
    else
        echo "✅ 配置文件已存在"
    fi
    
    # 设置权限
    chmod 600 "$CONFIG_DIR/config.json"
}

# 创建桌面快捷方式（Linux）
create_desktop_shortcut() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "🖥️  创建桌面快捷方式..."
        
        mkdir -p "$HOME/.local/share/applications"
        
        cat > "$HOME/.local/share/applications/cc-switcher-gui.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Claude Code Switcher
Comment=Claude Code configuration manager with GUI
Exec=$INSTALL_DIR/$PROJECT_NAME
Icon=applications-system
Terminal=false
Categories=Development;Utility;
EOF
        
        echo "✅ 桌面快捷方式已创建"
    fi
}

# 显示完成信息
show_completion() {
    echo ""
    echo "🎉 安装完成!"
    echo "============="
    echo ""
    echo "使用方法:"
    echo "  直接运行: $PROJECT_NAME"
    echo "  或完整路径: $INSTALL_DIR/$PROJECT_NAME"
    echo ""
    echo "配置文件位置:"
    echo "  $CONFIG_DIR/config.json"
    echo ""
    echo "功能特性:"
    echo "  • GUI 配置文件管理"
    echo "  • 多供应商切换"
    echo "  • 远程 Linux 配置同步"
    echo "  • 环境变量管理"
    echo ""
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        echo "⚠️  重要: 请将 $INSTALL_DIR 添加到 PATH 环境变量中"
        echo ""
    fi
}

# 主安装流程
main() {
    echo "开始安装 Claude Code Switcher GUI..."
    echo ""
    
    check_rust
    build_project
    install_binary
    setup_config
    create_desktop_shortcut
    show_completion
}

# 处理命令行参数
case "${1:-}" in
    --check-rust)
        check_rust
        ;;
    --build-only)
        build_project
        ;;
    --install-only)
        install_binary
        ;;
    --help|-h)
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  --check-rust     仅检查 Rust 安装"
        echo "  --build-only     仅构建项目"
        echo "  --install-only   仅安装二进制文件"
        echo "  --help, -h       显示此帮助信息"
        echo ""
        echo "不带参数运行将执行完整安装过程"
        ;;
    *)
        main
        ;;
esac
