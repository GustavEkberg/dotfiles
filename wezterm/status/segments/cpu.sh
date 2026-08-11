# Real CPU utilisation, emitted as a bare percentage for the renderer to draw.
#
# `top -l 2` needs two samples (~0.85s) because the first is a since-boot
# average. That cost is why this runs on a 5s cadence inside the daemon and
# never on the render path.

segment_cpu() {
  local idle
  idle="$(top -l 2 -n 0 -s 0 2>/dev/null | awk '
    /CPU usage/ { last = $0 }
    END {
      if (!last) exit 1
      split(last, fields, " ")
      for (i = 1; i <= length(fields); i++) {
        if (fields[i] == "idle") { gsub("%", "", fields[i - 1]); print fields[i - 1]; exit }
      }
      exit 1
    }')"
  [ -n "$idle" ] || return 1
  awk -v idle="$idle" 'BEGIN { printf "cpu\t%.1f\n", 100 - idle }'
}
