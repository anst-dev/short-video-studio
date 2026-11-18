@echo off
setlocal
set "ROOT=%~dp0"
if exist "%ROOT%lemo-opuscar\.venv\Scripts\python.exe" (
  "%ROOT%lemo-opuscar\.venv\Scripts\python.exe" -X utf8 "%ROOT%video_studio_cli.py" %*
) else (
  python -X utf8 "%ROOT%video_studio_cli.py" %*
)
