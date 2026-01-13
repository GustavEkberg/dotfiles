# Drizzle + Effect SQL Integration

Integrate Drizzle ORM with Effect using `@effect/sql-drizzle` for automatic Effect returns without manual `Effect.tryPromise` wrapping.

**Install**: `pnpm add @effect/sql @effect/sql-drizzle @effect/sql-pg`

## Setup

**1. SQL Layer** (`lib/db/sql-layer.ts`):

```typescript
import { Config } from "effect"
import { PgClient } from "@effect/sql-pg"

export const PgLive = PgClient.layerConfig({
  url: Config.redacted("DATABASE_URL"),
})
```

**2. Drizzle Layer** (`lib/db/drizzle-layer.ts`):

```typescript
import { Effect, Layer, Context } from "effect"
import * as SqlDrizzle from "@effect/sql-drizzle/Pg"
import { PgLive } from "./sql-layer"
import * as schema from "@/schemas"
import type { PgRemoteDatabase } from "drizzle-orm/pg-proxy"

export class DrizzleService extends Context.Tag("DrizzleService")<
  DrizzleService,
  PgRemoteDatabase<typeof schema>
>() {}

export const DrizzleLive = Layer.effect(
  DrizzleService,
  SqlDrizzle.make({ schema })
).pipe(Layer.provide(PgLive))
```

## Usage in Services

**Before** (manual wrapping with `Effect.tryPromise`):
```typescript
export const getUserById = (id: string) =>
  Effect.tryPromise({
    try: () => db.query.users.findFirst({ where: eq(users.id, id) }),
    catch: (error) => new DatabaseQueryError({ message: "Failed", cause: error }),
  }).pipe(Effect.flatMap((user) => user ? Effect.succeed(user) : Effect.fail(...)))
```

**After** (automatic Effect returns):
```typescript
import { DrizzleService } from "@/lib/db/drizzle-layer"

export const getUserById = (id: string) =>
  Effect.gen(function* () {
    const db = yield* DrizzleService
    const user = yield* db.query.users.findFirst({ where: eq(users.id, id) })
    
    if (!user) {
      return yield* Effect.fail(new RecordNotFoundError({ ... }))
    }
    
    return user
  })
```

## Usage in API Routes

Provide `DrizzleLive` layer when running Effects:

```typescript
import { Effect } from "effect"
import { DrizzleLive } from "@/lib/db/drizzle-layer"
import * as Users from "@/lib/effects/users"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const result = await Effect.runPromise(
    Users.getUserById(params.id).pipe(
      Effect.provide(DrizzleLive),
      Effect.catchAll((error) =>
        error._tag === "RecordNotFoundError"
          ? Effect.succeed(Response.json({ error: "Not found" }, { status: 404 }))
          : Effect.succeed(Response.json({ error: "Server error" }, { status: 500 }))
      )
    )
  )
  return result
}
```

## Key Benefits

- **No manual wrapping**: Drizzle queries return Effects automatically
- **40% less boilerplate**: Eliminates `Effect.tryPromise` everywhere
- **Full type safety**: Schema types flow through automatically
- **Dependency injection**: Services use DrizzleService via layers

## Important Notes

- Use explicit lambda syntax: `Effect.gen(function* () => { ... })`
- Import ordering functions explicitly: `import { desc, asc } from "drizzle-orm"`
- All Drizzle operations return Effects automatically
- SQL errors propagate through Effect chain automatically

## Common Issues

**Type error: "Property 'users' does not exist"**
- Use custom `DrizzleService` tag, not `PgDrizzle.PgDrizzle`
- Import: `import { DrizzleService } from "@/lib/db/drizzle-layer"`

**Type inference problems**
- Always use explicit lambda: `Effect.gen(function* () { ... })`
- Avoid tacit/point-free style

## Migration Checklist

- [ ] Install packages: `@effect/sql @effect/sql-drizzle @effect/sql-pg`
- [ ] Create `sql-layer.ts` and `drizzle-layer.ts`
- [ ] Replace `db` import with `DrizzleService`
- [ ] Remove all `Effect.tryPromise` wrappers
- [ ] Add `const db = yield* DrizzleService` in Effect.gen
- [ ] Import ordering functions explicitly (desc, asc)
- [ ] Update API routes to provide `DrizzleLive` layer
- [ ] Run: `npx tsc --noEmit`
