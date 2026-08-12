#!/bin/bash
set -euo pipefail
export PATH="/Users/x/.opencode/bin:/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin:/Users/x/.local/npm-global/bin:$PATH"
OC_DIR="/Users/x/Documents/Default Project/columbus-clone"
# NEW session — do NOT use ses_00907bce8ffejLYLHJZ5R5TheJ (bloated under Default Project)
OC_SES="ses_00878c8edffehqkwY04mvOdCoA"
WB_BIN="/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy"
OC_LOG="/Users/x/WorkBuddy/codex-handoffs/opencode-remote.log"
CMD="${1:-status}"
shift || true
MSG="${*:-Continue. Do not ask the user.}"
case "$CMD" in
status)
  echo "=== OpenCode ==="; pgrep -lf "opencode run" || echo none
  echo "=== WorkBuddy ==="
  # Wrap codebuddy ps with a hard timeout so status never hangs
  python3 - "$WB_BIN" <<'PY' || true
import subprocess, sys
wb = sys.argv[1]
try:
    r = subprocess.run([wb, "ps"], timeout=8, capture_output=True, text=True)
    sys.stdout.write(r.stdout or "")
    sys.stderr.write(r.stderr or "")
    if r.returncode != 0 and not (r.stdout or r.stderr):
        print(f"codebuddy ps exited {r.returncode}")
except subprocess.TimeoutExpired:
    print("WorkBuddy ps timed out after 8s")
except Exception as e:
    print(f"WorkBuddy ps error: {e}")
PY
  echo "=== Codex ==="; pgrep -lf "codex exec" || echo none
  echo "=== Cursor ==="; pgrep -x Cursor >/dev/null && echo app_open || echo app_closed
  echo "Cloud agents via xixi CloudAgent API"
  ;;
opencode)
  # Kill prior run for this session only (do not use --auto; not a real flag)
  pkill -f "opencode run -s ${OC_SES}" >/dev/null 2>&1 || true
  sleep 0.3
  nohup opencode run -s "$OC_SES" --format json --dir "$OC_DIR" --title magicremover-shadcn "$MSG" >>"$OC_LOG" 2>&1 &
  echo "launched opencode pid $! session $OC_SES"
  ;;
opencode-fresh)
  # Kill all opencode run, clear log, start without -s so a new session is created
  pkill -f "opencode run" >/dev/null 2>&1 || true
  sleep 0.3
  : >"$OC_LOG"
  nohup opencode run --format json --dir "$OC_DIR" --title magicremover-shadcn "$MSG" >>"$OC_LOG" 2>&1 &
  echo "launched fresh opencode pid $! (no -s; new session)"
  ;;
workbuddy)
  "$WB_BIN" kill xixi-remote >/dev/null 2>&1 || true
  "$WB_BIN" -p --bg --name xixi-remote --permission-mode bypassPermissions --add-dir "$OC_DIR" "$MSG"
  "$WB_BIN" ps || true
  ;;
codex)
  nohup codex exec -s danger-full-access --skip-git-repo-check -C "$OC_DIR" -o /Users/x/WorkBuddy/codex-handoffs/codex-remote-last.txt "$MSG" >>/Users/x/WorkBuddy/codex-handoffs/codex-remote-run.log 2>&1 &
  echo "launched codex pid $!"
  ;;
*)
  echo "usage: ctl.sh status|opencode|opencode-fresh|workbuddy|codex [msg]"; exit 2
  ;;
esac
