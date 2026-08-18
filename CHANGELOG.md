# Changelog

## 2026-08-18 - Final local security and responsive release pass

- Corrected NestJS throttling scope so the normal API uses the intended 100-request-per-minute guard instead of inheriting the five-request OTP quota. Sensitive authentication routes now carry explicit endpoint limits, while the existing Redis identity/IP controls remain in force.
- Added throttling-scope regression coverage. The complete API result is now 35 passing suites and 212 passing tests.
- Corrected the public homepage hero backdrop to remain absolutely positioned at desktop, tablet, and mobile sizes; it no longer renders as an inline image that pushes content below the fold. Hero copy now has an explicit accessible white foreground.
- Strengthened responsive Chromium QA to wait for actual rendered surfaces and settled entrance transitions, reject lingering loading skeletons, verify hero/backdrop geometry and contrast, and retain the authenticated Admin/Merchant layout checks.
- Verified all nine public/Admin/Merchant viewport cases at 1440×900, 1024×768, and 390×844, and regenerated the screenshot and JSON evidence under `artifacts/responsive-qa/automated/`.
- Verified the optimized Next.js production build, TypeScript, ESLint, Prisma validation, Flutter analysis, and all 68 Flutter tests. Store publishing, production provider configuration, legal draw approval, and physical-device acceptance remain external release gates and were not fabricated or enabled.

## 2026-08-17 - Reproducible local Android build

- Corrected the Flutter local website URL to the active Next.js development port `3001`.
- Added `npm run flutter:build:android:local` to build a debug APK while keeping compiler and Gradle caches on drive D, avoiding the workstation's constrained system drive.
- Verified a current-source Android debug APK build with package `in.bnc.bnc_mobile`, version `1.1.0+2`, minimum SDK 24, and target SDK 36.
- Recorded the generated 173,102,746-byte APK checksum as `61C26D5D2AC10846008200FFCB2DEFAB9F876353FC4BB3B6C8F9D76CCDA25BB4` (SHA-256).
- Verified four-byte ZIP alignment and APK Signature Scheme v2 signing with the Android debug certificate.

## 2026-08-17 - Flutter local test reliability

- Diagnosed the Windows Flutter test-loading failure as `ENOSPC` while writing Dart compiler output to the default C: temporary directory, rather than an application loading defect.
- Added `npm run flutter:verify:local`, which uses a process-scoped D: compiler temporary directory and runs dependency resolution, analysis, and the full Flutter suite.
- Verified Flutter 3.41.4 analysis with no issues and all 68 customer-app tests passing against `config.local.json`.

## 2026-08-17 - Reproducible Windows local dependencies

- Added an idempotent local dependency starter for the isolated PostgreSQL/PostGIS and Redis runtimes on this workstation.
- Documented local migration, seed, API, web, health-check, and demo-login commands in `docs/LOCAL_DEVELOPMENT.md`.
- Corrected demo verified-review seeding so verification is backed by a real enquiry and satisfies the database evidence constraint.

All notable production changes to the NearU platform are recorded here.

## 2026-08-17 — Workshop change-log implementation audit and P0 hardening

### Security

- Access tokens are now bound to a persisted refresh session identifier. Every protected request verifies that the session is active and unrevoked, the user is active and not deleted, and the user's current roles still come from the database. Logout, suspension, deletion, and role revocation therefore take effect immediately instead of waiting for the access token to expire.
- Optional authentication uses the same live identity checks, preventing stale token roles from being accepted on routes that enrich anonymous responses for signed-in users.
- Enabled the configured NestJS throttler as a global API guard and configured the API to trust exactly one production reverse proxy for reliable client-IP limits.
- Kept the signed, idempotent Razorpay webhook outside generic throttling so legitimate provider retries are not lost.
- Replaced the delivery callback's static-secret header with raw-body HMAC-SHA256 verification and a required provider event ID. Authenticated events are persisted in the existing webhook ledger before shipment mutation; duplicate IDs are acknowledged without replay, failed processing is recorded, terminal shipment states cannot regress, and legitimate signed retries remain outside generic throttling.
- External delivery mode now fails startup validation unless its API URL, token, and webhook secret are all configured; production endpoints must use HTTPS and status/cancellation paths must retain their `{id}` placeholder.

### Data integrity

- Public analytics events now require a real active, published business for business-engagement event types, validate any supplied category, and suppress identical retry events from the same session inside a five-second window.
- Added targeted rate limiting to the public analytics ingestion endpoint.
- Product, public-offer, and business-gallery capacity checks now run inside a PostgreSQL transaction-scoped advisory lock keyed by business. Concurrent creates re-read the active plan and current usage after acquiring the lock, so simultaneous requests cannot exceed configured plan limits.

### Quality and documentation

- Replaced the unbounded database readiness query with a dedicated PostgreSQL probe carrying connection, query, statement, and overall deadlines. `/health/ready` now returns a sanitized retryable HTTP 503 when PostgreSQL is unavailable or unresponsive. Prisma connects lazily instead of blocking Nest startup, so the independent liveness endpoint remains available during a database outage.
- Added bounded connection, client-query, and server-statement deadlines to the Prisma PostgreSQL pool. Server-side web requests also abort after a configurable deadline that exceeds the database limit, preventing account and portal requests from remaining pending indefinitely while preserving shorter caller-provided abort signals.
- Repaired the labelled demo seed so every review marked as a verified interaction references a matching persisted enquiry, keeping local/demo setup compatible with the review-evidence database constraint instead of weakening review integrity.
- Added regression coverage for revoked sessions, suspended/deleted users, current database roles, analytics target validation, duplicate-event suppression, and concurrent plan-limit enforcement.
- Excluded generated workshop artifacts from ESLint so lint results represent maintained product source code.
- Added `docs/BNC_WORKSHOP_CHANGE_LOG_IMPLEMENTATION_AUDIT_2026-08-17.md`, mapping CL-01 through CL-24 to verified code, tests, remaining external configuration, and release decisions.
- Verified the public homepage, admin login, merchant login, and protected `/admin/weekly-draw` deep link on the local Next.js server. The protected deep link preserves its return URL and redirects to the correct admin login rather than an unavailable port.
- Hardened the `/app` release page: its QR always returns to the canonical BNC app landing page, Google Play and Apple App Store values must match official HTTPS listing formats before becoming clickable, invalid configured values remain visibly disabled, and external store links use safe new-tab attributes. Added the two store variables to `.env.example` and the production checklist without inventing unpublished store URLs.
- Made the rendered-page test launcher safe for Windows repository paths containing parentheses by invoking Wrangler through Node instead of spawning a command shim.
- Made rendered web contracts deterministic with either genuine seeded records or intentional empty states, isolated them from any developer API process, bounded local requests, fully consumed Worker responses, and ran the cross-site mutation rejection last so its intentionally terminated request path cannot contaminate later read-only checks.
- Added dependency-free Chromium responsive QA (`npm run test:responsive`) for the public homepage plus authenticated Admin and Merchant dashboards at 1440×900, 1024×768, and 390×844. It verifies exact viewport emulation, horizontal overflow, escaped visible elements, mobile off-canvas navigation, menu visibility, and dashboard hero structure while saving screenshots and a JSON report.
- Fixed two mobile dashboard cascade defects found by the new visual matrix: Admin heading copy no longer inherits the action-row flex layout, and the Merchant heading content no longer carries a 520px flex basis that created a large empty hero.
- Added responsive CSS source contracts to the normal web test command so off-canvas shell rules, bounded login/public widths, and compact mobile heading behavior cannot silently regress.

### Database

- No schema migration was required for this hardening pass; it reuses the existing `RefreshSession`, user-role, business, category, and analytics-event structures.

## 2026-08-16 — Final audit P0/P1 remediation

### Fixed

- Flutter configuration tests now pass both with safe localhost defaults and with explicitly injected live configuration, while continuing to validate API versioning, valid endpoint schemes, push defaults, and six-digit test OTP shape.
- The Admin audit log now exposes administrator identity, entity, reason, redacted old/new values, timestamp, request evidence, and hash-chain metadata in a dedicated searchable, filterable, paginated read-only viewer; audit snapshots and historical API responses redact credential material.
- Merchant administration filters now retain usable responsive widths instead of collapsing the search field or rendering location/date controls without input boundaries.
- Category and location administration now surfaces the backend's specific duplicate, hierarchy, and in-use validation messages instead of a generic save/update failure.
- Taxonomy edit forms now remount with the selected record's values, preventing stale create-form defaults from changing a category or location's type, parent, or order during edits.
- Deactivated managed locations remain visible as disabled retained assignments on existing merchant profiles, while active-location APIs and backend validation continue to prevent new inactive selections.
- Product moderation now displays merchant, category, price, submission status and time, requires an audit reason for both publishing and rejection, and records each decision in the existing hash-chained audit log.
- Admin service creation now validates price and duration before submission and surfaces the API's precise business, category, price, and duration errors instead of a generic failure.
- Admin plan editing now sends only writable plan fields instead of leaking read-only timestamps into the validated API payload, and plan actions surface nested API validation errors.
- Admin subscription assignment and management now surface precise nested API errors, including plan-limit conflicts, instead of replacing them with a generic failure.
- Local QA can explicitly disable background queue registration with `DISABLE_BACKGROUND_JOBS=true`, allowing API authentication and merchant lifecycle testing when Redis is intentionally unavailable; production behavior is unchanged by default.
- Email, OTP, and password authentication proxies now preserve safe backend validation messages instead of replacing them with generic failures.
- Successful email or OTP login now performs a full protected-page navigation so newly issued HttpOnly session cookies are applied before the destination renders.
- Malformed and expired access tokens now return HTTP 401 instead of leaking JWT verification failures as HTTP 500 responses.
- Customer sign-out now clears the session reliably for mouse and keyboard activation before leaving the account panel.
- Homepage category artwork now fills each complete grid card as a responsive background, with an accessible contrast gradient and bottom-aligned labels instead of appearing as a separate image panel.
- Banner image selection now reports live upload, verification, success, and failure states inside the open dialog instead of continuing to show a misleading required-image message; saving remains blocked until secure verification succeeds. Upload completion now sends only its validated DTO fields and accepts the existing banner and advertisement quarantine scopes. Local development uploads use a storage-origin-allowlisted same-origin relay and MinIO-compatible encryption defaults, while production S3 uploads remain direct with AES-256 storage encryption.
- Restored shared portal CSS primitives for admin/merchant modals, management-card headers, status pills, responsive forms, and operational controls that previously rendered as unstyled inline content.
- Merchant approval/rejection/suspension transactions now use the existing `VERIFICATION_UPDATE` notification enum instead of an invalid value that rolled back the workflow.
- Pending offers no longer send customer notifications, and merchants can request featured placement without granting it to themselves.
- Merchant and admin active-offer KPIs now count only approved, currently live offers.
- Category and managed-location updates reject deep ancestor cycles, not only direct parent/child cycles.
- Business opening hours require a complete, ordered opening/closing time pair for every open day.
- Public enquiries validate their active category, published target business, catalogue ownership, and phone shape before records are created.
- The Windows web launcher resolves the vinext JavaScript entry point directly, so workspace paths containing parentheses are not interpreted as shell commands.

### Added

- A memorable local customer demo account (`c@bnc.in`) now accompanies the existing merchant and admin demo accounts for complete three-role manual QA.
- Audited localization management with manual translation creation across website, business, product, service, category, and offer copy; language validation; duplicate protection; review status; and attributed corrections.
- Genuine verified-purchase reviews from completed orders, including one-review-per-order database enforcement, authenticated ownership checks, customer submission UI, and clear integrity messaging that prohibits fabricated customer experiences.
- Audited admin advertisement entry for platform or business-sponsored campaigns, with placement, location audience, secure creative uploads, validated destinations, budget and schedule controls, safe draft/scheduled initial states, and zeroed performance metrics.
- Admin-created customer-specific offers with explicit recipient selection, optional product/service scope, private coupon codes, server-side approval, direct customer notification, and immutable audit evidence.
- Authenticated private-offer retrieval for the assigned customer; targeted offers are excluded from public discovery, merchant workspaces, featured placement, and bulk nearby-offer delivery, while checkout enforces recipient-only coupon redemption.
- Audited manual order entry for active customers and businesses using published catalogue products, server-calculated pricing, transactional variant stock reservation, duplicate external-reference protection, and customer notification. Orders start pending and never imply payment.
- Admin manual-refund entry for verified offline returns, including method/reference evidence, duplicate protection, refundable-balance enforcement, payment status history, and immutable audit records.
- Server-initiated Razorpay refunds that remain processing until a signed `refund.processed` webhook confirms completion; failed or mismatched provider events never mark funds returned.
- Paginated refund ledger, server-side search/status filters, eligible-payment lookup, and separate manual/automatic refund forms with loading, empty, error, and confirmation states.
- Audited manual subscription-payment entry for verified cash, UPI, bank-transfer, cheque, and other offline receipts, with duplicate-reference protection and immutable captured-status history.
- Admin service creation with business selection, active-category linking, pricing/duration/home-service controls, backend validation, SUPER_ADMIN authorization, and append-only audit entries.
- Paginated admin payment ledger with server-side search/status filters and audited failure/cancellation actions for unsettled payments. Successful payment state remains gateway-webhook-only.
- Homepage consumption of active, scheduled `HOME_HERO` CMS banners through the public API proxy.
- Final-audit source regression contracts covering authorization-sensitive P0/P1 behavior.

### Database

- Added migration `20260816053000_verified_purchase_reviews` to connect one genuine customer review to its completed order evidence.
- Added migration `20260816043000_targeted_customer_offers` for offer recipient, creation source/actor attribution, recipient lifecycle lookup, and operational-source indexes.
- Added migrations `20260816033000_manual_order_entry` and `20260816034000_scope_order_reference` for order source, merchant-scoped external operational references, creator attribution, and query indexes.
- Added migration `20260816023000_refund_operations` to support order or subscription refunds, operational source/method/evidence fields, provider failure details, and refund lifecycle indexes.
- Added migration `20260816010000_final_audit_integrity` for merchant featured-offer requests and their moderation index.

## 2026-08-15 — Sprint 6: CMS, audit, QA, and release readiness

### Added

- Admin banner CMS with secure image uploads, five allowlisted placements, CTA validation, date scheduling, display order, activation state, and audited create/update operations.
- Public scheduled-banner read API that returns only active banners inside their configured date window.
- Offer moderation states with audited approval/rejection; new and materially edited offers require approval before public delivery or notifications.
- Append-only payment status history sourced from checkout and verified Razorpay webhook transitions. No browser or admin endpoint can mark a payment paid.
- Merchant offers route and navigation, moderation feedback, and confirmations for listing archive/unpublish, offer pause, lead decline, and renewal cancellation.
- Production environment, deployment, backup, rollback, QA, and performance checklists.

### Database

- Added migration `20260815235900_banner_cms_and_offer_moderation` for banners, offer moderation, indexes, and payment status history.

## 2026-08-15 — Sprint 5: Leads, enquiries, users, and analytics

### Added

- Per-listing merchant enquiry pipeline statuses: new, contacted, qualified, converted, closed, and spam.
- Paginated merchant enquiry search with listing, status, and received-date filters plus protected detail screens.
- Consent-aware contact reveal: direct enquiries expose their intended contact to that listing; matched enquiry contact remains encrypted until the merchant accepts its assignment.
- Optimized merchant dashboard aggregates for listing counts, live offers, received/new leads, current plan, expiry, and persisted profile/contact/WhatsApp event counts.
- Dedicated admin user directory, account detail, pagination, search, and audited activation/pending/suspension controls.
- Merchant administration filters for status, current plan, location, and joining date.
- Aggregate admin reports with merchant/listing/offer/enquiry KPIs, date range validation, and current subscription distribution.
- Regression tests for cross-merchant enquiry isolation and aggregate-only dashboard queries.

### Security and compatibility

- Merchant enquiry ownership is resolved server-side from a direct listing target or an actual lead assignment; no merchant identifier supplied by the browser is trusted without capability verification.
- Merchant pipeline status is stored per business so one matched merchant cannot alter another merchant's pipeline or the customer's global enquiry status.
- Existing customer enquiry lifecycle, lead matching, acceptance, and public analytics-event contracts remain compatible.
- Offer-view analytics are not displayed because no `OFFER_VIEW` event exists in the current tracking schema.

### Database

- Added migration `20260815230000_merchant_enquiry_pipeline` with `MerchantEnquiryState`, pipeline status enum, ownership/status indexes, and aggregate-query indexes for merchants, offers, and subscription distribution.

## 2026-08-15 — Sprint 4: Subscription plans, renewals, and payment status

### Added

- Dedicated merchant subscription routes at `/merchant/subscription` and `/business/subscription` with configurable plan comparison, live usage, activation/expiry dates, renewal state, and normalized payment state.
- Dedicated admin plan management at `/admin/plans` for create, edit, activate/deactivate, entitlement configuration, prices, limits, and audited reordering.
- Paginated, searchable admin subscription management at `/admin/subscriptions` with plan, access, renewal, expiry, source, and provider-payment visibility.
- Audited admin plan grants, changes, extensions, cancellations, and reactivations. Admin access overrides are explicitly identified and never fabricate paid payment records.
- Configurable offer limits, renewal metadata, assignment source, and renewal indexes. A separate listing-count limit was intentionally not added because the current domain stores one subscription per business listing.
- Independent plan display order so admin reordering does not change the existing marketplace priority weight.
- Backend offer-limit enforcement and downgrade/assignment usage validation across products, media, categories, and offers.
- Regression tests covering pending checkout, payment-safe admin grants, and cancellation of renewal intent.

### Security

- Merchant subscription access continues to require the server-side `business:billing:manage` capability for the authenticated business.
- Plan mutations require `SUPER_ADMIN`; subscription and payment-ledger operations require `SUPER_ADMIN` or `FINANCE`.
- The admin API intentionally exposes no “mark paid” operation. Only signed provider webhook processing can activate a paid checkout.
- Every plan configuration and admin subscription mutation creates a hash-chained audit-log entry with a required reason.

### Database

- Added migration `20260815220000_subscription_renewal_management` for plan limits, renewal state, assignment provenance, payment cancellation state, and an expiry-processing index.
- Existing Bronze, Silver, Gold, Platinum, Diamond, and Ruby records remain the canonical six seeded plans and continue to be returned dynamically by the plan APIs.

## 2026-08-15 — Sprint 2: Business listings, categories, and locations

### Added

- Merchant-owned listing routes for list, create, edit, private preview, publish, unpublish, and archive workflows.
- Independent `ListingStatus` lifecycle so merchant approval remains separate from public listing visibility.
- Listing tags and SEO title/description fields, plus editable opening hours, contact channels, category, address, managed location, logo, cover, and gallery media.
- Hierarchical `ManagedLocation` taxonomy with optional links from existing business addresses.
- Dedicated admin category CRUD, activation, ordering, and safe-delete APIs and screens.
- Dedicated admin location CRUD, activation, ordering, hierarchy, and safe-delete APIs and screens.
- Paginated admin listing oversight with search, filters, inspection, disable, and reactivate actions.
- Ownership and lifecycle regression tests for cross-merchant mutation denial and safe taxonomy deletion.

### Compatibility

- Existing business address strings remain authoritative in public responses; managed location links are additive.
- Existing active businesses are migrated to `PUBLISHED`, while new listings begin as `DRAFT`.
- Public business, product, service, offer, job, location-count, and search queries now require both an approved merchant and a published listing.

## 2026-08-15 — Sprint 1: Authentication, roles, and merchant onboarding

### Added

- Merchant entry routes at `/merchant/login`, `/merchant/dashboard`, and `/merchant/profile`.
- Complete merchant profile editing for business identity, owner/contact, phone, email, description, primary address, location coordinates, and logo.
- Merchant account-status visibility with approved/pending/rejected/suspended presentation.
- Password-reset request and completion APIs using rate-limited Redis challenges and the existing email notification queue.
- Admin dashboard route at `/admin/dashboard`.
- Paginated merchant approval queue at `/admin/merchants` with server-side status and text filters.
- Merchant detail and audited approve, reject, suspend, and reactivate workflow at `/admin/merchants/:id`.
- Reusable backend publication guard requiring an active, verified merchant before product or job publication.
- Breadcrumbs and Sprint 1 merchant navigation in the responsive dashboard shell.
- Regression tests for password reset, approval transitions, publication blocking, and approved-business checks.

### Security

- Merchant administration APIs require JWT authentication and an allowlisted administrative role.
- Merchant status mutations use stricter roles than read-only merchant access.
- Every merchant status decision requires a validated reason, records a hash-chained audit entry, and notifies the merchant owner.
- Password reset revokes every active refresh session after changing the password.
- Unknown password-reset emails receive the same accepted response to avoid account enumeration.

### Changed

- Core merchant descriptions and logo/banner images can be completed while the merchant is awaiting plan activation or administrative approval.
- Managed business responses expose the decrypted contact phone only to authorised workspace members and no longer serialize the encrypted value.
- Business portal return destinations accept the new `/merchant/*` route namespace while keeping `/business/*` backward compatible.

### Database

- No schema migration was required. Existing business statuses, verification requests, notifications, refresh sessions, and indexed audit logs support Sprint 1.
# Manual payment evidence validation

- Required finance reconciliation evidence for every admin-entered offline subscription payment in both the UI and API validation layer.
- Stored that evidence in immutable payment metadata, payment-status history, and the existing audited manual-capture workflow without representing it as a gateway confirmation.
# Refund evidence and provider-status protection

- Separated customer/business refund reason from the administrator audit reason for manual and automatic refunds.
- Required reconciliation evidence for offline refunds and persisted it in the refund record, refund metadata, payment-status history, and audit trail.
- Added validation coverage proving browser payloads cannot set provider-controlled refund statuses and provider refunds remain processing until a signed webhook completes them.
# Manual order pricing and rejection QA

- Clarified that the order subtotal shown in the admin form is only a preview and that final product, variant, subtotal, and total values are recalculated by the API.
- Added automated coverage for price-field injection, insufficient variant stock, unavailable catalogue products, invalid customers, and duplicate business references.

# Targeted customer offer visibility and redemption isolation

- Connected the authenticated customer offer feed to the public Offers screen, where assigned private offers are clearly labelled and shown only to their selected customer.
- Added business imagery and primary-location context to private-offer responses for a complete customer-facing card.
- Added regression coverage proving a different customer cannot redeem a private coupon.
- Enforced service-only coupon scope at product checkout so catalogue restrictions cannot be bypassed.

# Banner upload and publishing QA

- Added immediate inline rejection for unsupported banner formats and files larger than 10 MB, matching the protected media API limits.
- Kept Save disabled until the image is verified and all required banner, CTA, schedule, order, and audit fields are valid.
- Added a loopback-only development object-storage command so signed uploads and public media promotion can be tested locally when Docker/MinIO is unavailable.

# Review integrity and moderation QA

- Restricted Admin review decisions to genuine pending or flagged customer submissions and rejected whitespace-only moderation reasons server-side.
- Added explicit approve/publish and reject/remove controls, clearer inline error feedback, automatic resolution of open reports, and hash-chained audit coverage.
- Verified that customer review text and ratings are persisted from authenticated input without AI generation or fabricated purchase claims.
- Added a database integrity migration that removes unsupported legacy verified-interaction badges and requires order or enquiry evidence for every future verified badge.

# User administration and report accuracy QA

- Added explicit user-directory empty and error states, bounded search pagination, confirmation for account status changes, and trimmed server-side audit reasons.
- Restricted account suspension and reactivation to super administrators while retaining protected read access for operational support roles.
- Added date-scoped merchant, listing, offer, enquiry, payment and subscription aggregates, captured-payment value, current subscription totals, and a clear empty-range report state.

# Official WhatsApp automation readiness

- Added a disabled-by-default provider-neutral HTTP adapter; production startup rejects partial credentials, non-HTTPS provider URLs, malformed template maps, or an enabled provider with no approved templates.
- Required both an enabled per-notification WhatsApp preference and the latest scoped `WHATSAPP_NOTIFICATIONS` consent before dispatch.
- Restricted outbound messages to environment-allowlisted provider-approved templates, with a configurable daily cap, deterministic idempotency key and three-attempt ceiling.
- Added raw-body HMAC verification, stable event-ID deduplication and durable callback outcomes using the existing `WebhookEvent` ledger.
- Kept provider acceptance separate from authenticated delivery/read/failure callbacks and added STOP/UNSUBSCRIBE/CANCEL processing that appends consent withdrawal and disables WhatsApp preferences.
- Added regression tests for consent bypass prevention, approved-template dispatch, spoofed callback rejection and provider-driven opt-out.

# Reward-draw legal activation gate

- Made weekly, monthly and festival reward operations fail closed unless the feature is explicitly enabled with a legal/tax approval reference.
- Hidden active campaigns and customer entries while the feature is disabled, while retaining administrative access to existing records for governance and investigation.
- Removed the reward-code HMAC fallback to JWT/local secrets and made a dedicated 32-character minimum `DRAW_CODE_SECRET` mandatory at startup.
- Added regression coverage proving a disabled environment cannot open a draw or mutate its lifecycle.

# Mobile store publication gate

- Added an explicit disabled-by-default mobile release switch so merely setting a URL cannot expose an unpublished store button.
- Tightened official store URL canonicalization to reject credentials and custom ports, reject fake/non-HTTPS hosts, and remove tracking query strings or fragments from displayed destinations.
- Added `npm run verify:mobile-release`, which requires both canonical store listings and a non-local HTTPS BNC landing origin before release configuration passes.
- Added rendered regression coverage for the publish switch, local-origin rejection, canonical URL output and safe pending-state page.
