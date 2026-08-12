#!/bin/bash
set -euo pipefail
export PATH="/Users/x/.opencode/bin:/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin:/Users/x/.local/npm-global/bin:$PATH"
OC_DIR="/Users/x/Documents/Default Project/columbus-clone"
OC_SES="ses_00907bce8ffejLYLHJZ5R5TheJ"
WB_BIN="/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy"
CMD="${1:-status}"
shift || true
MSG="${*:-Continue. Do not ask the user.}"
case "$CMD" in
status)
  echo "=== OpenCode ==="; pgrep -lf "opencode run" || echo none
  echo "=== WorkBuddy ==="; "$WB_BIN" ps || true
  echo "=== Codex ==="; pgrep -lf "codex exec" || echo none
  echo "=== Cursor ==="; pgrep -x Cursor >/dev/null && echo app_open || echo app_closed
  echo "Cloud agents via xixi CloudAgent API"
  ;;
opencode)
  nohup opencode run -s "$OC_SES" --auto --dir "$OC_DIR" "$MSG" >>/Users/x/WorkBuddy/codex-handoffs/opencode-remote.log 2>&1 &
  echo "launched opencode pid $!"
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
  echo "usage: ctl.sh status|opencode|workbuddy|codex [msg]"; exit 2
  ;;
esac
