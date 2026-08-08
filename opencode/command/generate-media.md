---
description: Generate images, video, music, or speech via kie.ai
---

Load the `generate-media` skill and use it to fulfil the request.

```
skill({ name: 'generate-media' })
```

## Before generating

- Require `KIE_API_KEY`. If unset, stop and ask the user for it — do not proceed.
- Resolve the model ID and doc path from `skill/generate-media/references/kie-models.md`, then fetch that model's live OpenAPI page before constructing the call.
- Generation costs real credits. State the chosen model and roughly what it will produce, then wait for confirmation before the first `createTask`.
- Default output dir is `./generated-media/`; honour any path the user gives instead.

## After generating

Download every result immediately — kie URLs expire. Report the local file paths, the model used, and the taskId.

<user-request>
$ARGUMENTS
</user-request>
