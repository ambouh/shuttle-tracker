# Build Plan

Phase 1 prioritizes a complete rider-facing Sunday Shuttle experience: establish framework-independent TypeScript domain contracts and reusable reference fixtures first, build the approved high-fidelity View 1 against that typed data, include View 2 as a feature-flagged nonfunctional visual preview, make the View 1 rider interactions and route-state transitions functional, then move the same contracts and fixtures into Convex and live tracking/routing integrations. The approved prototypes are the visual source of truth for the initial UI.

## MVP

- [x] 1. **Domain contracts** - define framework-independent TypeScript types and status/provider unions for users and guests, shuttles, journeys, ordered route legs, locations, waitlist entries, route-leg comments, normalized location updates, tracking-provider configuration, routing/ETA/progress snapshots, and internal route-lifecycle events before introducing a database schema
- [x] 2. **Reference fixture data** - create typed, internally consistent development fixtures for the Sunday Service journey, Union Church and Guilford Elementary locations, both ordered route legs, one shuttle and driver, representative guests, waitlists and route-leg comments, every rider-facing route status, normalized location updates, and routing/ETA/progress examples for UI and state-engine development
- [ ] 3. **Tenant-aware journey overview** - establish organization ownership, then build the approved View 1 from organization-scoped Union fixture data
  - [x] 3a. **Organization tenancy foundation** - add organization and organization-detail contracts, unify people under one role-based user contract, scope journeys, shuttles, and locations to an organization, assign the active driver through the shuttle, update the Union fixtures, and test tenant relationships before UI or Convex work
  - [ ] 3b. **Journey overview** - build the approved View 1 Sunday Service experience with the organization avatar, separate Shuttle Tracker label, welcome/service header, reusable route cards, driver identity, status pills, ETA/times, waitlist previews, pickup affordances, and a subtly pulsing green active-trip progress/timer line using organization-scoped typed fixtures
- [ ] 4. **Route detail preview** - build the approved View 2 as a nonfunctional visual preview with rider profile context, current-route details, dark-tinted route map, route/progress treatment, shuttle marker, ETA/distance/location freshness, waitlist summary, and operating-driver card; keep it visible for development and demonstrations behind a feature flag but hidden by default in production
- [ ] 5. **Guest pickup flow** - identify a rider by first and last name, persist the guest locally, and let them join or leave an eligible route-leg waitlist from functional View 1 controls; the View 2 preview remains nonfunctional until Feature 15
- [ ] 6. **Mock journey state engine** - make NOT STARTED, DEPARTING, and IN TRANSIT interactive with typed mock ETA/progress/location data and an internal arrival event that clears the completed waitlist and active comments, resets that leg, and changes the next leg to DEPARTING
- [ ] 7. **Live journey data** - implement the Convex schema from the established domain contracts, add a repeatable development seed path using the reference fixtures, and move journeys, route legs, shuttle state, rider/operator data, waitlists, and route-leg comments into real-time subscriptions across connected clients; store comments separately by route leg and active cycle while preserving the application-facing comments list
- [ ] 8. **Tracking foundation** - introduce a provider-independent shuttle tracking interface and normalized incoming location updates so the application tracks the shuttle rather than depending on any specific device; maintain the shuttle's current tracking snapshot separately from optional retention-limited update history
- [ ] 9. **AirTag tracking provider** - ingest AirTag location updates through the tracking interface without coupling route, state-machine, map, or UI logic to AirTag-specific behavior
- [ ] 10. **Google Maps routing** - replace mock route data with Google Maps calculations for coordinates, route geometry, ETA, total/remaining distance, and route progress while preserving the approved dark map presentation
- [ ] 11. **Automatic route lifecycle** - use configurable departure and arrival geofences to move legs through DEPARTING and IN TRANSIT, trigger arrival internally, clear the completed waitlist and active comments, reset that leg to NOT STARTED, and activate the next leg as DEPARTING
- [ ] 12. **Rider departure alerts** - show in-app departure notifications for waitlisted riders, provide the rider-facing notification surface, and prepare browser/PWA push support without making push permission required
- [ ] 13. **PWA experience** - make the application installable with Union branding, standalone display behavior, icons/manifest configuration, responsive mobile-first layouts, and an appropriate cached app shell
- [ ] 14. **Deployment readiness** - configure Vercel, Convex, Google Maps and tracking environment settings, production PWA behavior, and end-to-end smoke tests for the complete Sunday Shuttle rider flow

## Next Release

- [ ] 15. **Route detail functionality** - enable View 1 route-card navigation to View 2 and connect its map, route metrics, live state, waitlist, pickup, route-leg comments, and driver information to the same functional data sources as the journey overview; allow comments in every route status even when pickup is locked
- [ ] 16. **Driver phone tracking** - allow an authorized driver's phone to become the active shuttle location provider using the same tracking interface as AirTag
- [ ] 17. **Slack identity and alerts** - add Union Slack authentication and Slack-based rider/driver notifications without replacing the application's internal user IDs
- [ ] 18. **Multiple journeys** - add journey selection and support ordered multi-leg journeys such as the Student Night neighborhood pickup loop
- [ ] 19. **Driver operations view** - give drivers an authenticated operational view of current leg status, waitlisted riders, tracking health, and manual recovery controls

## Later

- [ ] 20. **Admin journey management** - allow authorized staff to manage journeys, route legs, locations, ordering, and geofence configuration without code changes
- [ ] 21. **Tracking reliability controls** - add provider health, stale-location handling, fallback tracking selection, and operational diagnostics for live shuttle service
