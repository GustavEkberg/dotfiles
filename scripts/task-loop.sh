#!/usr/bin/env bash
set -euo pipefail

# task-loop: Run complete-next-task in loop until PRD complete
# Usage: task-loop <feature> [--max-iterations=N] [--model=MODEL]
#
# Features:
#   - Pinned stats header at top of terminal (tput scroll region)
#   - Live elapsed timer updating every second
#   - Scrollable opencode output below header
#   - Auto-adjusts on terminal resize (SIGWINCH)

MAX_ITERATIONS=50
MODEL="zen/claude-opus-4-6"

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
    echo "  Default model: zen/claude-opus-4-6"
    exit 1
fi

COMPLETE_MARKER="<tasks>COMPLETE</tasks>"
HEADER_LINES=6  # border + 3 content lines + border + blank
TIMER_PID=""

now_epoch() { date +%s; }

fmt_duration() {
    local secs=$1
    printf '%dm%02ds' $((secs / 60)) $((secs % 60))
}

# ── Header rendering ──────────────────────────────────────────

print_header() {
    local iter=$1 max=$2 mdl=$3 dn=$4 tot=$5 rem=$6 elapsed=$7 iter_elapsed=$8
    local bar="──────────────────────────────────────────────"

    # Hide cursor, save position, overwrite in place, restore — no flicker/blink
    tput civis
    tput sc
    tput cup 0 0
    printf '%s' "$bar"; tput el; printf '\n'
    printf '  Iteration %d/%d  |  model: %s' "$iter" "$max" "$mdl"; tput el; printf '\n'
    printf '  Progress: %d/%d tasks done, %d remaining' "$dn" "$tot" "$rem"; tput el; printf '\n'
    printf '  Iter: %s  |  Total: %s' "$iter_elapsed" "$elapsed"; tput el; printf '\n'
    printf '%s' "$bar"; tput el; printf '\n'
    tput rc
    tput cnorm
}

# ── Scroll region management ─────────────────────────────────

setup_scroll_region() {
    local term_lines
    term_lines=$(tput lines)
    tput csr "$HEADER_LINES" $((term_lines - 1))
    tput cup "$HEADER_LINES" 0
}

reset_scroll_region() {
    local term_lines
    term_lines=$(tput lines)
    tput csr 0 $((term_lines - 1))
}

# ── Live timer ────────────────────────────────────────────────
# The subshell uses epoch timestamps (not $SECONDS) to compute
# durations correctly, since $SECONDS resets in child processes.

start_timer() {
    (
        while true; do
            sleep 1
            local now elapsed iter_elapsed
            now=$(now_epoch)
            elapsed=$(fmt_duration $((now - LOOP_EPOCH)))
            iter_elapsed=$(fmt_duration $((now - ITER_EPOCH)))
            print_header "$CUR_ITER" "$MAX_ITERATIONS" "$MODEL" \
                "$CUR_DONE" "$CUR_TOTAL" "$CUR_REMAINING" \
                "$elapsed" "$iter_elapsed"
        done
    ) &
    TIMER_PID=$!
}

stop_timer() {
    if [[ -n "$TIMER_PID" ]] && kill -0 "$TIMER_PID" 2>/dev/null; then
        kill "$TIMER_PID" 2>/dev/null || true
        wait "$TIMER_PID" 2>/dev/null || true
    fi
    TIMER_PID=""
}

# ── Resize handler ────────────────────────────────────────────

handle_winch() {
    setup_scroll_region
    local now elapsed iter_elapsed
    now=$(now_epoch)
    elapsed=$(fmt_duration $((now - LOOP_EPOCH)))
    iter_elapsed=$(fmt_duration $((now - ITER_EPOCH)))
    print_header "$CUR_ITER" "$MAX_ITERATIONS" "$MODEL" \
        "$CUR_DONE" "$CUR_TOTAL" "$CUR_REMAINING" \
        "$elapsed" "$iter_elapsed"
}

trap handle_winch WINCH

# ── Cleanup on exit ───────────────────────────────────────────

print_final_summary() {
    local now elapsed
    now=$(now_epoch)
    elapsed=$(fmt_duration $((now - LOOP_EPOCH)))

    # Re-read task progress for final count
    local tot=0 dn=0 rem=0
    local prd=".prd/state/${FEATURE:-}/prd.json"
    if [[ -f "$prd" ]]; then
        tot=$(grep -c '"passes"' "$prd" || true)
        dn=$(grep -c '"passes": true' "$prd" || true)
    fi
    rem=$((tot - dn))

    local bar="──────────────────────────────────────────────"
    printf '\n%s\n' "$bar"
    printf '  Final  |  model: %s\n' "$MODEL"
    printf '  Progress: %d/%d tasks done, %d remaining\n' "$dn" "$tot" "$rem"
    printf '  Total time: %s\n' "$elapsed"
    printf '%s\n\n' "$bar"
}

cleanup() {
    stop_timer
    reset_scroll_region
    tput cnorm 2>/dev/null || true  # restore cursor visibility
    print_final_summary
}

trap cleanup EXIT

# ── Main loop ─────────────────────────────────────────────────

LOOP_EPOCH=$(now_epoch)

# Export functions and vars needed by timer subshell
export -f fmt_duration print_header now_epoch
export HEADER_LINES MAX_ITERATIONS MODEL LOOP_EPOCH

for ((i=1; i<=MAX_ITERATIONS; i++)); do
    ITER_EPOCH=$(now_epoch)

    # Count task progress from active prd
    PRD_FILE=".prd/state/$FEATURE/prd.json"
    CUR_TOTAL=0; CUR_DONE=0
    if [[ -f "$PRD_FILE" ]]; then
        CUR_TOTAL=$(grep -c '"passes"' "$PRD_FILE" || true)
        CUR_DONE=$(grep -c '"passes": true' "$PRD_FILE" || true)
    fi
    CUR_REMAINING=$((CUR_TOTAL - CUR_DONE))
    CUR_ITER=$i

    # Export state for timer subshell
    export ITER_EPOCH CUR_ITER CUR_TOTAL CUR_DONE CUR_REMAINING

    # Clear screen and draw initial header
    tput clear
    local_now=$(now_epoch)
    elapsed=$(fmt_duration $((local_now - LOOP_EPOCH)))
    iter_elapsed=$(fmt_duration $((local_now - ITER_EPOCH)))
    print_header "$i" "$MAX_ITERATIONS" "$MODEL" \
        "$CUR_DONE" "$CUR_TOTAL" "$CUR_REMAINING" \
        "$elapsed" "$iter_elapsed"

    # Set scroll region below header
    setup_scroll_region

    # Start live timer
    start_timer

    # Stream output and check for completion marker
    found=false
    while IFS= read -r line; do
        printf '%s\n' "$line"
        [[ "$line" == *"$COMPLETE_MARKER"* ]] && found=true
    done < <(opencode run --model "$MODEL" --command complete-next-task "$FEATURE" 2>&1)

    # Stop timer
    stop_timer

    local_now=$(now_epoch)
    iter_dur=$(fmt_duration $((local_now - ITER_EPOCH)))
    elapsed=$(fmt_duration $((local_now - LOOP_EPOCH)))

    # Final header update with accurate duration
    print_header "$i" "$MAX_ITERATIONS" "$MODEL" \
        "$CUR_DONE" "$CUR_TOTAL" "$CUR_REMAINING" \
        "$elapsed" "$iter_dur"

    printf '\n  <- Iteration %d took %s\n' "$i" "$iter_dur"

    if $found; then
        total_dur=$(fmt_duration $((local_now - LOOP_EPOCH)))
        printf '\n  PRD complete in %s, exiting.\n' "$total_dur"
        exit 0
    fi
done

local_now=$(now_epoch)
total_dur=$(fmt_duration $((local_now - LOOP_EPOCH)))
printf '\n  Max iterations (%d) reached after %s.\n' "$MAX_ITERATIONS" "$total_dur"
exit 1
