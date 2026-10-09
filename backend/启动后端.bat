@echo off
REM 启动文本校对后端（供 WPS 加载项 / 网页调用）
REM 监听 0.0.0.0 使同一局域网内其他设备也能连
cd /d %~dp0
echo ============================================
echo  文本校对后端启动中... 端口 8787
echo  本机访问: http://localhost:8787
echo  局域网其他设备请用本机的局域网 IP:8787
echo  （关闭本窗口即停止后端）
echo ============================================
python -m uvicorn main:app --host 0.0.0.0 --port 8787
pause
