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
    echo [错误] 未找到Python，请先安装Python
    echo.
    echo 下载地址: https://www.python.org/downloads/
    echo 安装时请勾选 "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo [✓] Python 已安装
python --version
echo.

REM 检查依赖
echo [检查] 正在检查依赖库...
python -c "import flask, flask_cors, requests, PIL" >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] 依赖库未安装，正在安装...
    echo.
    pip install flask flask-cors requests pillow
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败
        echo 请手动执行: pip install flask flask-cors requests pillow
        pause
        exit /b 1
    )
)

echo [✓] 依赖库已安装
echo.

REM 检查backend_service.py文件
if not exist "backend\backend_service.py" (
    echo [错误] 未找到 backend\backend_service.py 文件
    echo 请确保此批处理文件位于插件根目录
    echo.
    pause
    exit /b 1
)

echo [✓] 找到 backend\backend_service.py
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
python backend\backend_service.py

REM 如果服务异常退出
echo.
echo ========================================
echo 服务已停止
echo ========================================
pause