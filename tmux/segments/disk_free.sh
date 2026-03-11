# Print free disk space for a given filesystem

TMUX_POWERLINE_SEG_DISK_FREE_FILESYSTEM_DEFAULT="/"

generate_segmentrc() {
	read -d '' rccontents << EORC
# Filesystem to check free space (default: /)
export TMUX_POWERLINE_SEG_DISK_FREE_FILESYSTEM="${TMUX_POWERLINE_SEG_DISK_FREE_FILESYSTEM_DEFAULT}"
EORC
	echo "$rccontents"
}

run_segment() {
	local fs="${TMUX_POWERLINE_SEG_DISK_FREE_FILESYSTEM:-$TMUX_POWERLINE_SEG_DISK_FREE_FILESYSTEM_DEFAULT}"
	local free
	free=$(df -g "$fs" 2>/dev/null | awk 'NR==2 {print $4}')
	if [ -n "$free" ]; then
		echo "♦ ${free} GB free"
	fi
	return 0
}
