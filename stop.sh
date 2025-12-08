#!/bin/bash

# CC Switcher 停止脚本
# 停止本地代理服务

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "CC Switcher 停止服务"
echo "===================="

# 停止本地代理
if [ -f .agent.pid ]; then
    AGENT_PID=$(cat .agent.pid)
    if kill -0 $AGENT_PID 2>/dev/null; then
        kill $AGENT_PID
        echo -e "${GREEN}✓ 本地代理已停止 (PID: $AGENT_PID)${NC}"
    else
        echo -e "${YELLOW}⚠ 代理进程已不存在${NC}"
    fi
    rm -f .agent.pid
else
    echo -e "${YELLOW}⚠ 未找到代理进程 ID 文件${NC}"
fi

# 尝试通过端口查找并停止
if command -v lsof &> /dev/null; then
    AGENT_PID=$(lsof -t -i:17532 2>/dev/null)
    if [ -n "$AGENT_PID" ]; then
        kill $AGENT_PID 2>/dev/null
        echo -e "${GREEN}✓ 通过端口查找停止了代理 (PID: $AGENT_PID)${NC}"
    fi
fi

echo ""
echo "服务已停止"
