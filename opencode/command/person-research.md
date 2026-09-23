---
description: Research one person from public sources and save a cited Markdown packet
---

Research one person, reuse existing sourced context, and find recent personal
updates plus employer updates that explicitly mention them.

Load the `person-research` skill and follow its standalone output mode. Save the
completed packet to `/tmp/person-research-<name-slug>-<YYYY-MM-DD>.md` and return
the path. Ask before proceeding if the person's identity is ambiguous.

<skill>
$FILE{skill/person-research/SKILL.md}
</skill>

<user-request>
$ARGUMENTS
</user-request>
