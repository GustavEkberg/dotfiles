# Used/total memory from vm_stat page counts. Exact and ~4ms, replacing
# tmux-mem-cpu-load's estimate along with its brew dependency.

segment_mem() {
  local total
  total="$(sysctl -n hw.memsize 2>/dev/null)" || return 1
  [ -n "$total" ] || return 1

  vm_stat 2>/dev/null | awk -v total="$total" '
    /page size of/ {
      for (i = 1; i <= NF; i++) if ($i == "of") { page = $(i + 1); break }
    }
    /^Pages active/                 { active = $3 }
    /^Pages wired down/             { wired = $4 }
    /^Pages occupied by compressor/ { compressed = $5 }
    END {
      if (!page) exit 1
      used = (active + wired + compressed) * page
      printf "mem\t%.0f/%.0fGB\n", used / 1073741824, total / 1073741824
    }'
}
