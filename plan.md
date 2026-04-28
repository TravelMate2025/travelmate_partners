# TravelMate Partner Implementation Plan

## 1. Partner App Features (Copied Baseline)

### 1.1 Authentication and Account Access
- Partner sign up (email/password and phone)
- Partner login/logout
- Forgot password and password reset
- Email verification and optional phone OTP verification
- Session management across devices
- Basic account security (password policy, suspicious login alerts)

### 1.2 Partner Profile and Onboarding
- Partner profile creation (individual/agency/business)
- Business details (legal name, trade name, registration number)
- Contact details (primary contact, support contact)
- Service regions and operating cities setup
- Preferred payout and billing details
- Onboarding checklist with progress tracker

### 1.3 Partner Verification (KYC/KYB)
- Upload identity and business verification documents
- Upload proof of address and operating permits/licenses
- Submit verification application
- Verification status tracking (pending, in review, approved, rejected)
- Rejection reason visibility and re-submission flow
- Verification notifications via email/in-app

### 1.4 Partner Dashboard
- Summary cards (active listings, pending approvals, total views)
- Alerts (verification issues, listing moderation feedback)
- Quick actions (add stay, add transfer, update availability)
- Recent activity feed

### 1.5 Stay Listing Management
- Create stay listing
- Edit stay listing details
- Save as draft before submitting
- Delete/archive listing
- Listing status management (draft, pending, approved, live, paused, paused_by_admin, rejected, archived)
  - `paused_by_admin`: platform suspension set by admin emergency unpublish; partner has no self-service actions; UI shows "Suspended by platform" label and moderation reason; Archive button suppressed
- Multi-image upload and gallery ordering
- Property information management:
  - Property type (hotel, apartment, villa, etc.)
  - Name, description, address, geo-coordinates
  - Amenities and house rules
  - Check-in/check-out policy
  - Cancellation policy
- Room/unit management (if enabled):
  - Room types and occupancy
  - Bed configuration
  - Base rates

### 1.6 Stay Pricing and Availability
- Base pricing setup
- Seasonal pricing and date-range overrides
- Weekday/weekend pricing
- Minimum/maximum stay rules
- Availability calendar management
- Blackout date setup
- Bulk update for rates and availability

### 1.7 Transfer/Taxi Listing Management
- Create transfer listing
- Edit transfer listing
- Save as draft and submit for review
- Delete/archive transfer listing
- Status management (draft, pending, approved, live, paused, rejected)
- Route setup (pickup/dropoff points)
- Transfer type setup (one-way, return, hourly, airport transfer)
- Vehicle details:
  - Vehicle class/type
  - Passenger/luggage capacity
  - Features (AC, Wi-Fi, child seat option)
- Service coverage area mapping

### 1.8 Transfer Pricing and Scheduling
- Fare configuration by route
- Distance/time-based pricing rules
- Peak-hour or night surcharge setup
- Currency and tax configuration
- Operating hours and schedule windows
- Date-based availability and blackout days

### 1.9 Media and Document Management
- Upload listing images
- Upload supporting documents/licenses
- Replace/remove media assets
- File validation (size/type limits)

### 1.10 API-Ready Data Quality Tools (Partner Side)
- Required field validation before submit
- Data completeness score for listings
- Duplicate listing warnings
- Moderation feedback and correction workflow

### 1.11 Notifications and Communication
- In-app notifications
- Email notifications for moderation and verification updates
- Notifications for listing approvals/rejections
- Reminder notifications for incomplete listings

### 1.12 Reports and Insights (Partner Side)
- Listing performance basics (views, impressions, search appearances)
- Listing health indicators (missing fields, paused listings)
- Export basic listing data (CSV)

### 1.13 Partner Support and Settings
- Help center/FAQ access
- Submit support ticket/contact support
- Profile settings and preferences
- Password change and account security settings
- Account deactivation request

### 1.14 Partner Wallet, Earnings, and Booking Settlement
- Earnings wallet/ledger view
- View pending balance, available balance, and paid balance
- Settlement account (payout method) setup (bank account or mobile money where supported)
- Booking-completion settlement (net payout released when booking is completed)
- Automatic commission/fee deduction before settlement
- Settlement status tracking (pending_completion, processing, paid, failed, reversed)
- Reserve/hold visibility for risk-managed settlements where applicable
- Failed settlement retry and correction flow
- Download settlement statements and earnings reports
- Commission/fee deductions breakdown per settled booking
- Tax/withholding summary visibility (where applicable)
- Cancellation/refund impact view on wallet balance and settlement history

### 1.15 Settlement Account (Payout Method) Details and Verification
- Settlement account details form for bank or mobile money accounts
- Required settlement account fields by country (account holder name, bank name, account number/IBAN, routing/SWIFT where required)
- Country and currency selection for settlement accounts
- Account ownership verification status (pending, verified, rejected)
- OTP confirmation for settlement account submission/updates
- Name match check between KYC profile and settlement account holder name
- Re-verification required when settlement account details are changed
- Masked account display in UI (show only safe partial data, e.g., last 4 digits)
- Ability to set one default settlement account method
- Validation messages for invalid or unsupported account formats
- Submission history for settlement account updates
- Alert notifications when settlement account details are updated

### 1.16 Listing Suspension Appeal
- "Submit Appeal" action available on a listing detail page when the listing is in `paused_by_admin` state and no active appeal already exists
- Appeal form: free-text message field explaining why the listing should be reinstated; submit triggers `POST /stays/{stayId}/appeal` or `POST /transfers/{transferId}/appeal`
- Appeal status display: once submitted, the listing detail view shows an appeal status badge — `pending` ("Appeal submitted — awaiting review") or `under_review` ("Appeal under review") — instead of the submit button
- Resolution outcome:
  - `reinstated`: listing transitions to `approved` and the standard status display takes over; no explicit reinstatement banner needed
  - `dismissed`: amber notice displays "Appeal dismissed" with the admin's resolution note if provided; partner is directed to contact support for further questions
- Duplicate prevention: the "Submit Appeal" button is hidden when an active appeal (`pending` or `under_review`) already exists for the listing
- Partner is notified of appeal resolution via in-app notification

## 2. Feature Flows (Partner App)

### 2.1 Authentication and Account Access Flow
- User opens sign up.
- User submits email, phone, and password.
- System validates credentials and creates account.
- System sends verification email and optional OTP.
- User verifies account and signs in.
- System creates session and routes to onboarding.

### 2.2 Partner Profile and Onboarding Flow
- Verified user starts onboarding wizard.
- User completes business identity and contact fields.
- User selects service regions and settlement preferences.
- System saves progress and updates checklist.
- User completes required steps and submits profile.

### 2.3 Partner Verification (KYC/KYB) Flow
- User uploads required identity/business documents.
- System validates file type, size, and completeness.
- User submits verification package.
- System marks status as pending/in_review.
- User receives approval or rejection with reason.
- On rejection, user edits and re-submits.

### 2.4 Partner Dashboard Flow
- Signed-in partner lands on dashboard.
- System loads summary metrics and alert feed.
- User clicks quick actions to add stays/transfers or update availability.
- System records recent actions and refreshes widgets.

### 2.5 Stay Listing Management Flow
- User creates stay listing and enters core details.
- User uploads images and optional room/unit data.
- User saves draft or submits for review.
- System tracks listing state transitions.
- User edits, pauses, or archives listing as needed.

### 2.6 Stay Pricing and Availability Flow
- User opens stay pricing/calendar module.
- User sets base rate, seasonal overrides, and rules.
- User configures availability and blackout dates.
- System validates conflicts and saves updates.
- Listing price/availability becomes available to downstream consumers.

### 2.7 Transfer/Taxi Listing Management Flow
- User creates transfer listing and route details.
- User defines transfer type and vehicle capacities.
- User saves draft or submits for review.
- System tracks status and moderation feedback.
- User updates, pauses, or archives transfer listing.

### 2.8 Transfer Pricing and Scheduling Flow
- User defines transfer fare rules and surcharges.
- User configures schedule windows and blackout dates.
- System validates route, time, and pricing constraints.
- System persists final schedule and price model.

### 2.9 Media and Document Management Flow
- User uploads image/document assets from listing/editor screens.
- System validates files and stores metadata.
- User reorders, replaces, or removes files.
- System updates linked listing/verification records.

### 2.10 Data Quality Tools Flow
- User attempts to submit listing.
- System runs required fields and quality checks.
- System computes completeness score and duplicate warnings.
- User resolves issues and re-submits.
- System forwards clean listing to review.

### 2.11 Notifications and Communication Flow
- System emits events for verification, moderation, settlement/refund updates, and reminders.
- Notification service creates in-app message and optional email.
- User views and acknowledges notifications.
- Notification status updates to read/unread.

### 2.12 Reports and Insights Flow
- User opens reports screen and selects time range.
- System aggregates listing performance metrics.
- User reviews health indicators and can export CSV.

### 2.13 Partner Support and Settings Flow
- User opens settings/support.
- User updates profile/security preferences or submits support request.
- System validates and saves updates.
- System confirms result and logs audit trail.

### 2.14 Wallet, Earnings, and Booking Settlement Flow
- Booking completion is recorded in local/mock app state for settlement processing.
- System computes commission/fees and net partner amount per completed booking.
- System advances settlement state in local/mock data using configured settlement account metadata.
- User views pending, available, and paid balances with booking-level breakdown.
- System updates settlement status until completion/failure.
- If traveler cancels after settlement, admin notifies partner to issue refund and tracks resolution.
- User downloads settlement statement and deduction breakdown.

### 2.15 Settlement Account (Payout Method) Details and Verification Flow
- User adds bank/mobile settlement account details.
- System validates account format by country.
- System runs OTP and ownership/name verification through local/mock verification adapters.
- System marks settlement account method status.
- On updates, system triggers re-verification and alerts.
- Django-backed verification integration is deferred to the backend phase.

### 2.16 Listing Suspension Appeal Flow
- Partner opens a listing detail page for a listing in `paused_by_admin` state.
- Partner sees "Suspended by platform" notice with the moderation feedback reason.
- If no active appeal exists, partner sees "Submit Appeal" button.
- Partner opens appeal form, writes a message, and submits.
- System validates listing is still `paused_by_admin`, partner owns the listing, and no duplicate active appeal exists.
- On success, partner sees the appeal status badge replacing the submit button.
- Admin reviews the appeal and resolves (reinstate or dismiss).
- If reinstated: listing transitions to `approved`; partner receives notification and listing status display updates.
- If dismissed: partner receives notification; listing remains `paused_by_admin`; dismissal notice with resolution note shown on listing detail.
- Backend API wiring (`/stays/{stayId}/appeal`, `/transfers/{transferId}/appeal`) is deferred to slice 62b in the backend phase.

## Project Status

- Flow 2.1 Authentication and Account Access: `Completed`
- Flow 2.2 Partner Profile and Onboarding: `Completed`
- Flow 2.3 Partner Verification (KYC/KYB): `Completed`
- Flow 2.4 Partner Dashboard: `Completed`
- Flow 2.5 Stay Listing Management: `Completed`
- Flow 2.6 Stay Pricing and Availability: `Completed`
- Flow 2.7 Transfer/Taxi Listing Management: `Completed`
- Flow 2.8 Transfer Pricing and Scheduling: `Completed`
- Flow 2.9 Media and Document Management: `Completed`
- Flow 2.10 Data Quality Tools: `Completed`
- Flow 2.11 Notifications and Communication: `Completed`
- Flow 2.12 Reports and Insights: `Completed`
- Flow 2.13 Partner Support and Settings: `Completed`
- Flow 2.14 Wallet, Earnings, and Booking Settlement: `Completed and strict-alignment confirmed (frontend/module-first)`
- Flow 2.15 Settlement Account (Payout Method) Details and Verification: `Completed (frontend/module-first)`
- Flow 2.16 Listing Suspension Appeal: `Not started` (backend API slice 62b required; frontend UI deferred to backend phase)

Latest completion notes:
- Auth flow includes signup OTP, email verification, login/logout, password reset, session management, and logout-all-devices.
- Onboarding flow includes resumable 3-step wizard, checklist/progress tracking, and dashboard gating until onboarding completion.
- Stay listing management includes create/edit draft stays, image upload/order/remove, room add/remove, submit/review/live/paused/archive state transitions, and moderation feedback loop (mock lifecycle).
- Thorough testing gate for implemented flows (2.1 to 2.5) is active with passing unit, integration, and E2E suites.
- Strict Flow 2.5 validation coverage is added via dedicated integration test (`flow-2.5-stays-strict.integration.test.ts`) aligned to each flow bullet in section 2.5.
- Dashboard quick action behavior is aligned so `Add Stay` routes into stay creation (`/stays/new`) rather than only recording metric deltas.
- Visual design polish pass is applied across completed flows to improve typography, hierarchy, surface depth, and interaction affordances.
- Partner app shell now includes sectioned navigation for broader plan modules with scaffold pages for future flows, so IA and route structure remain stable as implementation continues beyond 2.5.
- Flow 2.6 page is implemented with currency + base/weekday/weekend pricing, min/max stay rules, seasonal override date-range conflict validation, blackout date validation, and persisted module state (mock + real API adapters).
- Flow 2.7 transfer module is implemented with create/edit flows, route and vehicle metadata, submission and moderation lifecycle transitions, and archive controls (mock + real API adapters).
- Phase 3 locality hardening is added so stay and transfer drafts use supported country/city pickers from the location catalog with searchable city lookup, while street-level pickup/dropoff and property address remain free text.
- Transfer draft/detail flows now use standardized vehicle class categories instead of free-text vehicle type entry.
- Flow 2.8 transfer pricing and scheduling is implemented with fare model fields, schedule windows, blackout dates, overlap validation by day/time, and persisted module state (mock + real API adapters).
- Flow 2.9 media/document management is implemented across stay, transfer, and verification editors with shared file validation rules (type/size/count), metadata persistence, replace/remove actions, and image reordering for listing media.
- Transfer listing detail editor now includes direct image upload, replace, reorder, and remove controls aligned with stay image lifecycle behavior.
- Strict Flow 2.9 validation coverage is added via dedicated integration test (`flow-2.9-media-docs-strict.integration.test.ts`) aligned to each flow bullet in section 2.9.
- Flow 2.10 data quality tooling is implemented with listing completeness scoring, required-field submission gates, duplicate listing warnings, and correction prompts on rejected listings for both stays and transfers.
- Strict Flow 2.10 validation coverage is added via dedicated integration test (`flow-2.10-data-quality-strict.integration.test.ts`) aligned to each flow bullet in section 2.10.
- AGENTS alignment hardening added middleware-backed protected route checks, verification terminology alignment (`in_review` lifecycle stage), and audit event recording support for critical verification/listing actions.
- Transfer detail flow hardened for legacy data shapes so missing array fields (`features`, `images`) no longer crash render and quality checks.
- Flow 2.11 notifications is now implemented with event emission scaffolding, in-app notification center UI, read/unread toggles, acknowledge action, optional email dispatch metadata, and mark-all-read controls.
- Strict Flow 2.11 validation coverage is added via dedicated integration test (`flow-2.11-notifications-strict.integration.test.ts`) aligned to each flow bullet in section 2.11.
- Flow 2.11 event emission is now wired to system workflows (verification submission/status change, moderation outcomes, settlement/refund status updates, and incomplete listing submission reminders) rather than simulator-only triggers.
- Navigation status is updated so Notifications is marked live in the app shell (no "Soon" tag).
- Flow 2.12 reports is now implemented with date-range selection, aggregated performance metrics, listing health indicators, and CSV export with selected range context.
- Strict Flow 2.12 validation coverage is added via dedicated integration test (`flow-2.12-reports-strict.integration.test.ts`) aligned to each flow bullet in section 2.12.
- Navigation status is updated so Reports is marked live in the app shell (no "Soon" tag).
- Flow 2.13 support and settings is now implemented with partner preference updates (profile/security), support ticket submission and status list, account deactivation request flow, and audit trail visibility in module UI.
- Strict Flow 2.13 validation coverage is added via dedicated integration test (`flow-2.13-support-settings-strict.integration.test.ts`) aligned to each flow bullet in section 2.13.
- Navigation status is updated so Support & Settings is marked live in the app shell (no "Soon" tag).
- Flow 2.14 is implemented with booking-completion settlement lifecycle (`pending_completion` -> `processing` -> `paid`) in local/mock adapters.
- Flow 2.14 includes cancellation refund tracking with admin-notified partner workflow states and wallet impact updates.
- Flow 2.14 strict validation coverage (`flow-2.14-wallet-payouts-strict.integration.test.ts`) is aligned to settlement and cancellation-refund behaviors.
- Flow 2.14 dedicated E2E coverage is now added and passing (`e2e/flow-2.14-wallet-settlement.spec.ts`) for booking completion, refund tracking, and statement download.
- UI/E2E alignment for Flow 2.14 and dependent flows is updated to current settlement terminology and toast semantics.
- Navigation status for Wallet & Settlements is now live in the app shell.
- Flow 2.14 implementation scope for this phase is frontend/module-first with mock adapters; Django APIs will be introduced in a later backend phase.
- Flow 2.14 strict alignment is confirmed against the feature flow in section 2.14 for this phase: booking completion is recorded in local/mock state, deductions and net payout are computed, settlement status advances in local/mock data, balances and booking-level breakdowns are visible, cancellation refund tracking is present, and downloadable settlement statements are supported.
- Settlement account details capture, country/account-format validation, OTP confirmation, ownership/name checks, and re-verification remain intentionally deferred to Flow 2.15 and are not part of the confirmed Flow 2.14 scope.
- Flow 2.15 is now implemented with bank account and mobile money payout method support, country/currency-aware validation, masked sensitive field display, default payout method selection, OTP verification, ownership/name-match checks against onboarding profile data, re-verification after account changes, and payout method history tracking.
- Flow 2.15 strict validation coverage is added via dedicated integration test (`flow-2.15-settlement-accounts-strict.integration.test.ts`) aligned to the feature flow in section 2.15.
- Flow 2.15 dedicated E2E coverage is now added and passing (`e2e/flow-2.15-settlement-account.spec.ts`) for payout method submission, OTP verification, account updates, and re-verification.
- Flow 2.15 implementation scope for this phase remains frontend/module-first with local/mock adapters; Django-backed verification and real payout rails will be wired in the backend phase.

## 3. Flow-Based Implementation Plan

Alignment rule for this section:
- Each `Flow 2.x` implementation item below maps directly to the corresponding `Feature Flow 2.x` above.
- Current phase implementation is frontend/module-first with local/mock adapters; Django API integration is deferred to a later backend phase.

### Flow 2.1: Authentication and Account Access
- Implementation steps:
  - Build sign-up/sign-in/reset UI screens and route actions with local/mock auth adapters.
  - Add email verification and optional OTP verification.
  - Implement secure session/token handling and logout-all-devices.
  - Enforce password policy and suspicious-login checks.
- Required tests:
  - Unit: credential validation, token/session lifecycle, password rules.
  - Integration: sign-up -> verify -> login -> logout.
  - E2E: happy path and invalid credentials/expired token paths.
- Success criteria:
  - Auth flows complete without blockers in UAT.
  - No critical auth/security defects.
  - All auth tests pass in CI.
  - Thorough test gate passed: unit + integration + E2E coverage is implemented and green before sign-off.

### Flow 2.2: Partner Profile and Onboarding
- Implementation steps:
  - Implement onboarding wizard with resumable step persistence.
  - Build partner business/contact/service-region forms.
  - Add onboarding checklist computation and completion states.
- Required tests:
  - Unit: form validators and checklist logic.
  - Integration: onboarding progress save/restore.
  - E2E: complete onboarding from new account.
- Success criteria:
  - Onboarding progress persists reliably across sessions.
  - Required fields enforced at submission.
  - All onboarding tests pass in CI.
  - Thorough test gate passed: unit + integration + E2E coverage is implemented and green before sign-off.

### Flow 2.3: Partner Verification (KYC/KYB)
- Implementation steps:
  - Build document upload and verification submission workflow.
  - Add status lifecycle handling and re-submission support.
  - Show rejection reasons and re-upload actions.
- Required tests:
  - Unit: verification status transition rules.
  - Integration: upload -> submit -> reject -> resubmit.
  - E2E: full verification journey with both approval and rejection paths.
- Success criteria:
  - Verification state transitions are correct and auditable.
  - Re-submission flow works without data loss.
  - All verification tests pass in CI.
  - Thorough test gate passed: unit + integration + E2E coverage is implemented and green before sign-off.

### Flow 2.4: Partner Dashboard
- Implementation steps:
  - Build dashboard summary cards and activity feed.
  - Add alerts panel and quick actions.
  - Connect data queries with caching and loading/error states.
- Required tests:
  - Unit: dashboard aggregation mappers.
  - Integration: widget data loading and fallback states.
  - E2E: dashboard renders and quick actions navigate correctly.
- Success criteria:
  - Dashboard surfaces key states accurately.
  - No broken widgets in staging.
  - All dashboard tests pass in CI.
  - Thorough test gate passed: unit + integration + E2E coverage is implemented and green before sign-off.

### Flow 2.5: Stay Listing Management
- Implementation steps:
  - Build stay CRUD with draft/save/submit/archive actions.
  - Add property details, amenities, policies, and media ordering.
  - Implement listing status transitions and edit lifecycle.
- Required tests:
  - Unit: listing validators and status transition logic.
  - Integration: create draft -> submit -> edit -> pause/archive.
  - E2E: partner creates and manages stay listing end-to-end.
- Success criteria:
  - Stay listing lifecycle is stable and predictable.
  - Status rules enforced on every transition.
  - All stay module tests pass in CI.
  - Thorough test gate passed: unit + integration + E2E coverage is implemented and green before sign-off.

### Flow 2.6: Stay Pricing and Availability
- Implementation steps:
  - Implement pricing rules engine (base, seasonal, weekday/weekend).
  - Build availability calendar and blackout management.
  - Add bulk update operations and conflict validation.
- Required tests:
  - Unit: pricing calculations and rule precedence.
  - Integration: pricing + calendar persistence and retrieval.
  - E2E: update prices/availability and verify reflected state.
- Success criteria:
  - Pricing outputs match expected test vectors.
  - Calendar conflict handling is deterministic.
  - All pricing/availability tests pass in CI.

### Flow 2.7: Transfer/Taxi Listing Management
- Implementation steps:
  - Build transfer CRUD with route/type/vehicle setup.
  - Add status transitions (draft/pending/live/paused/rejected).
  - Implement archive and update flows.
- Required tests:
  - Unit: transfer data validation and status rules.
  - Integration: create/update/submit/pause/archive operations.
  - E2E: partner manages transfer listing end-to-end.
- Success criteria:
  - Transfer listing management is functionally complete.
  - No invalid vehicle/route data accepted.
  - All transfer module tests pass in CI.

### Flow 2.8: Transfer Pricing and Scheduling
- Implementation steps:
  - Implement fare rules (route-based, time/distance, surcharge).
  - Add schedule windows and blackout dates.
  - Validate overlapping/conflicting schedules.
- Required tests:
  - Unit: fare computation and schedule conflict logic.
  - Integration: schedule persistence and retrieval.
  - E2E: configure transfer pricing and schedule fully.
- Success criteria:
  - Fare computations remain accurate under edge cases.
  - Schedule conflicts blocked with clear errors.
  - All transfer pricing/scheduling tests pass in CI.

### Flow 2.9: Media and Document Management
- Implementation steps:
  - Build image/document upload integration through local/mock file adapters for this phase.
  - Add replace/remove/reorder flows.
  - Enforce file type, size, and count validations.
- Required tests:
  - Unit: file validation logic and metadata normalization.
  - Integration: upload -> attach -> replace/remove lifecycle.
  - E2E: upload media/docs across listing and verification flows.
- Success criteria:
  - Upload operations are reliable and secure.
  - Invalid files are consistently rejected.
  - All media/document tests pass in CI.

### Flow 2.10: Data Quality Tools
- Implementation steps:
  - Implement required-field checks and completeness scoring.
  - Add duplicate detection warnings.
  - Build correction loop from moderation feedback.
- Required tests:
  - Unit: completeness scoring and duplicate heuristics.
  - Integration: validation gate before submission.
  - E2E: submit listing with issues, fix, and resubmit.
- Success criteria:
  - Incomplete listings are blocked at submit.
  - Duplicate warnings trigger reliably.
  - All data quality tests pass in CI.

### Flow 2.11: Notifications and Communication
- Implementation steps:
  - Implement event-driven notification pipeline using local/mock event emitters in this phase.
  - Build in-app notification center and read/unread states.
  - Add email templates for verification/moderation/settlement/refund events.
- Required tests:
  - Unit: template rendering and notification routing.
  - Integration: event -> notification -> delivery status.
  - E2E: trigger notifications from major flows and validate visibility.
- Success criteria:
  - Key events generate expected notifications.
  - Notification center remains accurate after read/unread actions.
  - All notification tests pass in CI.

### Flow 2.12: Reports and Insights
- Implementation steps:
  - Build report data aggregation layer/services for the partner module (no API endpoints in this phase).
  - Implement partner report UI with date filters.
  - Add CSV export generation and download flow.
- Required tests:
  - Unit: metric transformations and export formatting.
  - Integration: report query -> aggregation -> export.
  - E2E: run report and export CSV successfully.
- Success criteria:
  - Report values match fixture data.
  - CSV exports are complete and correctly formatted.
  - All reporting tests pass in CI.

### Flow 2.13: Partner Support and Settings
- Implementation steps:
  - Build support request entry points and settings screens.
  - Implement profile/preferences/security update flows.
  - Add account deactivation request action.
- Required tests:
  - Unit: settings validators and state reducers.
  - Integration: update operations and persistence.
  - E2E: submit support ticket and update account settings.
- Success criteria:
  - Settings updates persist correctly.
  - Support requests are recorded consistently.
  - All support/settings tests pass in CI.

### Flow 2.14: Wallet, Earnings, and Booking Settlement
- Implementation steps:
  - Implement partner ledger balances and transaction views.
  - Trigger settlement state transitions automatically when a booking is marked completed in local/mock data.
  - Deduct commission/fees before calculating net partner settlement amount.
  - Add settlement status tracking and statement downloads in the partner UI.
  - Implement cancellation-refund operations flow where admin notifies partner and tracks refund completion status.
  - Show fee/tax deduction breakdown per settled booking.
  - Keep integration behind module adapters so Django API wiring can be added later without UI rewrite.
- Required tests:
  - Unit: ledger math, settlement eligibility, deduction calculations, refund impact calculations.
  - Integration: mock booking completion -> balance update -> settlement lifecycle; mock cancellation -> admin notification -> refund resolution tracking.
  - E2E: complete booking in test fixtures triggers partner settlement state updates; cancellation triggers admin refund notification and tracked refund status updates.
- Success criteria:
  - Ledger totals reconcile with booking-level settlement statements.
  - Settlement and refund state transitions are deterministic.
  - All wallet/settlement tests pass in CI.

### Flow 2.15: Settlement Account (Payout Method) Details and Verification
- Implementation steps:
  - Build settlement account form with country-specific validation.
  - Add OTP confirmation and account ownership checks.
  - Enforce masked display and re-verification on account changes.
  - Add settlement account method history timeline.
  - Implement this phase with local/mock verification adapters; defer Django integration to backend phase.
- Required tests:
  - Unit: country format validators, masking logic, ownership checks.
  - Integration: add/update settlement account -> mock verify -> status changes.
  - E2E: set settlement account, verify OTP, update details, re-verify.
- Success criteria:
  - Sensitive settlement account details are never exposed in plain form.
  - Re-verification triggers correctly after account changes.
  - All settlement account tests pass in CI.

## 4. Test Strategy by Module

### Auth Module
- Unit: token/session logic, credential validation.
- Integration: auth middleware and protected route behavior.
- E2E: sign up/login/reset/logout journeys.

### Profile and Verification Modules
- Unit: profile validators, verification status rules.
- Integration: profile -> verification pipeline.
- E2E: submission and re-submission paths.

### Stays and Transfers Modules
- Unit: field validation, listing state transitions.
- Integration: listing + media + submit workflows.
- E2E: full listing CRUD and moderation feedback loop.

### Pricing and Availability Module
- Unit: pricing calculations, rule conflict handling.
- Integration: pricing with calendar persistence.
- E2E: user updates reflected end-to-end.

### Wallet and Settlement Module
- Unit: ledger math, settlement eligibility, refund impact logic, masking.
- Integration: mock booking completion ingestion to settlement completion; mock cancellation to refund tracking.
- E2E: settlement account setup, booking settlement, and refund status journey.

### Notifications and Reports Modules
- Unit: notification routing and report transforms.
- Integration: event-driven notifications and report export.
- E2E: trigger events and confirm user-visible outputs.

## 5. Global Release Success Criteria
- All partner app features in scope are implemented per phase definition.
- All modules are thoroughly tested with passing unit, integration, and E2E suites.
- Thorough testing is a mandatory release criterion: no flow is marked completed unless unit, integration, and E2E suites pass for that flow.
- Zero critical security issues and zero critical functional defects at release.
- Core partner flows complete successfully in UAT:
  - onboarding
  - verification
  - listing creation and submission
  - pricing and availability updates
  - settlement account setup and booking-completion settlement/refund tracking
- Production observability dashboards and alerts are active for key flows.
