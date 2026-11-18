# Chạy file này trong cửa sổ PowerShell để tự động chia lịch sử Git thành 6 commit gọn gàng theo từng giai đoạn:
#   powershell -ExecutionPolicy Bypass -File .\commit_by_stages.ps1
# (Cập nhật 2026-11-18: OUTPUT_VIDEOS đã tách thành thư mục riêng từng video — mỗi video là 1 dự án hoàn chỉnh)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== Tách staging index hiện tại để chia theo 6 giai đoạn ===" -ForegroundColor Cyan
git reset

Write-Host "`n[Giai đoạn 1/6] Core Submodules, Skills, Strict QA Workflows & Autoresearch Program..." -ForegroundColor Green
git add .gitignore .gitmodules lemo-opuscar dashi-animationstyle GEMINI.md .agents/ workflows/ autoresearch/
git commit -m "feat(core): init lemo-opuscar & dashi submodules, skills, and strict QA workflows"

Write-Host "`n[Giai đoạn 2/6] Studio Web UI (107 Styles + Demo Videos + Phòng Chiếu per-video)..." -ForegroundColor Green
git add studio-ui/ Start_Studio_UI.bat
git commit -m "feat(studio-ui): add 107-style Web UI Studio with per-video screening room and VTT subtitles"

Write-Host "`n[Giai đoạn 3/6] Mã nguồn các dự án phim đã sản xuất (projects/)..." -ForegroundColor Green
git add projects/
git commit -m "feat(films): add produced film project sources (PCTPR 60s series, Ban 6-7)"

Write-Host "`n[Giai đoạn 4/6] Unified CLI (vstudio), MCP Server & AI Agent Playbook..." -ForegroundColor Green
git add video_studio_cli.py vstudio.bat vstudio mcp_server/ .mcp.json README.md AGENTS.md CLAUDE.md
git commit -m "feat(cli-mcp): add unified vstudio CLI, stdio MCP server, and clone-and-go AI README"

Write-Host "`n[Giai đoạn 5/6] Google Colab Tesla T4 GPU Worker Bridge..." -ForegroundColor Green
git add colab/ commit_by_stages.ps1
git commit -m "feat(colab): add 1-click Google Colab T4 GPU TTS worker notebook and bridge"

Write-Host "`n[Giai đoạn 6/6] OUTPUT_VIDEOS: mỗi video 1 dự án hoàn chỉnh + hoàn tất Ban_8 & Ban_9..." -ForegroundColor Green
git add OUTPUT_VIDEOS/
git commit -m "feat(films): per-video OUTPUT_VIDEOS project folders; finish Ban_8 halftone-dossier & Ban_9 dark-gold (QA gate 100%)"

Write-Host "`n=== HOÀN TẤT 6 COMMITS SẠCH SẼ! ===" -ForegroundColor Yellow
git log --oneline -n 6
