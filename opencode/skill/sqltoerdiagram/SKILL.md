---
name: sqltoerdiagram
description: Generate sqltoerdiagram.com share links from SQL schema files or pasted CREATE TABLE DDL. Use when the user asks for an ER diagram URL, SQL schema diagram, or sqltoerdiagram link.
---

# sqltoerdiagram

Create a `https://sqltoerdiagram.com/#s=...` share URL from a SQL schema without uploading anything.

## What It Does

- Reads SQL DDL from a file or stdin.
- Wraps it in the project shape expected by sqltoerdiagram.
- Compresses it with raw deflate and base64url encodes it.
- Copies or writes a share URL whose URL fragment contains the complete project.

## Important

- This does **not** upload. The schema is embedded in the URL hash.
- Anyone with the URL can read the schema.
- Large schemas can exceed browser/chat URL length limits.
- Do not use for secrets, credentials, or private schemas unless the user accepts link disclosure.
- Clipboard copy is macOS-only (`pbcopy`). On non-macOS, print the URL normally.

## Workflow

1. Resolve the schema source from `$ARGUMENTS`.
2. Locate the script next to this skill. Common paths:

   ```txt
   ~/.config/opencode/skill/sqltoerdiagram/scripts/sqltoerdiagram-link.mjs
   opencode/skill/sqltoerdiagram/scripts/sqltoerdiagram-link.mjs
   ```

3. If the user passed a file path, prefer clipboard output plus a backup file:

   ```sh
   node <script-path> <schema.sql> --copy --out /tmp/sqltoerdiagram-url.txt
   ```

4. If the user pasted schema text, pipe it through stdin:

   ```sh
   node <script-path> --stdin --copy --out /tmp/sqltoerdiagram-url.txt
   ```

5. Optional dialect:

   ```sh
   node <script-path> <schema.sql> --dialect postgres --copy --out /tmp/sqltoerdiagram-url.txt
   ```

6. On macOS, tell the user: `Copied sqltoerdiagram URL to clipboard. Length: <n> chars. Backup: /tmp/sqltoerdiagram-url.txt`.

7. On non-macOS, the script prints the URL normally. Return that URL unless the user asked for a file-only output.

8. If clipboard is not desired, write only to a file:

   ```sh
   node <script-path> <schema.sql> --out /tmp/sqltoerdiagram-url.txt
   ```

## Dialects

Allowed values:

- `postgres`
- `mysql`
- `sqlite`
- `sqlserver`

Default: `postgres`.

## Files

```txt
opencode/skill/sqltoerdiagram/
  SKILL.md
  scripts/
    sqltoerdiagram-link.mjs
```
