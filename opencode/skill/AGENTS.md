# AGENTS.md - OpenCode Skills

Local OpenCode skill packages. A skill is loaded from `opencode/skill/<name>/SKILL.md`; support files are not automatically read unless the skill tells the agent to read or run them.

## Structure

```
opencode/skill/
|-- <name>/SKILL.md       # required skill entry
|-- <name>/references/    # optional docs/examples; read selectively
|-- <name>/scripts/       # optional helper scripts
`-- <name>/assets/        # optional images/templates
```

## Where To Look

| Task | Location | Notes |
|------|----------|-------|
| Skill trigger/rules | `<skill>/SKILL.md` | Only file loaded by `skill()` |
| Slash command bridge | `../command/<name>.md` | Optional; coverage is partial |
| Heavy references | `<skill>/references/` | Grep or slice; avoid full reads of huge files |
| Helper scripts | `<skill>/scripts/` | Validate with language-specific checks |
| Figma typings | `figma-use/references/plugin-api-standalone.d.ts` | Generated reference; do not edit |
| OOXML schemas | `pptx/scripts/office/schemas/` | Vendored schemas; do not edit |
| React rules | `react-best-practices/rules/` | Source rules; local generated docs also exist |

## Skill Conventions

- `SKILL.md` starts with YAML frontmatter.
- Required frontmatter: `name`, `description`.
- Prefer lowercase kebab-case names matching the parent directory.
- Put references in the body with relative paths; OpenCode ignores unknown frontmatter fields.
- Tell agents exactly which `references/` or `scripts/` files to use.
- Keep `SKILL.md` concise; move long examples to `references/`.
- Avoid creating `AGENTS.md` as generated content inside a skill; it is active instruction surface.

## Scripts And Outputs

- Treat generated PDFs, PPTX files, `prd.json`, and temp artifacts as outputs; do not commit without explicit intent.
- Scripts should be deterministic and documented by relative path from skill root.
- Preserve zero-dependency or dependency-light constraints unless the skill already has tooling.
- For JS tooling, use `pnpm` over `npm` when package management is introduced.

## Vendor And Reference Rules

- Do not hand-edit vendored/generated references: Figma typings, Mermaid bundle, OOXML schemas, binary images.
- Replace vendor/reference files only from known upstream sources and record provenance.
- Large references should be searched or read by line range, not loaded wholesale.
- Check licenses before copying external skill packs or schemas.

## Known Inconsistencies

- `react-best-practices/SKILL.md` uses name `vercel-react-best-practices`, which does not match its directory.
- Some skills use unknown frontmatter keys like `references` or `disable-model-invocation`; keep critical instructions in the body.
- Some README/build claims reference missing package infrastructure; verify before running commands.
- `pptx/LICENSE.txt` has restrictive provenance risk; do not move/extract casually.

## Anti-Patterns

- Do not deep-crawl or bulk-read references unless the skill explicitly requires it.
- Do not edit schemas, generated typings, minified vendor bundles, or binary assets by hand.
- Do not add slash commands for every skill automatically; add only useful invocation paths.
- Do not hide operational requirements in frontmatter only.
- Do not commit generated deliverables by default.

## Validation

- Markdown-only skill edits: inspect rendered structure and trigger wording.
- JS scripts: `node --check <script>`.
- Python scripts: `python3 -m py_compile <script>`.
- PPTX/OOXML helpers: validate with the skill's own scripts before trusting output.
