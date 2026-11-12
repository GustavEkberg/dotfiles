# Corgi

## Normal-install keybindings

`keybindings.json` is the source for the normal install's keyboard overrides.
Apply its `prefix` and `keys` to `~/.local/state/corgi/viewer.json`, merging
`keys` and preserving other preferences. Valid edits reload in open viewers.

With the Corgi preset, prefix means Ctrl+A, then release:

| Keys | Action |
| --- | --- |
| prefix % / S | Split right / down (Shift+S) |
| prefix h / j / k / l | Focus left / down / up / right |
| prefix arrows | Focus in that direction |
| prefix c / n / p | New / next / previous tab |
| prefix 0–5 | Workspace 1–6 in sidebar order, not tabs |
| prefix w / { / } | Choose / previous / next workspace |
| prefix z / r | Zoom / resize mode |
| prefix b / ? / i | Sidebar / shortcuts / setup |

The preset's existing `%`, `v`, `-`, and `"` splits remain available.
Herdr's custom Shift+L layout and Shift+J/K workspace reorder scripts are not
ported; their conflicting Corgi pane-swap shortcuts are disabled. Shift+F1–F5
agent jumps and prefix+9 (final workspace) are not mapped.
