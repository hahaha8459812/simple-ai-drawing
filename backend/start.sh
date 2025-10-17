#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Simple AI Drawing Backend Service${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# 检查Python是否安装
if ! command -v python3 &> /dev/null
then
    echo -e "${RED}[错误] 未找到 Python 3，请先安装 Python 3。${NC}"
    exit 1
fi

echo -e "${GREEN}[✓] Python 3 已安装${NC}"
python3 --version
echo

# 检查并创建虚拟环境
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}[!] 未找到虚拟环境，正在创建...${NC}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误] 创建虚拟环境失败。${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}[✓] 虚拟环境已准备就绪${NC}"
echo

# 激活虚拟环境并安装依赖
source venv/bin/activate

echo -e "${YELLOW}[检查] 正在检查并安装依赖库...${NC}"
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 依赖安装失败。${NC}"
    deactivate
    exit 1
fi

echo -e "${GREEN}[✓] 依赖库已安装${NC}"
echo

# 检查backend_service.py文件
if [ ! -f "backend_service.py" ]; then
    echo -e "${RED}[错误] 未找到 backend_service.py 文件。${NC}"
    echo -e "${RED}请确保此脚本与 backend_service.py 在同一目录。${NC}"
    deactivate
    exit 1
fi

echo -e "${GREEN}[✓] 找到 backend_service.py${NC}"
echo

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  启动服务中...${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "服务地址: ${YELLOW}http://localhost:35814${NC}"
echo -e "健康检查: ${YELLOW}http://localhost:35814/health${NC}"
echo
echo -e "提示：按 ${YELLOW}Ctrl+C${NC} 可以停止服务"
echo -e "${GREEN}========================================${NC}"
echo

# 启动服务
python3 backend_service.py

# 如果服务异常退出
echo
echo -e "${RED}========================================${NC}"
echo -e "${RED}服务已停止${NC}"
echo -e "${RED}========================================${NC}"
deactivate