# Coding Standards

> Project conventions for the detected Next.js, TypeScript, and Tailwind CSS
> stack. Update this file as architecture decisions are made.
>
> Run `/onboard` after installing the Blueprint. It tunes this file to the real
> project stack, along with `AGENTS.md`, `CLAUDE.md` when present,
> `ai-interaction.md`, `.gitignore`, and README placement. Review the result
> before `/overview`.

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks

## Next.js

- Next.js 16 App Router with React 19
- Build one responsive application that supports browsers and an installable PWA experience
- Server components by default
- Only use `'use client'` when needed (interactivity, hooks, browser APIs)
- Use Server Actions for form submissions and simple mutations
- Use API routes when you need:
  - Webhooks (Clerk, GitHub, etc.)
  - File uploads with progress tracking
  - Long-running operations
  - Specific HTTP status codes or headers
  - Endpoints for future mobile/CLI clients
  - Third-party integrations
- Otherwise, fetch data directly in server components
- Dynamic routes for item/collection pages

## File Organization

- Routes: `app/[route]/page.tsx`
- Shared UI: `components/[feature]/ComponentName.tsx` when introduced
- Server Actions: `actions/[feature].ts` when introduced
- Types: `types/[feature].ts` when introduced
- Libraries and utilities: `lib/[utility].ts` when introduced
- Convex schema and functions: `convex/` when introduced
- Tracking and routing provider adapters: keep provider-specific code behind application-owned interfaces

## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS for all styling
- Tailwind v4: CSS-first config (`@theme` in `globals.css`), no `tailwind.config.js`
- No inline styles
- Design mobile-first, with a calm, familiar, action-oriented rider experience
- Keep the same responsive interface usable in mobile and desktop browsers and in standalone PWA mode

## Data and APIs

- Use Convex as the backend, database, and real-time synchronization layer.
- Keep Journey, Route Leg, User, Shuttle, Location, Waitlist Entry, Location Update, and Tracking Provider Configuration as distinct domain concepts.
- Keep tracking providers behind a normalized location interface so AirTag and future driver GPS implementations remain replaceable.
- Keep Google Maps behind a routing boundary for route geometry, remaining distance, duration, and ETA; do not treat it as the shuttle tracking source.
- Store shared operational state in Convex. Use device-local storage only for recognizing the Phase 1 guest identity.
- Prevent duplicate waitlist entries and validate pickup eligibility at the backend boundary, not only in the UI.
- Validate external provider data and user input at trust boundaries once a validation library is selected.
- Phase 1 has no formal authentication. Keep internal user identity separate from future Slack, Google, driver, or admin authentication providers.

## Error Handling

- Handle expected failures near the relevant data or API boundary.
- Return typed, user-safe errors without exposing secrets or internal implementation details.
- Provide route-level loading and error states where asynchronous UI requires them.
- Treat stale, missing, or low-accuracy tracking updates as expected operational conditions and surface a safe degraded state.
- Do not make core rider flows depend on browser notification permission or availability.

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, server actions. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live next to source files (for example `feature.test.ts`).
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Vitest is configured for TypeScript unit tests. Run the complete suite with
`pnpm test` or use `pnpm test:watch` during development. Tests are an automated
gate for logic-bearing steps under the rules above.

## Package Management and Commands

- Use Node.js 20.9.0 or newer, as required by Next.js 16.
- Use pnpm 10, as declared by `packageManager` and `pnpm-lock.yaml`.
- Do not introduce npm, Yarn, or Bun lockfiles.
- Use the commands documented in `AGENTS.md` as the source of truth.

## Browser Verification

For UI and integration behavior, prefer real browser evidence over reading the
code and assuming it works.

- If Playwright is already installed, or the Commands section of `AGENTS.md`
  declares a Playwright script, use Playwright for browser checks, screenshots,
  console-error checks, and user-flow verification.
- If Playwright is not installed, do not add it silently in the middle of an
  unrelated feature. Use the available dev server, browser screenshots, build
  output, API output, or manual verification evidence instead.
- Add Playwright only when the user asks for it, or when the current spec is
  explicitly about setting up browser automation.
- Browser evidence is especially important for flows that click, type, submit,
  navigate, download files, render complex layouts, or depend on client-side
  state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
