---
name: gmail-html-email
description: Draft minimally formatted email as HTML and copy it to the macOS clipboard for Gmail. Use when the user asks for a Gmail-ready, copy-pasteable, or formatting-preserving email.
---

# Gmail HTML Email

Produce a restrained email whose lists and emphasis survive pasting into Gmail compose.

## Formatting Standard

- Use one text size throughout. Set it once on `<body>` and let every element inherit it.
- Use paragraphs, single-level `<ol>` or `<ul>` lists, `<li>`, `<strong>`, links, and `<br>` only.
- Use `<strong>` sparingly for short labels or the key phrase in a list item.
- Use a bold paragraph for a section label when needed. Never use `<h1>` through `<h6>`.
- Keep lists short. Use a list only when it makes the email easier to answer or scan.
- Do not use italics, multiple font sizes, colors, backgrounds, tables, cards, buttons, icons, or decorative CSS.
- Keep spacing compact and consistent. Do not nest lists.

Use this body baseline:

```html
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5;">
```

## Workflow

1. Draft the email as semantic HTML, not Markdown. Follow the formatting standard above.
2. Write a complete HTML document to the session scratchpad as `clarification-mail.html`. If no scratchpad directory exists, use `/tmp/clarification-mail.html`; never add the generated email to version control.
3. Put the shared font family, font size, and line height on `<body>`. Do not style individual text elements.
4. Resolve `scripts/copy-rich-email.swift` relative to this skill and run it with the absolute HTML path. For an active OpenCode config:

   ```sh
   swift ~/.config/opencode/skill/gmail-html-email/scripts/copy-rich-email.swift "/absolute/path/to/clarification-mail.html"
   ```

   When working from the dotfiles repository before deployment:

   ```sh
   swift opencode/skill/gmail-html-email/scripts/copy-rich-email.swift "/absolute/path/to/clarification-mail.html"
   ```

5. Tell the user the email is on the clipboard and give the absolute path to `clarification-mail.html`. Do not print the full email again unless asked.

Markdown is not a substitute: Gmail may paste literal asterisks and lose list structure.

## Fallback

If Gmail still mangles list numbering or other structure:

1. Open the HTML file in Chrome:

   ```sh
   open -a "Google Chrome" "/absolute/path/to/clarification-mail.html"
   ```

2. Tell the user to press `Cmd+A`, then `Cmd+C` in the rendered page and paste into Gmail. Copying the rendered page preserves more formatting than converted RTF.

## Verification

Before reporting success:

1. Read `clarification-mail.html` and confirm that formatting uses real HTML elements rather than Markdown syntax.
2. Confirm it follows the formatting standard, has balanced structural tags, and contains the intended recipient-facing content only.
3. After copying, run the helper's clipboard verification:

   ```sh
   swift ~/.config/opencode/skill/gmail-html-email/scripts/copy-rich-email.swift --verify
   ```

4. Treat `Clipboard contains HTML, RTF, and plain text.` as success. If verification fails, rerun the helper or use the Chrome fallback.

Do not claim that Gmail rendering was verified unless the email was actually pasted into Gmail and inspected.

## Safety

- Do not invent recipients, facts, dates, commitments, links, or attachments.
- Ask one concise clarification question when missing information materially changes the message.
- Avoid placing secrets in the email or exposing its contents in command output.
- Clipboard conversion requires macOS, Swift, and `textutil`.
