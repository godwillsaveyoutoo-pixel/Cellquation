#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PORT="${1:-8080}"

LOCAL_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"

echo ""
echo "Cellquation Core v0.7.7a.5 — Living Cell Motion Pass"
echo "------------------------------------------------------------------------"
echo "Computer:   http://127.0.0.1:${PORT}/"
if [ -n "${LOCAL_IP:-}" ]; then
  echo "Smartphone: http://${LOCAL_IP}:${PORT}/"
  echo "Developer:  http://${LOCAL_IP}:${PORT}/?dev=1"
  echo "            (phone + computer must be on the same Wi-Fi)"
fi
echo ""
echo "Foundations:     http://127.0.0.1:${PORT}/foundations.html"
echo "Living Networks: http://127.0.0.1:${PORT}/living.html"
echo "Tutorial:        http://127.0.0.1:${PORT}/tutorial.html?mode=2f"
echo ""
echo "Stop server with Ctrl+C"
echo ""

python3 -m http.server "$PORT" --bind 0.0.0.0
