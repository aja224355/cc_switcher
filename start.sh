#!/bin/bash

# CC Switcher 一键安装启动脚本
# 同时启动 local-agent 和 Web UI

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Logo
echo -e "${CYAN}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ██████╗ ██████╗    ███████╗██╗    ██╗██╗████████╗██████╗██╗  ██╗║
║    ██╔════╝██╔════╝    ██╔════╝██║    ██║██║╚══██╔══╝██╔════╝██║  ██║║
║    ██║     ██║         ███████╗██║ █╗ ██║██║   ██║   ██║     ███████║║
║    ██║     ██║         ╚════██║██║███╗██║██║   ██║   ██║     ██╔══██║║
║    ╚██████╗╚██████╗    ███████║╚███╔███╔╝██║   ██║   ╚██████╗██║  ██║║
║     ╚═════╝ ╚═════╝    ╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝║
║                                                               ║
║           Claude / Codex / Gemini 配置管理工具                  ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 Node.js
check_node() {
    echo -e "${BLUE}[1/4]${NC} 检查 Node.js..."
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js 未安装${NC}"
        echo ""
        echo "请先安装 Node.js (推荐 v18+):"
        echo "  - 官网下载: https://nodejs.org/"
        echo "  - Windows: winget install OpenJS.NodeJS"
        echo "  - macOS: brew install node"
        echo "  - Ubuntu: sudo apt install nodejs npm"
        exit 1
    fi
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"
}

# 检查 npm
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}✗ npm 未安装${NC}"
        exit 1
    fi
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm v$NPM_VERSION${NC}"
}

# 安装主项目依赖
install_main_deps() {
    echo ""
    echo -e "${BLUE}[2/4]${NC} 安装 Web UI 依赖..."
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${GREEN}✓ Web UI 依赖已安装${NC}"
    fi
}

# 安装 local-agent 依赖
install_agent_deps() {
    echo ""
    echo -e "${BLUE}[3/4]${NC} 安装本地代理依赖..."
    if [ ! -d "local-agent/node_modules" ]; then
        cd local-agent
        npm install
        cd ..
    else
        echo -e "${GREEN}✓ 本地代理依赖已安装${NC}"
    fi
}

# 检查端口是否被占用
check_port() {
    if command -v lsof &> /dev/null; then
        lsof -i :$1 &> /dev/null && return 0 || return 1
    elif command -v netstat &> /dev/null; then
        netstat -tuln | grep -q ":$1 " && return 0 || return 1
    elif command -v ss &> /dev/null; then
        ss -tuln | grep -q ":$1 " && return 0 || return 1
    fi
    return 1
}

# 启动服务
start_services() {
    echo ""
    echo -e "${BLUE}[4/4]${NC} 启动服务..."
    echo ""
    
    # 启动 local-agent (后台运行)
    echo -e "${CYAN}启动本地代理 (端口 17532)...${NC}"
    if check_port 17532; then
        echo -e "${YELLOW}⚠ 端口 17532 已被占用，本地代理可能已在运行${NC}"
    else
        cd local-agent
        nohup node index.js > ../local-agent.log 2>&1 &
        AGENT_PID=$!
        cd ..
        echo $AGENT_PID > .agent.pid
        sleep 1
        
        # 检查是否启动成功
        if kill -0 $AGENT_PID 2>/dev/null; then
            echo -e "${GREEN}✓ 本地代理已启动 (PID: $AGENT_PID)${NC}"
        else
            echo -e "${RED}✗ 本地代理启动失败，请查看 local-agent.log${NC}"
        fi
    fi
    
    echo ""
    echo -e "${CYAN}启动 Web UI (端口 5173)...${NC}"
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  🌐 Web UI:        ${CYAN}http://localhost:5173${NC}"
    echo -e "  🔌 本地代理:      ${CYAN}http://localhost:17532${NC}"
    echo ""
    echo -e "  📋 代理日志:      ${YELLOW}local-agent.log${NC}"
    echo ""
    echo -e "  💡 提示: 按 ${YELLOW}Ctrl+C${NC} 停止所有服务"
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # 启动 Web UI (前台运行)
    npm run dev
}

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}正在停止服务...${NC}"
    if [ -f .agent.pid ]; then
        AGENT_PID=$(cat .agent.pid)
        if kill -0 $AGENT_PID 2>/dev/null; then
            kill $AGENT_PID
            echo -e "${GREEN}✓ 本地代理已停止${NC}"
        fi
        rm -f .agent.pid
    fi
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM

# 主流程
main() {
    check_node
    check_npm
    install_main_deps
    install_agent_deps
    start_services
}

main
