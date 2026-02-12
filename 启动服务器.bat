@echo off
echo 正在启动本地HTTP服务器...
echo.
echo 服务器启动后，请在浏览器中访问：
echo http://localhost:8000
echo.
echo 按 Ctrl+C 可以停止服务器
echo.
python -m http.server 8000
