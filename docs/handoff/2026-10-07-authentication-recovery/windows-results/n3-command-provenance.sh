#!/bin/bash
cd /c/bkn-verify
KIT='C:\bkn-verify\unified7-c91fe09-authentication-recovery\windows-kit'
EV='C:\bkn-verify\authentication-recovery-c91fe09-evidence'
ROOT='C:\bkn-verify\authentication-recovery-c91fe09-npm4'
TGZ=$(python -c "import json;print(json.load(open(r'C:/bkn-verify/unified7-c91fe09-authentication-recovery/windows-kit/candidate-manifest.json'))['candidate']['artifact']['path'])")
export PATH="/c/Windows/System32:$PATH"
export NODE_EXTRA_CA_CERTS='C:\bkn-verify\unified7-c91fe09-authentication-recovery\windows-kit\certificates\openbkn-dev-ca.pem'
# 1. cleanup npm host (child-process style via powershell -File, *>&1 outer)
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& powershell.exe -NoProfile -ExecutionPolicy Bypass -File '${KIT//\\/\\}\\windows\\cleanup.ps1' -TestRoot '$ROOT' -CandidateTgz '${KIT//\\/\\}\\$TGZ' *>&1" > "$EV/n3-npm-cleanup.txt" 2>&1
echo "cleanup exit=$?"
# 2. N3 probe
WORK="$ROOT/native-output-probe-$(date +%Y%m%d%H%M%S)"
node "${KIT//\\/\\}\\probe\\prepare-native-probe.mjs" --runtime 'C:\bkn-verify\diag6-tools\node_modules\@deepseek-ai\dsh' --plugin "$ROOT\\dsh-home\\profiles\\web\\node_modules\\@openbkn\\dsh-business-context" --work "$WORK" --files "${KIT//\\/\\}\\candidate\\candidate-files.json" 1> "$EV/probe-prepare-native.json" 2> "$EV/probe-prepare-stderr.txt"
P_EXIT=$?
echo "prepare exit=$P_EXIT work=$WORK"
node "${KIT//\\/\\}\\probe\\tests\\probes\\native-output-runtime.probe.mjs" --runtime 'C:\bkn-verify\diag6-tools\node_modules\@deepseek-ai\dsh' --plugin "$WORK\\package" 1> "$EV/native-output-runtime.jsonl" 2> "$EV/probe-stderr.txt"
R_EXIT=$?
echo "probe exit=$R_EXIT"
echo "$WORK" > "$EV/n3-work-path.txt"
