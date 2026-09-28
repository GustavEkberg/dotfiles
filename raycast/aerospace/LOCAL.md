# Local AeroSpace extension

This is the official [Raycast AeroSpace extension](https://github.com/raycast/extensions/tree/9776c92c8d96f78a2d91cc2b2c573c6041d1e12f/extensions/aerospace) at commit `9776c92c8d96f78a2d91cc2b2c573c6041d1e12f` (2026-08-28), maintained by Ugur Yilmaz (`limonkufu`) and the Raycast extensions project. Upstream license: MIT (`LICENSE`). The imported functional files were verified against Git blob hashes in upstream tree `6e0ed61ff6cbf84edc2dcd3e16185633ee659887`; screenshots and the npm lockfile were omitted. Direct dependency versions are pinned in `package.json`; use the committed pnpm lockfile for installation.

Local change: `trigger-binding` passes the binding before `--mode`, without the `--` separator rejected by AeroSpace 0.20.2. The extension reads local AeroSpace configuration, workspace and window information using the CLI and can open links via Raycast actions. It does not need credentials for these commands.

| Asset                       | Immutable source                                                                                                                             | SHA-256                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `assets/aerospace-icon.png` | https://raw.githubusercontent.com/raycast/extensions/9776c92c8d96f78a2d91cc2b2c573c6041d1e12f/extensions/aerospace/assets/aerospace-icon.png | `29accf73ba1c0c0bbf619322cfe16894199797b2faccd7bae8f1f0f11373d1fa` |
| `assets/menubar-icon.png`   | https://raw.githubusercontent.com/raycast/extensions/9776c92c8d96f78a2d91cc2b2c573c6041d1e12f/extensions/aerospace/assets/menubar-icon.png   | `ddccc441d39a1f4c292cbb4156f11705f87a1a9c66d6a18e52cb502d743a0c5a` |

## Use in Raycast

From this directory, run `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm run build`, then `pnpm run dev` once. Open **Show AeroSpace Shortcuts** in Raycast while the development command is running. Stop it with Ctrl-C; Raycast retains the local extension. In Raycast Settings → Extensions, disable the Store-installed AeroSpace extension to avoid duplicate commands. If the local copy does not appear, sign in to Raycast and use **Import Extension** to select this directory, then run `pnpm run dev` again.

To update the local copy, review a new upstream commit and dependencies before replacing files; reapply the small local fix and tests. Switch back to the Store copy after the upstream fix ships.
