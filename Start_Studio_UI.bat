@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
echo Dang khoi dong Lemo-Opuscar Studio Web UI tai http://127.0.0.1:8765 ...
start "" "http://127.0.0.1:8765"
".\lemo-opuscar\.venv\Scripts\python.exe" -X utf8 ".\studio-ui\server.py" --port 8765
pause
