# Global Agent Configuration

This file provides guidelines for OpenCode when working on my projects. These instructions apply globally across all my repositories.

## Development Philosophy

I build full-stack web applications with a pragmatic, balanced approach. Write clean, maintainable code with reasonable documentation and practical patterns. Prioritize getting features working correctly while maintaining high code quality standards.

## Tech Stack

### Core Technologies
- **Next.js** (App Router) with Vercel deployment
- **TypeScript** (strict mode, no compromises)
- **Tailwind CSS v4** for styling
- **PostgreSQL** for database
- **Drizzle ORM** for database operations
- **Effect** for functional programming, async operations, and error handling
- **Better Auth** for authentication
- **React** with Server Components as the default

### Additional Tools
Use pragmatic, well-maintained libraries when they save time and solve problems effectively. Always consider the maintenance burden and bundle size impact.

## Code Standards

### TypeScript
- **Strictness**: Very strict configuration required
  - No `any` types - use `unknown` and type guards instead
  - Strict null checks enabled
  - Comprehensive type coverage for all functions and variables
  - No explicit `any` escape hatches
  - **Never use type assertions** (`as` or angle bracket syntax) - they bypass type safety
  - Instead of assertions, use type guards, schema validation, or refactor to maintain type safety
- Prefer type inference where TypeScript can reliably infer the type
- Use discriminated unions for complex state management
- Define types close to where they're used unless shared across modules

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile`, `NavigationMenu`)
- **Functions/Variables**: camelCase (e.g., `getUserData`, `isActive`)
- **Types/Interfaces**: PascalCase (e.g., `UserData`, `ApiResponse`)
- **Files**: kebab-case for utilities, PascalCase for components (e.g., `string-utils.ts`, `Button.tsx`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `MAX_RETRY_COUNT`)

### Code Formatting
- Use consistent formatting throughout the project
- Follow project's ESLint/Prettier/Biome configuration if present
- 2-space indentation for TypeScript/JavaScript/TSX
- Single quotes for strings unless interpolation is needed
- Trailing commas in multi-line objects/arrays

## Architecture & Organization

### File Structure
Organize code by type, not by feature:

```
/app                    # Next.js App Router pages and layouts
/components             # React components
  /ui                   # Reusable UI components
  /forms                # Form components
  /layouts              # Layout components
/lib                    # Shared library code
  /db                   # Database client and utilities
  /effects              # Effect-based utilities and services
  /utils                # Pure utility functions
  /validators           # Validation schemas
/hooks                  # Custom React hooks
/types                  # Shared TypeScript types
/api                    # API route handlers (if using API routes)
/schemas                # Drizzle schema definitions
/public                 # Static assets
```

### Component Architecture

#### Server Components First
- **Default to Server Components** for all new components
- Only use Client Components when you need:
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (localStorage, window, etc.)
  - React hooks (useState, useEffect, etc.)
  - Third-party libraries that require client-side execution
- Clearly mark Client Components with `"use client"` directive at the top
- Keep Client Components small and focused
- Pass data from Server Components to Client Components via props

#### Component Patterns
- Keep components focused on a single responsibility
- Extract complex logic into custom hooks or Effect-based services
- Compose larger components from smaller, reusable pieces
- Co-locate component-specific utilities with the component file

### Effect Usage

**Use Effect everywhere for:**
- All async operations (API calls, database queries, file operations)
- Error handling and validation
- Complex business logic with multiple failure modes
- Data transformations that can fail
- Configuration and environment variable management

#### Effect Patterns

**Preferred Approach:**
- Use `Effect.gen` with generator functions for complex, multi-step workflows
- Avoid tacit usage (point-free style) - write `Effect.map((x) => fn(x))` instead of `Effect.map(fn)`
- Use explicit function calls for type safety and better error messages

```typescript
// Prefer: Effect.gen for complex flows
const myOperation = Effect.gen(function* () {
  const config = yield* Config.string("API_KEY")
  const data = yield* fetchData(config)
  const validated = yield* Schema.decode(MySchema)(data)
  return validated
})

// For simple transformations, use pipe with explicit lambdas
const result = pipe(
  Effect.succeed(data),
  Effect.flatMap((x) => validate(x)),
  Effect.map((x) => transform(x)),
  Effect.catchAll((error) => handleError(error))
)

// NOT this (tacit/point-free style - avoid):
const result = pipe(
  Effect.succeed(data),
  Effect.flatMap(validate),  // ❌ Unsafe
  Effect.map(transform),      // ❌ Unsafe
  Effect.catchAll(handleError) // ❌ Unsafe
)
```

**Why Avoid Tacit Usage:**
- Unsafe with functions that have optional parameters or overloads
- Can erase generics and cause type inference issues
- Produces unclear stack traces
- May introduce subtle bugs that are hard to debug

#### Effect Modules to Use
- `Effect` core for computations
- `Schema` for validation and parsing
- `Config` for environment variables
- `Layer` for dependency injection
- `Stream` for data streaming
- `Cause` for error inspection

## Testing Strategy

### Always Write Tests
For every new feature or bug fix, include tests that cover:
- Happy path functionality
- Error cases and edge conditions
- Effect-based error handling paths
- Type safety (if using type-level tests)

### Testing Approach
- Write tests alongside feature implementation
- Use descriptive test names that explain the scenario
- Test behavior, not implementation details
- Mock external dependencies (APIs, databases)
- Use Effect's testing utilities for Effect-based code

### Test Organization
```
/tests
  /unit              # Unit tests for utilities and pure functions
  /integration       # Integration tests for features
  /e2e              # End-to-end tests
```

## Error Handling

### Effect-Based Error Handling

**All errors should be handled through Effect:**
- Define typed error classes for different failure modes
- Use `Effect.fail` for expected errors
- Use `Effect.die` for unexpected/programmer errors
- Create error hierarchies with discriminated unions
- Provide user-friendly error messages

#### Error Definition Pattern
```typescript
// Define error types
class ValidationError {
  readonly _tag = "ValidationError"
  constructor(readonly message: string, readonly field: string) {}
}

class DatabaseError {
  readonly _tag = "DatabaseError"
  constructor(readonly message: string, readonly cause?: unknown) {}
}

type MyError = ValidationError | DatabaseError

// Use in Effect
const operation: Effect.Effect<Result, MyError> = Effect.gen(function* () {
  // implementation
})
```

#### Error Recovery
- Use `Effect.catchTag` for handling specific error types
- Implement retry logic with `Effect.retry` and schedules
- Provide fallback values with `Effect.orElse`
- Log errors appropriately before recovery

## Database & Schema

### Drizzle Patterns
- Define all schemas in `/schemas` directory
- Use descriptive table and column names
- Define relationships explicitly
- Include timestamps (`createdAt`, `updatedAt`) on relevant tables
- Use appropriate column types and constraints

### Effect Integration with Drizzle
- **Use `@effect/sql` and `@effect/sql-drizzle`** for Effect-based database operations
- Leverage Effect's built-in Drizzle integration for proper dependency injection via Layers
- All database operations should return Effect types
- Use Effect's SQL layer for connection management and query execution

```typescript
import { Effect } from "effect"
import * as SqlDrizzle from "@effect/sql-drizzle/Pg"
import * as Sql from "@effect/sql"

// Define database operations with Effect
const getUser = (id: string) =>
  Effect.gen(function* () {
    const sql = yield* Sql.client.PgClient
    const db = yield* SqlDrizzle.makeService(sql, schema)
    
    const user = yield* Effect.tryPromise({
      try: () => db.query.users.findFirst({ where: eq(users.id, id) }),
      catch: (error) => new DatabaseError("Failed to fetch user", error)
    })
    
    return yield* Effect.fromNullable(user, 
      () => new DatabaseError("User not found")
    )
  })
```

### Schema Management
- **Update schema files only** - I will handle migrations manually
- Document breaking schema changes clearly
- All database queries must use Effect's SQL integration
- Provide proper error types for database failures

## UI/UX & Aesthetics

### Design Philosophy
- **Minimal, clean design** inspired by Vercel's aesthetic
- Use whitespace generously, focus on typography and subtle details
- Sleek, modern interfaces with refined polish
- Never use emojis in the UI

### Component Library
- **Always use shadcn/ui** for UI components
- Customize with Tailwind classes when needed
- Don't build custom components when shadcn provides them

### Color & Theme
- **Start with dark mode** by default
- Use subtle grays and muted colors (Vercel-style palette)
- Accent colors used sparingly, maintain high contrast

```typescript
<div className="bg-black text-white">
  <h1 className="text-white/90">Heading</h1>
  <p className="text-white/60">Secondary text</p>
  <div className="border border-white/10">Content</div>
</div>
```

### Transitions & Animation
- **Add subtle animations** to all interactive elements (150-300ms)
- Use Tailwind's transition utilities for opacity, scale, position changes

```typescript
<button className="transition-all duration-200 hover:scale-105 hover:opacity-80">
  Click me
</button>
```

### Responsive Design Strategy
- **Desktop-first by default** - optimize for desktop screens first
- Only implement responsive design when explicitly requested
- When starting a new project, ask: "Should this be responsive?"
- If responsive is needed, use Tailwind's breakpoint prefixes (sm:, md:, lg:)

### Interactive States
- Always define hover, active, and focus states
- Use subtle scale or opacity changes on hover
- Clear focus indicators, obvious disable states
- Use shadcn's skeleton/spinner for loading states

```typescript
<button className="bg-white text-black hover:bg-white/90 active:scale-95 
  focus-visible:ring-2 disabled:opacity-50 transition-all duration-200">
  Button
</button>
```

## Styling Guidelines

### Tailwind CSS
- **Use inline classes only** - no component variants or CSS-in-JS
- Apply Tailwind classes directly in JSX/TSX
- Group related classes logically (layout, spacing, colors, typography)
- Leverage Tailwind's design tokens (colors, spacing, etc.)

## Forms & Validation

### Effect-Based Form Handling
- Use Effect and Schema for form validation
- Define validation schemas with `@effect/schema`
- Handle form submission with Effect
- Provide clear validation error messages
- Show loading states during submission

#### Form Pattern
```typescript
import { Schema } from "@effect/schema"
import { Effect } from "effect"

// Define schema
const LoginSchema = Schema.Struct({
  email: Schema.String.pipe(Schema.email()),
  password: Schema.String.pipe(Schema.minLength(8))
})

// Form submission handler
const handleSubmit = (data: unknown) =>
  Effect.gen(function* () {
    const validated = yield* Schema.decode(LoginSchema)(data)
    const result = yield* loginUser(validated)
    return result
  })
```

### Form UX
- Show validation errors inline
- Disable submit button during submission
- Show success/error feedback after submission
- Support keyboard navigation
- Handle both client and server validation
- Use loading states during submission (shadcn skeleton/spinner)

## Environment & Configuration

### Strict Environment Variable Validation
- **Validate all environment variables at application startup**
- Use Effect's Config module for type-safe environment access
- Fail fast if required variables are missing or invalid
- Document all required environment variables

#### Configuration Pattern
```typescript
import { Config, Effect } from "effect"

// Define configuration
const AppConfig = Effect.all({
  databaseUrl: Config.string("DATABASE_URL"),
  apiKey: Config.string("API_KEY"),
  nodeEnv: Config.string("NODE_ENV").pipe(
    Config.withDefault("development")
  ),
  port: Config.number("PORT").pipe(Config.withDefault(3000))
})

// Use in application
const program = Effect.gen(function* () {
  const config = yield* AppConfig
  // Use config...
})
```

### Environment Files
- `.env.local` for local development secrets
- `.env.example` with all required variables (no values)
- Document each variable's purpose in comments
- Never commit actual secrets to version control

## Git Workflow

### Commit Strategy
- **Feature-complete commits** - one commit per complete feature
- Write clear, descriptive commit messages
- Focus on the "why" rather than the "what"
- Include context for future developers

### Commit Message Format
```
Add user authentication with Effect-based error handling

Implements login/logout functionality using Effect for async operations
and error handling. Includes validation with @effect/schema and proper
error types for different failure modes.
```

### When to Commit
- After completing a full feature with tests
- After fixing a bug and adding regression tests
- After refactoring with confirmed working tests
- When explicitly requested

### Pull Requests
- Create PRs for significant features or changes
- Include comprehensive description of changes
- Link related issues if applicable
- Ensure all tests pass before creating PR

## Documentation Requirements

### Comprehensive Documentation
Write documentation for:
- **All public functions and classes** - JSDoc with @param, @returns, @throws
- **Complex algorithms or business logic** - inline comments explaining "why"
- **Component props** - TypeScript types with JSDoc descriptions
- **API endpoints** - request/response formats, error cases
- **README files** - setup instructions, architecture overview, key concepts

### Documentation Style
- **Be short, concise, and to the point**
- Focus on what and why, not how (code shows how)
- Only include examples when they clarify non-obvious usage
- Avoid verbose explanations - brevity is valued
- Skip examples for straightforward functions

### JSDoc Format
```typescript
/**
 * Fetches user data from the database.
 *
 * @param userId - User's unique identifier
 * @returns Effect that succeeds with User or fails with DatabaseError
 */
export const getUserById = (
  userId: string
): Effect.Effect<User, DatabaseError> => {
  // implementation
}

// Only add examples for complex or non-obvious cases:
/**
 * Applies retry logic with exponential backoff.
 *
 * @param effect - Effect to retry
 * @param maxAttempts - Maximum number of retry attempts
 * @returns Effect with retry logic applied
 *
 * @example
 * ```typescript
 * const resilient = withRetry(fetchData(), 3)
 * ```
 */
export const withRetry = ...
```

### README Updates
- Update README when adding new features
- Document new environment variables
- Include setup instructions for new dependencies
- Keep explanations brief and focused

### Self-Documenting Code
- Use descriptive variable and function names
- Extract magic numbers into named constants
- Keep functions small and focused
- Use TypeScript types to document structure
- Prefer clear code over excessive comments

## Accessibility

### Basic Semantic HTML
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<article>`, etc.)
- Proper heading hierarchy (`<h1>` to `<h6>`)
- Use `<label>` elements for form inputs
- Include `alt` text for images
- Ensure sufficient color contrast

### When to Add ARIA
- Only add ARIA labels, roles, and attributes when explicitly requested
- Let semantic HTML provide accessibility by default
- Don't override native semantics unnecessarily

### Keyboard Navigation
- Ensure focusable elements are keyboard accessible
- Maintain logical tab order
- Provide visual focus indicators

## Data Fetching

### API Routes Approach
- Use Next.js API routes (`/app/api`) for backend logic
- Create RESTful endpoints with proper HTTP methods
- Return typed responses with Effect-based error handling
- Use Server Components for initial data fetching
- Use API routes for mutations and client-side data needs

#### API Route Pattern
```typescript
// app/api/users/[id]/route.ts
import { NextResponse } from "next/server"
import { Effect } from "effect"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const program = Effect.gen(function* () {
    const user = yield* getUserById(params.id)
    return NextResponse.json(user)
  })

  return Effect.runPromise(
    program.pipe(
      Effect.catchAll((error) =>
        Effect.succeed(
          NextResponse.json({ error: error.message }, { status: 500 })
        )
      )
    )
  )
}
```

### Server Components
- Fetch data directly in Server Components
- Use async/await with Effect.runPromise
- Handle errors and show appropriate UI
- Pass data to Client Components via props

## Agent Behavior Guidelines

### How OpenCode Should Work With Me

1. **Task Completion Focus**
   - Complete the requested task fully and correctly first
   - After completion, suggest improvements or optimizations
   - Don't interrupt work to suggest alternatives unless blocking

2. **Communication Style**
   - Be concise and technical
   - Explain complex decisions briefly
   - Show relevant code locations with file:line references
   - No emojis unless explicitly requested

3. **Proactive Actions**
   - Always write tests for new features without asking
   - Update documentation as code changes
   - Validate TypeScript strictness automatically
   - Use Effect for all error handling by default

4. **When to Ask**
   - Before adding new dependencies (unless standard stack)
   - If requirements are ambiguous or conflicting
   - When multiple valid approaches exist with significant tradeoffs
   - Before making breaking changes to public APIs

5. **Code Quality**
   - Enforce TypeScript strict mode rigorously
   - Ensure Effect is used for async operations and errors
   - Verify Server Components are used by default
   - Check that tests are comprehensive
   - Validate inline Tailwind usage

6. **Error Handling**
   - All errors must be handled through Effect
   - No raw try/catch blocks - wrap in Effect.tryPromise
   - Define typed error classes for domain errors
   - Provide user-friendly error messages

7. **Testing**
   - Write tests alongside implementation
   - Cover both success and error cases
   - Test Effect-based error handling paths
   - Ensure tests are deterministic

### Task Management
- Use TodoWrite to plan multi-step features
- Mark todos in_progress when starting
- Complete todos immediately after finishing each step
- Break down complex features into subtasks

### After Task Completion
- Verify all tests pass
- Check TypeScript compilation (strict mode)
- Review for Effect usage in async operations
- Suggest optimizations or improvements
- Identify potential issues or edge cases

## Summary

This configuration establishes a development workflow focused on:
- **Type safety** with strict TypeScript
- **Functional programming** with Effect everywhere
- **Server-first** architecture with Next.js
- **Comprehensive testing** for all features
- **Clear documentation** for maintainability
- **Pragmatic** use of well-maintained libraries

Follow these guidelines consistently across all projects to maintain code quality and development velocity.
