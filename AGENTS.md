# AGENTS.md - TravelMate Partner

## Application Identity
- Product name: `TravelMate Partner`
- App type: Partner-facing web application
- Purpose: Enable verified agents/partners to onboard, manage stays and transfers, track earnings, and configure payouts.

## Primary Users
- Partner Agent
- Partner Manager (same organization, elevated partner-side permissions)
- Internal Admin (separate admin app; not implemented in this app except where explicitly needed)

## Scope of This App
The `partner_app` is responsible for:
- Partner authentication and account access
- Partner profile onboarding
- KYC/KYB submission and status tracking
- Stay listing creation and management
- Transfer/taxi listing creation and management
- Pricing and availability management
- Wallet, earnings, payout setup, and payout status tracking
- Partner notifications and basic partner-side reporting

The `partner_app` is **not** responsible for:
- Admin moderation workflows UI (handled by admin app)
- Business API client onboarding UI (handled by admin/developer portal)
- Global platform financial reconciliation dashboards (admin app)

## Naming and Terminology Standards
Use these terms consistently across code, UI text, and docs:
- `TravelMate Partner` (exact product name)
- `Partner` (preferred over Agent in labels; use Agent only where legally required)
- `Stay` (for accommodation inventory)
- `Transfer` (for taxi/ride inventory)
- `Verification` statuses: `pending`, `in_review`, `approved`, `rejected`
- Listing statuses: `draft`, `pending`, `approved`, `live`, `paused`, `rejected`
- Payout statuses: `pending`, `processing`, `paid`, `failed`, `reversed`

## Functional Modules
- `auth`: sign up, sign in, reset password, session handling
- `profile`: business and contact profile management
- `verification`: KYC/KYB documents, submission, status, re-submission
- `stays`: stay CRUD, media, amenities, policies, room/unit details
- `transfers`: transfer CRUD, route, vehicle, operating schedule
- `pricing_availability`: seasonal pricing, calendars, blackout dates
- `wallet_payouts`: balances, payout account setup, payout history, statements
- `notifications`: in-app and email-trigger metadata
- `reports`: partner-side listing and earnings insights

## Data and Security Rules
- Never store plaintext secrets or sensitive financial details in logs.
- Mask payout account details in UI and logs (show only safe partial values).
- Encrypt sensitive personal and payout fields at rest.
- Enforce role-based access on every protected route and API action.
- Record audit events for critical actions:
  - verification submission/update
  - payout account changes
  - listing publish/pause actions

## UX and Product Rules
- Prioritize clear, fast partner workflows with direct next actions.
- Show actionable status messages for verification, listing moderation, and payouts.
- Use clear empty states with direct next actions.
- Keep forms resumable where possible (especially onboarding and listing creation).

## Engineering Standards
- Use TypeScript for new application code.
- Use Next.js App Router (`src/app`) for all route definitions.
- Keep modules feature-based to match the functional modules above.
- Validate incoming data at boundary layers (client and server).
- Favor explicit types for domain entities (`Partner`, `Stay`, `Transfer`, `Payout`).
- All modules must be thoroughly tested.
- Minimum expectation per module:
  - unit tests for business logic and edge cases
  - integration tests for data flows and boundaries
  - critical UI interaction tests where user actions drive state changes
- Require explicit coverage for:
  - status transitions
  - pricing/availability rules
  - payout eligibility rules

## Suggested Folder Structure (Next.js Reference)
- `src/app` (App Router pages, layouts, route groups, route handlers)
- `src/modules/auth`
- `src/modules/profile`
- `src/modules/verification`
- `src/modules/stays`
- `src/modules/transfers`
- `src/modules/pricing-availability`
- `src/modules/wallet-payouts`
- `src/modules/notifications`
- `src/modules/reports`
- `src/components/ui` (shared reusable UI primitives)
- `src/components/common` (cross-feature presentation components)
- `src/lib` (API clients, auth helpers, config, infra utilities)
- `src/shared` (constants, validators, shared helpers)
- `src/types` (shared domain and API contract types)
- `src/styles` (global styles, theme tokens)

## Next.js Architecture Rules
- Keep route concerns in `src/app`; keep business/domain logic in `src/modules`.
- Prefer Server Components by default; use Client Components only when interactivity is required.
- Co-locate feature-specific UI/hooks/services within each module.
- Use shared UI components from `src/components/ui` to maintain design consistency.

## Performance Standards
- Optimize for Core Web Vitals on key partner pages (dashboard, stays, transfers, payouts).
- Target page load performance:
  - LCP under 2.5s on standard broadband for primary pages
  - INP under 200ms for core interactions
  - CLS under 0.1
- Use lazy loading for non-critical media and secondary UI sections.
- Cache stable reference data (e.g., taxonomies, static config) to reduce repeated fetches.
- Minimize client bundle size:
  - avoid unnecessary client components
  - use dynamic imports for heavy optional UI
- Optimize images using Next.js image optimization patterns.
- Monitor API and UI performance regressions in staging before release.

## Delivery Priorities (MVP)
1. Authentication + Partner Profile
2. Verification submission + status tracking
3. Stay and Transfer listing CRUD
4. Pricing and availability management
5. Wallet and payout account setup
6. Payout status and statements

## Definition of Done (Feature Level)
A feature is done when:
- Functional acceptance criteria are met
- Security and validation checks are in place
- Error states and empty states are handled
- Tests are implemented and passing for all affected modules
- Documentation is updated if behavior/status model changes

## Change Management
- Keep status enums synchronized with backend contracts.
- Any change to payout or verification flows must include audit and rollback considerations.
- Update this `AGENTS.md` when scope, naming, or module boundaries change.

## Resource Cleanup Rules
- Always clean up subscriptions, timers, event listeners, observers, and custom browser integrations.
- Clean up side effects properly on unmount and dependency changes.
- Abort stale requests when needed.
- Prevent state updates after unmount.
- Do not leak listeners across route transitions.

## Heavy Work Rules
- Never block the browser main thread.
- Use off-render or server-side processing for large data transformations, expensive parsing, and heavy computations.
- Do not perform expensive transformations inside render paths.
- Prefer server-side shaping before data reaches the UI.
- Use worker-based approaches only when truly necessary.

## Network Rules
- Use a centralized HTTP client abstraction.
- Route external API access through repositories/services.
- Handle errors with typed exceptions or normalized failures.
- Paginate large datasets.
- Reduce payload size where possible.
- Avoid over-fetching.
- Normalize backend responses before they reach UI components.
- Do not let raw backend response shapes leak into presentation code.
- Prefer server-side fetching for initial loads unless interactivity requires client fetching.

## Caching and Data Ownership Rules
- Treat caching as a first-class frontend design decision.
- Define a source of truth for every major data type.
- Do not duplicate server-owned data in client state without clear reason.
- Use explicit caching/revalidation behavior for each fetch path.
- Avoid mixing stale cached data and fresh interactive state without clear invalidation.
- Keep filter/tab/pagination/search state in URL when state is shareable or restorable.
- Derived UI state should be computed, not redundantly stored.

## Data Parsing and Mapping Rules
- Do not perform expensive data shaping inside components.
- Transform raw DTOs into domain-safe objects in the data layer.
- Validate external data before it reaches feature logic.
- Keep parsing, fallback, and mapping logic out of presentation code.

## State Management Rules
- Keep state minimal.
- Prefer server state on the server.
- Use URL state for shareable UI state.
- Use local state for isolated interactions.
- Use shared client state only when multiple client components truly need it.
- Use immutable updates.
- Avoid unnecessary global mutable state.
- Do not mirror server state into client stores without need.
- Do not use global state where route state or local state is sufficient.

## Error Handling Rules
- Use exceptions in the data/integration layer.
- Use typed failures or normalized error objects in the application/domain layer.
- Never expose raw exceptions directly to UI.
- Presentation layer must map failures into clear user-facing messages.
- Every major data-driven surface must support loading, empty, error, and success states.
- Add retry behavior where appropriate.
- Use route-level and component-level error boundaries where appropriate.

## Dependency Management Rules
- Centralize shared service construction.
- Avoid ad hoc instantiation of shared clients across features.
- Inject repositories/services through explicit module boundaries.
- Keep feature dependencies testable and swappable.
- Prefer explicit factories/composition over hidden singleton sprawl.

## UI, Responsive, and Motion Rules
- Follow consistent spacing, typography, hierarchy, and interaction patterns.
- Use reusable components and avoid duplicated UI code.
- UI files must remain focused on presentation and interaction wiring, not domain/business logic.
- Place shared UI primitives in `src/components/ui` or feature-local presentation folders as appropriate.
- Standardize repeated UI patterns: buttons, inputs, cards, tabs, dialogs, drawers, empty states, error states, and tables/lists.
- All screens must support adaptive layouts across mobile, tablet, and desktop.
- Do not build fixed mobile-only layouts.
- Avoid hardcoded screen-size assumptions.
- Use responsive primitives: CSS Grid, Flexbox, container constraints, and breakpoint composition.
- Prefer compact layouts for small widths and expanded layouts for larger widths.
- Ensure text remains usable under zoom and larger text settings.
- Ensure dialogs, sheets, drawers, and popups remain readable at all supported widths.
- Before marking any phase complete, test key flows at mobile, tablet, and desktop widths.
- Before marking any phase complete, confirm no overflow, clipped actions, or inaccessible controls.
- Before marking any phase complete, confirm core flows remain operable across breakpoints.
- Use motion sparingly and intentionally.
- Prefer subtle transitions (fade, slight slide, scale) and keep durations short.
- Avoid continuous or decorative motion unless required.
- Reuse shared motion patterns instead of one-off transitions.
- Animations must never block interaction.
- Respect reduced-motion preferences.
- Verify no visible jank on common flows.

## Button and CTA Color Rules
- Use the TravelMate icon-derived palette for buttons and CTAs only.
- Primary button background: `#033D89`; text: `#FFFFFF`.
- Primary button hover background: `#052068`.
- Secondary/accent CTA background: `#FD6E1D`; text: `#FFFFFF`.
- Secondary/accent CTA hover background: `#EF5C12`.
- Keep button/CTA text contrast accessible (minimum WCAG AA contrast).

## UI File Size and Composition Rules
- Avoid oversized UI files; split components when a file grows beyond a maintainable size.
- As a guideline, refactor UI files approaching ~250-300 lines, especially when multiple concerns are mixed.
- Separate concerns clearly:
  - presentation in component files
  - data fetching and orchestration in module services/hooks
  - validation/parsing/mapping in data or domain layers
- Extract repeated JSX sections into subcomponents instead of long monolithic files.
- Keep page-level files thin by composing feature components.
- Keep component props explicit and typed; avoid passing unstructured objects when stable interfaces are possible.

## Frontend Security Rules
- Never trust client input.
- Validate user input before submission and again at the server boundary where applicable.
- Never expose secrets in client bundles.
- Keep client-safe and server-only environment variables clearly separated.
- Protected pages must not rely on client-only authorization checks.
- Sensitive user actions must go through trusted server-side boundaries.
- Do not store sensitive information in unsafe browser storage without explicit approval and justification.

## File Upload Rules
- When uploads are supported, validate file type, file size, and file count before submission.
- Provide clear upload progress, success, and failure states.
- Avoid routing large files through fragile frontend-only flows when direct upload patterns are available.
- Normalize uploaded file metadata before presentation.
- Keep preview, replacement, and removal flows deterministic and testable.
