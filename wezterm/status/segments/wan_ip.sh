# Public IP address. The daemon's 900s cadence replaces the old file TTL.

segment_wan_ip() {
  local ip
  ip="$(curl --max-time 2 -s http://whatismyip.akamai.com/)" || return 1
  [ -n "$ip" ] || return 1
  printf 'wan_ip\tⓦ %s\n' "$ip"
}
