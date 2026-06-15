---
description: Generate a sqltoerdiagram.com share URL from SQL schema
---

Generate a sqltoerdiagram.com URL from a SQL schema file or pasted DDL.

## Workflow

1. Load the skill:

   ```
   skill({ name: 'sqltoerdiagram' })
   ```

2. Resolve `$ARGUMENTS` as either a schema file path or pasted SQL.

3. Run the local encoder:

   ```sh
   node ~/.config/opencode/skill/sqltoerdiagram/scripts/sqltoerdiagram-link.mjs <schema.sql> --copy --out /tmp/sqltoerdiagram-url.txt
   ```

   For pasted SQL:

   ```sh
   node ~/.config/opencode/skill/sqltoerdiagram/scripts/sqltoerdiagram-link.mjs --stdin --copy --out /tmp/sqltoerdiagram-url.txt
   ```

   If working inside this dotfiles repo before deployment, use:

   ```sh
   node opencode/skill/sqltoerdiagram/scripts/sqltoerdiagram-link.mjs <schema.sql> --copy --out /tmp/sqltoerdiagram-url.txt
   ```

4. On macOS, reply: `Copied sqltoerdiagram URL to clipboard. Length: <n> chars. Backup: /tmp/sqltoerdiagram-url.txt`. Do not paste the full URL unless asked.

5. On non-macOS, the script prints the URL normally. Return that URL unless the user asked for file-only output.

<user-request>
$ARGUMENTS
</user-request>
