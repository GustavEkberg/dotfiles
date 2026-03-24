---
name: effect-next-redirects
description: Handle Next.js redirects properly in Effect-TS pipelines. Use when implementing page redirects, fixing "RedirectError caught as error message" issues, or working with NextEffect.runPromise and matchEffect together.
---

# Effect-TS Next.js Redirects

## The Problem

When using `NextEffect.redirect()` inside Effect pipelines, the redirect gets caught by `Effect.matchEffect` before `NextEffect.runPromise` can handle it. This causes the redirect to display as an error message instead of actually redirecting.

## The Pattern

### Wrong (redirect shows as error)

```typescript
Effect.matchEffect({
  onFailure: error =>
    Match.value(error._tag).pipe(
      Match.when('UnauthenticatedError', () => NextEffect.redirect('/login')),
      Match.orElse(() =>
        Effect.succeed(
          <div className="p-6">
            <p>Something went wrong.</p>
            <p className="text-destructive">Error: {error.message}</p>
          </div>
        )
      )
    ),
  onSuccess: Effect.succeed
})
```

### Correct (check RedirectError first)

```typescript
import { redirect } from 'next/navigation';

Effect.matchEffect({
  onFailure: error => {
    // Check for RedirectError FIRST before matchEffect catches it
    if (typeof error === 'object' && error !== null && '_tag' in error) {
      const errorWithTag = error as { _tag: string; path?: string };
      if (errorWithTag._tag === 'RedirectError') {
        redirect(errorWithTag.path ?? '/');
      }
    }

    return Match.value((error as { _tag?: string })._tag).pipe(
      Match.when('UnauthenticatedError', () => NextEffect.redirect('/login')),
      Match.orElse(() =>
        Effect.succeed(
          <div className="p-6">
            <p>Something went wrong.</p>
            <p className="text-destructive">Error: {(error as Error).message}</p>
          </div>
        )
      )
    );
  },
  onSuccess: Effect.succeed
})
```

## How It Works

1. `NextEffect.redirect('/path')` creates a failing Effect with `RedirectError`
2. `NextEffect.runPromise()` is supposed to catch `RedirectError` and call Next.js `redirect()`
3. BUT `Effect.matchEffect()` catches ALL errors first and converts them to success values
4. Solution: Check for `RedirectError` in `onFailure` BEFORE calling Match.value()
5. Call `redirect()` directly when `RedirectError` detected

## Type Safety

`RedirectError` is not in the Effect's error type union. Use type guards:

```typescript
function hasTag(error: unknown): error is { _tag: string; path?: string } {
  return typeof error === 'object' && error !== null && '_tag' in error;
}
```

## Common Pages Needing This Fix

- Dashboard pages that redirect to onboarding when no data exists
- Pages with conditional redirects based on user state
- Any page using `NextEffect.redirect()` inside `matchEffect`

## Files to Check

Look for this pattern in:

- `app/(dashboard)/*/page.tsx`
- `app/(dashboard)/layout.tsx`
- Any page using `Effect.matchEffect` with error handling

## Key Rule

**Always check `error._tag === 'RedirectError'` at the start of `onFailure` handlers.**
