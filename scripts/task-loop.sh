#!/usr/bin/env bash
set -euo pipefail

# task-loop: Run complete-next-task in loop until PRD complete
# Usage: task-loop <feature> [--max-iterations=N] [--model=MODEL]

MAX_ITERATIONS=50
MODEL="openai/gpt-5.6-sol"
VARIANT="high"

while [[ $# -gt 0 ]]; do
    case $1 in
        --max-iterations=*) MAX_ITERATIONS="${1#*=}"; shift ;;
        --max-iterations)   MAX_ITERATIONS="$2"; shift 2 ;;
        --model=*)          MODEL="${1#*=}"; shift ;;
        --model)            MODEL="$2"; shift 2 ;;
        -*)                 echo "Unknown option: $1" >&2; exit 1 ;;
        *)                  FEATURE="$1"; shift ;;
    esac
done

if [[ -z "${FEATURE:-}" ]]; then
    echo "Usage: task-loop <feature> [--max-iterations=N] [--model=MODEL]"
    echo "  Default model: $MODEL"
    exit 1
fi

COMPLETE_MARKER="<tasks>COMPLETE</tasks>"
PRD_FILE=".prd/state/$FEATURE/prd.json"

task_counts() {
    local done=0 total=0
    if [[ -f "$PRD_FILE" ]]; then
        total=$(grep -c '"passes"' "$PRD_FILE" || true)
        done=$(grep -c '"passes": true' "$PRD_FILE" || true)
    fi
    printf '%d/%d' "$done" "$total"
}

for ((i=1; i<=MAX_ITERATIONS; i++)); do
    printf '\n=== Iteration %d/%d  |  tasks: %s done  |  model: %s (%s) ===\n\n' \
        "$i" "$MAX_ITERATIONS" "$(task_counts)" "$MODEL" "$VARIANT"

    found=false
    while IFS= read -r line; do
        printf '%s\n' "$line"
        [[ "$line" == *"$COMPLETE_MARKER"* ]] && found=true
    done < <(opencode run --model "$MODEL" --variant "$VARIANT" --command complete-next-task "$FEATURE" 2>&1)

    if $found; then
        printf '\nPRD complete after %d iterations.\n' "$i"
        exit 0
    fi
done

printf '\nMax iterations (%d) reached.\n' "$MAX_ITERATIONS"
exit 1
