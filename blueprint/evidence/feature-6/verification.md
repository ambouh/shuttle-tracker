# Mock journey state engine verification

Verified 2026-09-26 on branch `feature/mock-journey-state-engine`.

## Automated checks

- `pnpm test`: 161 tests passed in 14 files.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed.

## Browser evidence

Headless Chrome exercised `/` at 320px and 1440px:

- All three statuses update pressed state, timing/progress, and pickup eligibility.
- A recognized guest joins before departure and remains visible through transit.
- Transit closes pickup changes and uses the approved personalized pickup copy.
- Arrival clears only the completed leg, advances the next leg to departing, and
  preserves the untouched leg's riders.
- The guest can join the newly departing leg; its arrival clears that leg and
  wraps the demo to the outbound leg.
- Reload retains guest identity while resetting the canonical demo state.
- Keyboard status activation, arrival announcements, repeated arrival protection,
  and document width checks passed.
- View 2 retains eight disabled controls.
- No browser console errors or runtime exceptions occurred.

Screenshots: `complete-cycle-320.png`, `complete-cycle-1440.png`,
`demo-controls-320.png`, and `demo-controls-1440.png`.

## Manual try

Run `pnpm dev`, open `/`, and use **Not started**, **Departing**,
**In transit**, then **Arrive**. Arrival advances the active route. Reload resets
the mock journey while retaining saved guest details.
