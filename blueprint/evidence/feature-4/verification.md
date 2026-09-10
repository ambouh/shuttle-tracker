# Route detail preview verification

Step 7 evidence captured from the production build on 2026-09-10 using
headless Chrome via the Chrome DevTools Protocol.

## Automated checks

- `pnpm test`: 37 tests passed in 10 files.
- `pnpm exec tsc --noEmit`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed, including TypeScript and static page generation.

## Running application

- Production flag unset, `false`, and `invalid`: canonical route returns 404.
- Production flag `true`: canonical route returns 200 and renders the preview.
- Unknown and unsupported route IDs return 404 for every tested flag value.
- Exact 320px and 1440px viewports: document width equals viewport width.
- All eight preview buttons have native disabled semantics and accessible labels.
- John Smith and the Shuttle Driver label render in the footer.
- Both canonical comments render, including John Smith's Driver attribution.
- Normal motion exposes trip-pulse and trip-marker animations; reduced motion
  removes both at each viewport size.
- No browser runtime exceptions, console errors, or error-level browser log entries.

## Visual evidence

- `route-detail-320.png`: mobile composition, including the full driver footer.
- `route-detail-1440.png`: centered desktop composition.
- `verification.json`: flag responses and browser measurements.

Screenshots were inspected against `blueprint/reference/VIEW-2.png`. The profile,
map, sheet, comments, scheduled pickup, and driver hierarchy are present. The map
is the original provider-free illustration; it does not reproduce geographic
tiles. Route names truncate in the compact 320px direction row.

Step 7 is checked off following the user's request to continue the implement
workflow after reviewing the verification packet. No product code changed in
this verification step.
