#!/usr/bin/env bash
set -euo pipefail

# task-loop: Run complete-next-task in loop until PRD complete
# Usage: task-loop <feature> [--max-iterations=N] [--model=MODEL]

MAX_ITERATIONS=50
MODEL="anthropic/claude-opus-4-6"

# Parse args
while [[ $# -gt 0 ]]; do
    case $1 in
        --max-iterations=*)
            MAX_ITERATIONS="${1#*=}"
            shift
            ;;
        --max-iterations)
            MAX_ITERATIONS="$2"
            shift 2
            ;;
        --model=*)
            MODEL="${1#*=}"
            shift
            ;;
        --model)
            MODEL="$2"
            shift 2
            ;;
        -*)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
        *)
            FEATURE="$1"
            shift
            ;;
    esac
done

if [[ -z "${FEATURE:-}" ]]; then
    echo "Usage: task-loop <feature> [--max-iterations=N] [--model=MODEL]"
    echo "  Default model: anthropic/claude-opus-4-5"
    exit 1
fi

COMPLETE_MARKER="<tasks>COMPLETE</tasks>"

fmt_duration() {
    local secs=$1
    printf '%dm%02ds' $((secs / 60)) $((secs % 60))
}

LOOP_START=$SECONDS

for ((i=1; i<=MAX_ITERATIONS; i++)); do
    ITER_START=$SECONDS

    # Count task progress from active prd
    PRD_FILE=".opencode/state/$FEATURE/prd.json"
    total=0; done=0
    if [[ -f "$PRD_FILE" ]]; then
        total=$(grep -c '"passes"' "$PRD_FILE" || true)
        done=$(grep -c '"passes": true' "$PRD_FILE" || true)
    fi
    remaining=$((total - done))
    elapsed=$(fmt_duration $((SECONDS - LOOP_START)))
    echo ""
    echo "──────────────────────────────────────────────"
    echo "  Iteration $i/$MAX_ITERATIONS  |  model: $MODEL"
    echo "  Progress: $done/$total tasks done, $remaining remaining"
    echo "  Total time: $elapsed"
    echo "──────────────────────────────────────────────"
    echo ""

    # Stream output and check for completion marker
    found=false
    while IFS= read -r line; do
        printf '%s\n' "$line"
        [[ "$line" == *"$COMPLETE_MARKER"* ]] && found=true
    done < <(opencode run --model "$MODEL" --command complete-next-task "$FEATURE" 2>&1)

    iter_dur=$(fmt_duration $((SECONDS - ITER_START)))
    echo ""
    echo "  ← Iteration $i took $iter_dur"

    if $found; then
        total_dur=$(fmt_duration $((SECONDS - LOOP_START)))
        echo "PRD complete in $total_dur, exiting."
        exit 0
    fi
done

total_dur=$(fmt_duration $((SECONDS - LOOP_START)))
echo "Max iterations ($MAX_ITERATIONS) reached after $total_dur."
exit 1
