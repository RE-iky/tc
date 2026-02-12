@echo off
chcp 65001 >nul
echo ========================================
echo   BiliText 服务启动脚本
echo ========================================

REM 设置 API 目录
set SCRIPT_DIR=%~dp0
set API_DIR=%SCRIPT_DIR%api

echo.
echo [1/2] 正在检查依赖...
cd /d "%API_DIR%"
if not exist ".venv\Scripts\python.exe" (
    echo    正在创建虚拟环境...
    uv venv .venv
    echo    正在安装依赖...
    uv sync
) else (
    echo    依赖已安装
)

echo.
echo [2/2] 正在启动服务...
echo    服务地址: http://localhost:8000
echo    API文档:  http://localhost:8000/docs
echo.

REM 启动服务
.venv\Scripts\uvicorn.exe bili_text.server.app:app --host 0.0.0.0 --port 8000 --reload

echo.
echo 服务已停止
pause
