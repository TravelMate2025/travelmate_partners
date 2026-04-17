# TravelMate Partner (UI App)

Next.js frontend for the TravelMate Partner application.

This app is prepared to consume backend APIs once Django is ready. Until then, it runs with a mock API adapter to support UI development.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Testing

```bash
npm test
npm run test:e2e
npm run test:all
```

E2E coverage currently includes:
- Flow 2.1 auth UI journey (signup -> verify email -> login).
- Flows 2.2 to 2.5 UI journey (onboarding -> verification -> dashboard -> stays lifecycle).

## API Integration Modes

Set these in `.env.local`:

```bash
NEXT_PUBLIC_USE_MOCK_API=true
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

- `NEXT_PUBLIC_USE_MOCK_API=true`: use frontend mock data adapter.
- `NEXT_PUBLIC_USE_MOCK_API=false`: call real backend APIs at `NEXT_PUBLIC_API_BASE_URL`.

## Current Implemented Routes

- `/auth/signup`
- `/auth/verify-email`
- `/auth/login`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/dashboard`
- `/verification`
- `/onboarding`
- `/stays`
- `/stays/new`
- `/stays/[stayId]`
- `/pricing-availability`
- `/transfer-pricing-scheduling`
- `/transfers`
- `/transfers/new`
- `/transfers/[transferId]`

## Implementation Status

- Flow 2.1 (`Authentication and Account Access`): Completed
- Flow 2.2 (`Partner Profile and Onboarding`): Completed
- Flow 2.3 (`Partner Verification`): Completed
- Flow 2.4 (`Partner Dashboard`): Completed
- Flow 2.5 (`Stay Listing Management`): Completed
- Flow 2.6 (`Stay Pricing and Availability`): Completed
- Flow 2.7 (`Transfer/Taxi Listing Management`): Completed
- Flow 2.8 (`Transfer Pricing and Scheduling`): Completed
- Flow 2.9 (`Media and Document Management`): Completed
- Flow 2.10 (`Data Quality Tools`): Completed
- Flow 2.11 (`Notifications and Communication`): Completed
- Flow 2.12 (`Reports and Insights`): Completed
- Flow 2.13 (`Partner Support and Settings`): Completed
- Flow 2.14 (`Wallet, Earnings, and Payouts`): Pending approval
- Next target: Flow 2.15 (`Payout Account Details and Verification`) after 2.14 approval

Recent updates:
- Flow 2.5 strict validation test added (`src/modules/integration/flow-2.5-stays-strict.integration.test.ts`) with explicit assertions for create, enrich, submit/save-draft, status transitions, edit, pause, and archive.
- Dashboard quick action behavior corrected: `Add Stay` now routes directly to `/stays/new` instead of mutating pending approval counters.
- UI polish pass applied across auth, onboarding, verification, dashboard, and stays pages with a unified visual system (new typography, richer surfaces, stronger CTA styling, and subtle motion).
- Product shell expanded to include plan-aligned module navigation (`Dashboard`, `Onboarding`, `Verification`, `Stays`, `Transfers`, `Pricing & Availability`, `Wallet & Payouts`, `Notifications`, `Reports`, `Support & Settings`) with scaffolded "Coming soon" pages for not-yet-implemented flows.
- Flow 2.6 implementation added:
  - Pricing and availability page with stay selection (`/pricing-availability`)
  - Currency + base/weekday/weekend rates, min/max stay rules
  - Seasonal date-range overrides with overlap conflict validation
  - Blackout date entry with duplicate validation
  - Mock + real API adapters and integration/unit test coverage
- Flow 2.7 implementation added:
  - Transfer list view (`/transfers`), create flow (`/transfers/new`), and detail editor (`/transfers/[transferId]`)
  - Route/vehicle configuration, features, fares, and operating metadata updates
  - Transfer listing lifecycle transitions with moderation feedback loop (`draft`, `pending`, `approved`, `live`, `paused`, `rejected`, `archived`)
  - Mock + real API adapters and integration/unit test coverage
- Flow 2.8 implementation added:
  - Transfer pricing and scheduling module (`/transfer-pricing-scheduling`) with transfer selector
  - Fare model fields: currency, base fare, distance rate/km, time rate/minute, peak and night surcharges
  - Schedule windows with day-based conflict validation and blackout date management
  - Mock + real API adapters and integration/unit test coverage
- Flow 2.9 implementation added:
  - Shared media/document file validation rules for type, size, and count limits
  - Stay and transfer listing image lifecycle now supports upload, replace, reorder, and remove
  - Verification document lifecycle now supports upload, replace, and remove
  - Strict flow alignment test added (`src/modules/integration/flow-2.9-media-docs-strict.integration.test.ts`)
- Flow 2.10 implementation added:
  - Shared listing quality scoring and validation tools for stays/transfers
  - Required-field gate before submit with explicit missing-field errors
  - Duplicate listing warnings in quality reports and moderation feedback
  - Correction workflow prompts on rejected listings
  - Strict flow alignment test added (`src/modules/integration/flow-2.10-data-quality-strict.integration.test.ts`)
- Flow 2.11 implementation added:
  - Notifications center (`/notifications`) with read/unread filters, acknowledge, and mark-all-read actions
  - Event routing coverage for verification, moderation, payout updates, and incomplete listing reminders
  - Optional email dispatch metadata with in-app notification channel support
  - Strict flow alignment test added (`src/modules/integration/flow-2.11-notifications-strict.integration.test.ts`)
- Flow 2.12 implementation added:
  - Reports and insights dashboard (`/reports`) with preset/custom date-range selection
  - Aggregated listing performance metrics and listing health indicators
  - CSV export for selected date range with preview support
  - Strict flow alignment test added (`src/modules/integration/flow-2.12-reports-strict.integration.test.ts`)
- Flow 2.13 implementation added:
  - Support and settings module (`/settings`) with profile/security preference updates
  - Support ticket submission flow with category, subject, message, and open ticket listing
  - Account deactivation request flow with validation
  - Audit trail logging and visibility for settings updates, support tickets, and deactivation requests
  - Strict flow alignment test added (`src/modules/integration/flow-2.13-support-settings-strict.integration.test.ts`)
- Flow 2.14 implementation added:
  - Wallet and payouts module (`/wallet-payouts`) with pending/available/paid balance views
  - Payout settings management (schedule, minimum threshold, manual request mode)
  - Manual payout request flow with status progression (`pending` -> `processing` -> `paid`)
  - Downloadable payout statements and deduction breakdown visibility
  - Strict flow alignment test added (`src/modules/integration/flow-2.14-wallet-payouts-strict.integration.test.ts`)
  - Status note: implementation is in code and test-covered, but kept pending approval in planning status.

Latest validation snapshot (April 17, 2026):
- `npm test`: 61/61 tests passing
- `npm run build`: passing

Alignment updates (April 17, 2026):
- Verification lifecycle terminology aligned to `pending`, `in_review`, `approved`, `rejected`.
- Added middleware-based route protection using partner session cookie (`tm_partner_session`) so protected routes are not client-check-only.
- Added audit log recording support for verification document updates/submission and listing publish/pause actions in mock flows.
- Added module scaffolds and tests for `wallet-payouts`, `notifications`, and `reports`.

Onboarding behavior implemented:
- Login routes users to `/onboarding`.
- Onboarding is a resumable 3-step wizard.
- Dashboard access is blocked until onboarding status is `completed`.

## Architecture Notes

- UI only in this repo folder.
- API client abstraction is in:
  - `src/lib/http-client.ts`
  - `src/modules/auth/real-auth-api.ts`
  - `src/modules/auth/mock-auth-api.ts`
  - `src/modules/auth/auth-client.ts`

When Django APIs are ready, keep UI unchanged and map the real adapter contract to backend endpoints.

Verification behavior implemented:
- Upload identity/business/address/permit metadata with file validation (type/size/count).
- Replace and remove previously uploaded verification documents.
- Submit verification and track status transitions (`pending`, `in_review`, `rejected`, `approved`).
- Rejection reasons displayed and re-submission supported.

Dashboard behavior implemented:
- Summary cards for active listings, pending approvals, and total views.
- Alerts feed with status-aware messages.
- Quick actions for add stay, add transfer, and update availability.
  - `Add Stay` now routes to `/stays/new`.
- Recent activity feed with timestamped events and widget refresh.

Stay listing behavior implemented:
- Stay list view (`/stays`) with status-aware actions.
- Create stay flow (`/stays/new`) and detail editor (`/stays/[stayId]`).
- Property details editing, amenities CSV parsing, and policy fields.
- Room/unit add and remove workflow.
- Image metadata upload validation, replace, reorder, and remove workflow.
- Listing status transitions: `draft`, `pending`, `approved`, `live`, `paused`, `rejected`, `archived`.

Transfer listing behavior implemented:
- Transfer image metadata upload validation, replace, reorder, and remove workflow.
