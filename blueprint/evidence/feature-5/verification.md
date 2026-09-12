# Guest pickup flow verification

Verified 2026-09-12 on branch `feature/guest-pickup-flow`, checkpoint `2c87754`.
No product code changed during this verification step.

## Automated checks

- `pnpm test`: 130 tests passed in 13 files.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed, including server rendering and TypeScript.

## Browser evidence

Headless Chrome via DevTools Protocol against `http://localhost:3000/`:

- At exact 320px and 1440px, first pickup opens three labeled fields and focuses
  first name. The phone field progressively formats 10 digits as `###-###-####`.
  Empty submission associates errors with all three fields.
- Cancel does not save identity or create membership and restores route focus.
- Simulated storage write failure retains inputs, reports failure, and does not
  join. Restoring storage and pressing Enter saves the normalized phone number,
  joins once, closes the form, and returns focus to the route control.
- A restored guest joins without a form. Repeated synchronous join/remove clicks
  do not duplicate membership or change the other route's waitlist.
- Membership copy changes to "You and 3 others are waiting for pickup"; removal
  restores "Maya and 2 others are waiting for pickup" and the plus icon.
- Reload retains the greeting/identity and resets temporary membership. The demo
  notice explains this behavior.
- Missing/corrupt saved identity produces "Welcome, Rider". Blocked storage reads
  show a retry message and remain usable without browser exceptions.
- IN_TRANSIT has centered "Pickup closed" copy and no pickup button.
- `/routes/route-leg-sunday-outbound` retains all eight disabled preview buttons.
- No document overflow at tested widths. No console errors or runtime exceptions
  during first-request and returning-guest checks.
- Dropdown text was separately measured at 320px, 375px, and 1440px and fits its
  available content width.

Screenshots:

- `guest-form-320.png` and `guest-form-1440.png`: first-request form.
- `guest-joined-320.png` and `guest-joined-1440.png`: successful signup.

## Coverage boundaries

- NOT_STARTED was exercised through the browser. DEPARTING eligibility and
  refusal after a transition to IN_TRANSIT are covered by `lib/guest-pickup.test.ts`;
  no runtime status simulator exists until Feature 6.
- Keyboard focus, Enter submission, native labels, and error associations were
  checked; actual screen-reader speech was not tested.
- Guest identity and pickup requests are still a local demonstration. Convex
  persistence, multi-device operation, phone ownership verification, and sending
  notifications belong to later features.
- Existing Feature 4 production-gate evidence is in `../feature-4/verification.md`;
  its gate code has not changed in Feature 5.

## Manual try

Run `pnpm dev`, open `/` in a fresh browser context, and use the circle-plus on
the return route. Enter first name, last name, and phone, then submit. Check the
personalized waitlist copy and use circle-minus to remove the request. Reload to
confirm the name is remembered while demo membership resets.

Step 6 remains unchecked pending review of this evidence.

## Shared shadcn Dialog revision

The pickup form now uses `components/ui/modal.tsx`, a shared wrapper around the
generated shadcn/ui Dialog. Its underlying portal renders into the document body.
The 320px and 1440px screenshots were refreshed after this change.

The form uses React Hook Form with the official Zod resolver. The exported Zod
schema in `lib/guest-identity.ts` is also the source for stored-identity parsing,
so browser form and persistence validation share the same rules.

- 130 tests, TypeScript, lint, and production build passed after the modal integration.
- Browser: dialog renders outside main, has a labeled title, traps Tab focus,
  dismisses with Escape, close button, and backdrop, and restores trigger focus.
- Browser: validation, cancel, write-failure/retry, Enter submission, and disabled
  View 2 controls passed. No browser errors or mobile overflow were recorded.
- The same modal behavior and viewport-fit checks passed at 1440px.
- Base UI owns page scroll locking; a separate wheel/scroll check was not run.

Step 5a is approved and committed. The refreshed final verification remains pending review.
