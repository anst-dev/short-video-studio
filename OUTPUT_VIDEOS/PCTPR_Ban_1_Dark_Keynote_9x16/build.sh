#!/bin/sh
# One-command build: events → video → mix → mastered MP4 (-14 LUFS / ≤ -1 dBTP)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
SIZE=1080x1920
node core/render/events.mjs "$HERE" --size "$SIZE"
node core/render/video.mjs "$HERE" --size "$SIZE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/Scripts/python.exe" -X utf8 "$HERE/mix.py"
"$LIB/.venv/Scripts/python.exe" -X utf8 ../.agents/skills/lemo-voice-audio/scripts/master_mux.py \
  --video "$HERE/out/video.mp4" --audio "$HERE/out/mix.wav" \
  --out "../OUTPUT_VIDEOS/PCTPR_Ban_1_Dark_Keynote_9x16.mp4" --fps 24 --grain 0
