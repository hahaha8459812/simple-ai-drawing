@echo off
chcp 65001 >nul
title AI Drawing Backend Service

echo ========================================
echo   Simple AI Drawing Backend Service
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Python，请先安装Python。
    echo.
    echo 下载地址: https://www.python.org/downloads/
    echo 安装时请勾选 "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo [V] Python 已安装
python --version
echo.

REM 检查并创建虚拟环境
if not exist "venv" (
    echo [!] 未找到虚拟环境，正在创建...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 创建虚拟环境失败。
        pause
        exit /b 1
    )
)

echo [V] 虚拟环境已准备就绪
echo.

REM 激活虚拟环境并安装依赖
echo [检查] 正在检查并安装依赖库...
call venv\Scripts\activate.bat
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [错误] 依赖安装失败。
    pause
    exit /b 1
)

echo [V] 依赖库已安装
echo.

REM 检查backend_service.py文件
if not exist "backend_service.py" (
    echo [错误] 未找到 backend_service.py 文件。
    echo 请确保此脚本与 backend_service.py 在同一目录。
    echo.
    pause
    exit /b 1
)

echo [V] 找到 backend_service.py
echo.

echo ========================================
echo   启动服务中...
echo ========================================
echo.
echo 服务地址: http://localhost:5000
echo 健康检查: http://localhost:5000/health
echo.
echo 提示：按 Ctrl+C 可以停止服务
echo ========================================
echo.

REM 启动服务
python backend_service.py

REM 如果服务异常退出
echo.
echo ========================================
echo 服务已停止
echo ========================================
pause