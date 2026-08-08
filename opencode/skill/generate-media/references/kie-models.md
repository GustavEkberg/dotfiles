# kie.ai Verified Model Inventory

**Verified:** 2026-08-08 — every row below was extracted from the live OpenAPI
schema at `https://docs.kie.ai/market/<doc-path>.md`, not inferred.

**Model ID** is the value you put in the `model` field of
`POST https://api.kie.ai/api/v1/jobs/createTask`.
**Doc path** is where that model's OpenAPI spec lives — the two do **not**
follow a shared naming scheme, which is why this table exists.

Still fetch the doc page before calling: this table pins the *identity* of a
model, not its `input` parameters, which change without notice.

Non-market API families (4o Image, Flux Kontext, Veo, Runway, Runway Aleph,
Suno) have dedicated endpoints and are documented in `SKILL.md`, not here.

## Known kie documentation defects

Two pages contradict themselves. Where the `enum`/`default` disagrees with the
prose "Must be `X` for this endpoint", trust the prose and fall back to the
enum on a 422:

| Doc path | `enum`/`default` says | Prose says |
|----------|----------------------|------------|
| `/market/kling/v25-turbo-image-to-video-pro` | `kling/v2-1-master-image-to-video` | `kling/v2-5-turbo-image-to-video-pro` |
| `/market/qwen2/text-to-image` | *(no enum)* | `qwen2/image-edit` |

Two pages declare no `model` property at all — read them in full before use:
`/market/gemini-omni-audio`, `/market/gemini-omni-character`.

One model uses the market `createTask` endpoint but is documented **outside**
`/market/`: `google/gemini-2-5-pro-tts` lives at `/google/gemini-2-5-pro-tts`.

## Market models

| Model ID | Doc path |
|----------|----------|
| `bytedance/seedance-1.5-pro` | `/market/bytedance/seedance-1-5-pro` |
| `bytedance/seedance-2` | `/market/bytedance/seedance-2` |
| `bytedance/seedance-2-5` | `/market/bytedance/seedance-2-5` |
| `bytedance/seedance-2-fast` | `/market/bytedance/seedance-2-fast` |
| `bytedance/seedance-2-mini` | `/market/bytedance/seedance-2-mini` |
| `bytedance/v1-lite-image-to-video` | `/market/bytedance/v1-lite-image-to-video` |
| `bytedance/v1-lite-text-to-video` | `/market/bytedance/v1-lite-text-to-video` |
| `bytedance/v1-pro-fast-image-to-video` | `/market/bytedance/v1-pro-fast-image-to-video` |
| `bytedance/v1-pro-image-to-video` | `/market/bytedance/v1-pro-image-to-video` |
| `bytedance/v1-pro-text-to-video` | `/market/bytedance/v1-pro-text-to-video` |
| `elevenlabs/audio-isolation` | `/market/elevenlabs/audio-isolation` |
| `elevenlabs/text-to-dialogue-v3` | `/market/elevenlabs/text-to-dialogue-v3` |
| `elevenlabs/text-to-speech-multilingual-v2` | `/market/elevenlabs/text-to-speech-multilingual-v2` |
| `elevenlabs/text-to-speech-turbo-2-5` | `/market/elevenlabs/text-to-speech-turbo-2-5` |
| `flux-2/flex-image-to-image` | `/market/flux2/flex-image-to-image` |
| `flux-2/flex-text-to-image` | `/market/flux2/flex-text-to-image` |
| `flux-2/pro-image-to-image` | `/market/flux2/pro-image-to-image` |
| `flux-2/pro-text-to-image` | `/market/flux2/pro-text-to-image` |
| `gemini-omni-video` | `/market/gemini-omni-video` |
| `google/gemini-3-1-flash-tts` | `/market/google/gemini-3-1-flash-tts` |
| `google/imagen4` | `/market/google/imagen4` |
| `google/imagen4-fast` | `/market/google/imagen4-fast` |
| `google/imagen4-ultra` | `/market/google/imagen4-ultra` |
| `google/nano-banana` | `/market/google/nano-banana` |
| `nano-banana-2-lite` | `/market/google/nano-banana-2-lite` |
| `google/nano-banana-edit` | `/market/google/nano-banana-edit` |
| `nano-banana-2` | `/market/google/nanobanana2` |
| `nano-banana-pro` | `/market/google/pro-image-to-image` |
| `gpt-image/1.5-image-to-image` | `/market/gpt-image/1-5-image-to-image` |
| `gpt-image/1.5-text-to-image` | `/market/gpt-image/1-5-text-to-image` |
| `gpt-image-2-image-to-image` | `/market/gpt/gpt-image-2-image-to-image` |
| `gpt-image-2-text-to-image` | `/market/gpt/gpt-image-2-text-to-image` |
| `grok-imagine-video-1-5-preview` | `/market/grok-imagine/1-5-preview` |
| `grok-imagine/extend` | `/market/grok-imagine/extend` |
| `grok-imagine/image-to-image` | `/market/grok-imagine/image-to-image` |
| `grok-imagine/text-to-image` | `/market/grok-imagine/text-to-image` |
| `grok-imagine/text-to-video` | `/market/grok-imagine/text-to-video` |
| `grok-imagine/upscale` | `/market/grok-imagine/upscale` |
| `hailuo/02-image-to-video-pro` | `/market/hailuo/02-image-to-video-pro` |
| `hailuo/02-image-to-video-standard` | `/market/hailuo/02-image-to-video-standard` |
| `hailuo/02-text-to-video-pro` | `/market/hailuo/02-text-to-video-pro` |
| `hailuo/02-text-to-video-standard` | `/market/hailuo/02-text-to-video-standard` |
| `hailuo/2-3-image-to-video-pro` | `/market/hailuo/2-3-image-to-video-pro` |
| `hailuo/2-3-image-to-video-standard` | `/market/hailuo/2-3-image-to-video-standard` |
| `happyhorse-1-1/image-to-video` | `/market/happyhorse-1-1/image-to-video` |
| `happyhorse-1-1/reference-to-video` | `/market/happyhorse-1-1/reference-to-video` |
| `happyhorse-1-1/text-to-video` | `/market/happyhorse-1-1/text-to-video` |
| `happyhorse/image-to-video` | `/market/happyhorse/image-to-video` |
| `happyhorse/reference-to-video` | `/market/happyhorse/reference-to-video` |
| `happyhorse/text-to-video` | `/market/happyhorse/text-to-video` |
| `happyhorse/video-edit` | `/market/happyhorse/video-edit` |
| `ideogram/character` | `/market/ideogram/character` |
| `ideogram/character-edit` | `/market/ideogram/character-edit` |
| `ideogram/character-remix` | `/market/ideogram/character-remix` |
| `ideogram/v3-edit` | `/market/ideogram/v3-edit` |
| `ideogram/v3-remix` | `/market/ideogram/v3-remix` |
| `ideogram/v3-text-to-image` | `/market/ideogram/v3-text-to-image` |
| `infinitalk/from-audio` | `/market/infinitalk/from-audio` |
| `kling/ai-avatar-pro` | `/market/kling/ai-avatar-pro` |
| `kling/ai-avatar-standard` | `/market/kling/ai-avatar-standard` |
| `kling-2.6/image-to-video` | `/market/kling/image-to-video` |
| `kling-3.0/video` | `/market/kling/kling-3-0` |
| `kling-2.6/motion-control` | `/market/kling/motion-control` |
| `kling-3.0/motion-control` | `/market/kling/motion-control-v3` |
| `kling-2.6/text-to-video` | `/market/kling/text-to-video` |
| `kling/v2-1-master-image-to-video` | `/market/kling/v2-1-master-image-to-video` |
| `kling/v2-1-master-text-to-video` | `/market/kling/v2-1-master-text-to-video` |
| `kling/v2-1-pro` | `/market/kling/v2-1-pro` |
| `kling/v2-1-standard` | `/market/kling/v2-1-standard` |
| `kling/v2-1-master-image-to-video` | `/market/kling/v25-turbo-image-to-video-pro` |
| `kling/v2-5-turbo-text-to-video-pro` | `/market/kling/v25-turbo-text-to-video-pro` |
| `kling/v3-turbo-image-to-video` | `/market/kling/v3-turbo-image-to-video` |
| `kling/v3-turbo-text-to-video` | `/market/kling/v3-turbo-text-to-video` |
| `minimax-h3/image-to-video` | `/market/minimax-h3/image-to-video` |
| `minimax-h3/reference-to-video` | `/market/minimax-h3/reference-to-video` |
| `minimax-h3/text-to-video` | `/market/minimax-h3/text-to-video` |
| `omnihuman-1-5` | `/market/omnihuman-1-5` |
| `omnihuman-1-5/human-identification` | `/market/omnihuman-1-5/human-identification` |
| `omnihuman-1-5/subject-detection` | `/market/omnihuman-1-5/subject-detection` |
| `pixverse-v6/extend` | `/market/pixverse/extend` |
| `pixverse-v6/image-to-video` | `/market/pixverse/image-to-video` |
| `pixverse-v6/reference-to-video` | `/market/pixverse/reference-to-video` |
| `pixverse-v6/text-to-video` | `/market/pixverse/text-to-video` |
| `pixverse-v6/transition` | `/market/pixverse/transition` |
| `qwen/image-edit` | `/market/qwen/image-edit` |
| `qwen/image-to-image` | `/market/qwen/image-to-image` |
| `qwen/text-to-image` | `/market/qwen/text-to-image` |
| `qwen2/image-edit` | `/market/qwen2/image-edit` |
| `qwen2/image-edit` | `/market/qwen2/text-to-image` |
| `qwen3/pro-image-to-image` | `/market/qwen3-pro/image-to-image` |
| `qwen3/pro-text-to-image` | `/market/qwen3-pro/text-to-image` |
| `qwen3/image-to-image` | `/market/qwen3/image-to-image` |
| `qwen3/text-to-image` | `/market/qwen3/text-to-image` |
| `recraft/crisp-upscale` | `/market/recraft/crisp-upscale` |
| `recraft/remove-background` | `/market/recraft/remove-background` |
| `seedream/5-lite-image-to-image` | `/market/seedream-5-lite-image-to-image` |
| `seedream/4.5-edit` | `/market/seedream/4-5-edit` |
| `seedream/4.5-text-to-image` | `/market/seedream/4-5-text-to-image` |
| `seedream/5-lite-text-to-image` | `/market/seedream/5-lite-text-to-image` |
| `seedream/5-pro-image-to-image` | `/market/seedream/5-pro-image-to-image` |
| `seedream/5-pro-layer-decomposition` | `/market/seedream/5-pro-layer-decomposition` |
| `seedream/5-pro-text-to-image` | `/market/seedream/5-pro-text-to-image` |
| `bytedance/seedream` | `/market/seedream/seedream` |
| `bytedance/seedream-v4-edit` | `/market/seedream/seedream-v4-edit` |
| `bytedance/seedream-v4-text-to-image` | `/market/seedream/seedream-v4-text-to-image` |
| `topaz/image-upscale` | `/market/topaz/image-upscale` |
| `topaz/video-upscale` | `/market/topaz/video-upscale` |
| `volcengine/video-to-video-lip-sync` | `/market/volcengine/video-to-video-lip-sync` |
| `wan/2-2-a14b-image-to-video-turbo` | `/market/wan/2-2-a14b-image-to-video-turbo` |
| `wan/2-2-a14b-speech-to-video-turbo` | `/market/wan/2-2-a14b-speech-to-video-turbo` |
| `wan/2-2-a14b-text-to-video-turbo` | `/market/wan/2-2-a14b-text-to-video-turbo` |
| `wan/2-2-animate-move` | `/market/wan/2-2-animate-move` |
| `wan/2-2-animate-replace` | `/market/wan/2-2-animate-replace` |
| `wan/2-5-image-to-video` | `/market/wan/2-5-image-to-video` |
| `wan/2-5-text-to-video` | `/market/wan/2-5-text-to-video` |
| `wan/2-6-flash-image-to-video` | `/market/wan/2-6-flash-image-to-video` |
| `wan/2-6-flash-video-to-video` | `/market/wan/2-6-flash-video-to-video` |
| `wan/2-6-image-to-video` | `/market/wan/2-6-image-to-video` |
| `wan/2-6-text-to-video` | `/market/wan/2-6-text-to-video` |
| `wan/2-6-video-to-video` | `/market/wan/2-6-video-to-video` |
| `wan/2-7-image` | `/market/wan/2-7-image` |
| `wan/2-7-image-pro` | `/market/wan/2-7-image-pro` |
| `wan/2-7-image-to-video` | `/market/wan/2-7-image-to-video` |
| `wan/2-7-r2v` | `/market/wan/2-7-r2v` |
| `wan/2-7-text-to-video` | `/market/wan/2-7-text-to-video` |
| `wan/2-7-videoedit` | `/market/wan/2-7-videoedit` |
| `z-image` | `/market/z-image/z-image` |
