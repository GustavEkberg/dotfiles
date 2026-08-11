# Interface throughput. Counters persist between daemon ticks, so there is no
# in-render `sleep 0.5` like tmux-powerline's ifstat_sys used to take.

NET_IFACE="${NET_IFACE:-en0}"

segment_net() {
  local state="$STATE_DIR/net" timestamp counters previous rx tx

  timestamp="$(date +%s)"
  counters="$(netstat -i -b 2>/dev/null | awk -v iface="$NET_IFACE" '$1 == iface { print $7, $10; exit }')"
  [ -n "$counters" ] || return 1
  set -- $counters
  rx="$1"
  tx="$2"

  previous="$(cat "$state" 2>/dev/null || echo)"
  printf '%s %s %s\n' "$timestamp" "$rx" "$tx" >"$state"
  # First tick after a boot or an interface change has nothing to diff against.
  [ -n "$previous" ] || return 1

  printf '%s\n' "$previous" | awk -v now="$timestamp" -v rx="$rx" -v tx="$tx" '
    function rate(bytes_per_second,   kb) {
      kb = bytes_per_second / 1024
      if (kb > 1024) return sprintf("%5.1fM/s", kb / 1024)
      return sprintf("%5.1fK/s", kb)
    }
    { elapsed = now - $1; received = rx - $2; sent = tx - $3 }
    END {
      if (elapsed <= 0 || received < 0 || sent < 0) exit 1
      printf "net\t⎆ ⇊ %s ⇈ %s\n", rate(received / elapsed), rate(sent / elapsed)
    }'
}
