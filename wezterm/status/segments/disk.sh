# Free space on a filesystem. Ported from tmux/segments/disk_free.sh, which the
# old bar re-ran every second for a value that moves hourly.

DISK_FILESYSTEM="${DISK_FILESYSTEM:-/}"

segment_disk() {
  local free
  free="$(df -g "$DISK_FILESYSTEM" 2>/dev/null | awk 'NR==2 {print $4}')"
  [ -n "$free" ] || return 1
  printf 'disk\t♦ %s GB free\n' "$free"
}
