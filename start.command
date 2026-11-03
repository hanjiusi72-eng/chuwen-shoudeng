#!/bin/bash
# 双击启动：在本机开一个静态服务器并用浏览器打开游戏
cd "$(dirname "$0")"
PORT=8686
while lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT+1)); done
echo "除瘟守灯 · 本地地址：http://127.0.0.1:$PORT/  （关闭此窗口即停止）"
(sleep 1; open "http://127.0.0.1:$PORT/index.html") &
python3 -m http.server $PORT --bind 127.0.0.1
