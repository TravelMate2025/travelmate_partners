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
- Listing status management (draft, pending, approved, live, paused, rejected)
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

### 1.14 Partner Wallet, Earnings, and Payouts
- Earnings wallet/ledger view
- View pending balance, available balance, and paid balance
- Payout method setup (bank account or mobile money where supported)
- Payout schedule selection (weekly, bi-weekly, monthly)
- Minimum payout threshold configuration
- Reserve/hold period visibility for new earnings
- Payout request flow (manual mode, if enabled)
- Payout status tracking (pending, processing, paid, failed, reversed)
- Failed payout retry and correction flow
- Download payout statements and earnings reports
- Commission/fee deductions breakdown per payout
- Tax/withholding summary visibility (where applicable)

### 1.15 Payout Account Details and Verification
- Payout details form for bank or mobile money accounts
- Required payout fields by country (account holder name, bank name, account number/IBAN, routing/SWIFT where required)
- Country and currency selection for payouts
- Account ownership verification status (pending, verified, rejected)
- OTP confirmation for payout account submission/updates
- Name match check between KYC profile and payout account holder name
- Re-verification required when payout details are changed
- Masked account display in UI (show only safe partial data, e.g., last 4 digits)
- Ability to set one default payout method
- Validation messages for invalid or unsupported account formats
- Submission history for payout account updates
- Alert notifications when payout details are updated

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
- User selects service regions and payout preferences.
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
- System emits events for verification, moderation, payout, and reminders.
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

### 2.14 Wallet, Earnings, and Payouts Flow
- System ingests earning events to partner ledger.
- User views pending, available, and paid balances.
- User sets payout schedule/threshold.
- User requests payout where manual mode exists.
- System updates payout status until completion/failure.
- User downloads payout statement and deduction breakdown.

### 2.15 Payout Account Details and Verification Flow
- User adds bank/mobile payout details.
- System validates account format by country.
- System sends OTP and runs ownership/name checks.
- System marks payout method status.
- On updates, system triggers re-verification and alerts.

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
- Flow 2.11 and onward: `Not started`

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
- Flow 2.8 transfer pricing and scheduling is implemented with fare model fields, schedule windows, blackout dates, overlap validation by day/time, and persisted module state (mock + real API adapters).
- Flow 2.9 media/document management is implemented across stay, transfer, and verification editors with shared file validation rules (type/size/count), metadata persistence, replace/remove actions, and image reordering for listing media.
- Transfer listing detail editor now includes direct image upload, replace, reorder, and remove controls aligned with stay image lifecycle behavior.
- Strict Flow 2.9 validation coverage is added via dedicated integration test (`flow-2.9-media-docs-strict.integration.test.ts`) aligned to each flow bullet in section 2.9.
- Flow 2.10 data quality tooling is implemented with listing completeness scoring, required-field submission gates, duplicate listing warnings, and correction prompts on rejected listings for both stays and transfers.
- Strict Flow 2.10 validation coverage is added via dedicated integration test (`flow-2.10-data-quality-strict.integration.test.ts`) aligned to each flow bullet in section 2.10.
- AGENTS alignment hardening added middleware-backed protected route checks, verification terminology alignment (`in_review` lifecycle stage), and audit event recording support for critical verification/listing actions.

## 3. Flow-Based Implementation Plan

### Flow 2.1: Authentication and Account Access
- Implementation steps:
  - Build sign-up/sign-in/reset endpoints and UI screens.
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
  - Build upload service integration for images/documents.
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
  - Implement event-driven notification pipeline.
  - Build in-app notification center and read/unread states.
  - Add email templates for verification/moderation/payout events.
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
  - Build report data aggregation endpoints.
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

### Flow 2.14: Wallet, Earnings, and Payouts
- Implementation steps:
  - Implement partner ledger balances and transaction views.
  - Build payout schedule/threshold configuration.
  - Add payout request, status tracking, and statement downloads.
  - Show fee/tax deduction breakdown.
- Required tests:
  - Unit: ledger math, payout eligibility, deduction calculations.
  - Integration: earning event -> balance update -> payout lifecycle.
  - E2E: configure payout and track payout status end-to-end.
- Success criteria:
  - Ledger totals reconcile with payout statements.
  - Payout state transitions are deterministic.
  - All wallet/payout tests pass in CI.

### Flow 2.15: Payout Account Details and Verification
- Implementation steps:
  - Build payout account form with country-specific validation.
  - Add OTP confirmation and account ownership checks.
  - Enforce masked display and re-verification on account changes.
  - Add payout-method history timeline.
- Required tests:
  - Unit: country format validators, masking logic, ownership checks.
  - Integration: add/update payout account -> verify -> status changes.
  - E2E: set payout account, verify OTP, update details, re-verify.
- Success criteria:
  - Sensitive payout details are never exposed in plain form.
  - Re-verification triggers correctly after account changes.
  - All payout account tests pass in CI.

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

### Wallet and Payouts Module
- Unit: ledger math, payout eligibility, masking.
- Integration: earnings ingestion to payout completion.
- E2E: payout setup and statement generation.

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
  - payout setup and payout tracking
- Production observability dashboards and alerts are active for key flows.
