# ralph.sh
# Usage: ./ralph.sh <iterations>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

# For each iteration, run Claude Code with the following prompt.
# This prompt is basic, we'll expand it later.
for ((i=1; i<=$1; i++)); do
result="$(
  kiro-cli chat --trust-all-tools --no-interactive "$(cat <<PROMPT
Below are three project files. Use them as source of truth.

--- plan-file.json ---
$(cat /Users/acaserop/Documents/Project/open-recorder-tauri/plan/plan-file.json)

--- progress.txt ---
$(cat /Users/acaserop/Documents/Project/open-recorder-tauri/plan/progress.txt)

Instructions:
1) Choose the single highest-priority task to do next (you decide; not necessarily the first).
2) Run/check the tightest feedback loop (types/tests/build). Fix issues.
3) Implement ONLY that one feature end-to-end.
4) Update progress.txt by appending: what you did, commands you ran, and result.
5) Mark the task as complete in plan-file.json by setting '"passes": true' for that item.
6) Make exactly ONE git commit for the feature (clear message).

Rules:
- ONLY WORK ON A SINGLE FEATURE per iteration.
- Do not refactor unrelated code.
- If all tasks are done, output exactly: <promise>COMPLETE</promise>
PROMPT
)"
)"

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete, exiting."
    exit 0
  fi
done