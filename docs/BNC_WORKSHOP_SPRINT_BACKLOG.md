# BNC Workshop — Implementation Sprint Backlog

**Prepared:** 17 August 2026  
**Source:** Malayalam workshop change log (CL-01–CL-24), repository architecture, existing sprint notes, release-readiness and QA documents  
**Status:** Planning baseline; implementation must verify the actual code and data before changing it  
**Deployment:** No automatic production deployment is authorized by this plan

## 1. ലക്ഷ്യവും ഉപയോഗവും / Purpose

ഈ document BNC Workshop change log-ലെ 24 ആവശ്യങ്ങളും implementation-ready sprint tickets ആയി വിഭജിക്കുന്നു. ഓരോ ticket-നും dependency, deliverable, backend rule, UI surface, validation, automated test, manual QA, acceptance criteria എന്നിവ നൽകുന്നു.

This is a developer handoff plan, not a claim that every listed feature is missing. The repository already contains substantial implementations for search, subscriptions, leads, analytics, jobs, chat, orders, booking, delivery workflows, Business Club and rewards. Those areas start with an evidence-based audit and are extended only where the verified implementation does not meet the workshop requirement.

## 2. Verified repository baseline

| Area | Repository evidence | Planning treatment |
| --- | --- | --- |
| Web | Next.js App Router at repository root | Reuse existing routes, components and design tokens |
| API | NestJS REST API in `apps/api` with Prisma/PostgreSQL | Extend existing modules/DTOs/services; do not duplicate APIs |
| Hosted preview | Cloudflare D1/R2 preview path | Keep preview compatibility separate from production PostgreSQL behavior |
| Mobile | Flutter customer app; merchant/admin primarily web | Audit current app routes before adding parity work |
| Authentication | JWT/refresh-token and role/permission model documented | Enforce roles and ownership in API guards/services |
| Plans | Plan, subscription, payment and renewal APIs already documented | Audit and extend to the workshop entitlement matrix |
| Leads/analytics | Merchant enquiry state, ownership checks, dashboards and recorded metrics documented | Extend genuine event routing; never fabricate analytics |
| Jobs/chat/orders/booking | Existing contracts and client routes documented | Verify end-to-end behavior and close workflow/UI gaps |
| Reviews | Moderation and genuine-review policy documented | Add integrity controls and regression coverage; no generated reviews |
| QA | Lint, typecheck, Prisma validation, API tests, web tests and manual responsive checks documented | Make these release gates for every sprint |

## 3. Delivery assumptions

- Sprint length: **2 weeks**.
- Suggested team: 2 backend/full-stack developers, 1 web developer, 1 Flutter developer, shared QA/product support.
- Story points are relative estimates, not hour commitments. Re-estimate after Sprint 0 audit.
- Target capacity: approximately **32–42 points per sprint** for the suggested team.
- P0 work blocks dependent feature releases until security, integrity and routing tests pass.
- All schema changes use Prisma/D1 migrations as appropriate. No manual production schema edits.
- Every list endpoint must be paginated and searchable/filterable where applicable.
- Every protected mutation requires server-side authorization, validation, auditability and idempotency where retry is possible.
- Existing public URLs and response contracts must remain backward compatible unless a versioned migration is approved.

## 4. Decisions required before dependent work

| Decision | Needed by | Owner | Default used for estimation |
| --- | --- | --- | --- |
| D-01: monthly, yearly or both billing periods | Sprint 2 | Product/finance | Existing billing-period support retained; no invented price conversion |
| D-02: behavior when no result exists within 5 km | Sprint 3 | Product | Show explicit radius expansion; do not silently widen |
| D-03: authoritative constituency boundary/geodata source | Sprint 3 | Product/operations | Store stable region IDs; no free-text-only matching |
| D-04: meaning of “home delivery” versus delivery-provider integration | Sprint 5 | Product | Separate merchant availability flag from provider fulfilment |
| D-05: weekly-draw eligibility, tax and legal terms | Sprint 8 | Legal/product | Feature remains disabled until approved |
| D-06: admin access rules for private conversations | Sprint 7 | Legal/security | Metadata/support escalation only; no unrestricted message browsing |
| D-07: approved WhatsApp provider and templates | Sprint 8 | Product/compliance | Official consent-based API only; no scraping or unofficial bulk sender |

## 5. Global Definition of Ready

A ticket may enter implementation only when:

- the actual route, API, model, migration and reusable component have been located;
- duplicate functionality has been ruled out;
- product decisions and sample data required by the ticket are available;
- authorization roles, ownership rules and audit requirements are written;
- API contract and backward-compatibility impact are understood;
- UX has loading, empty, error, success and destructive-confirmation behavior;
- measurable acceptance criteria and test fixtures exist.

## 6. Global Definition of Done

A ticket is done only when:

- migration and indexes are reviewed and reversible;
- DTO/server validation and role/ownership enforcement are tested;
- API/service and web/Flutter surfaces are implemented or explicitly marked not applicable;
- loading, empty, error, success, keyboard and responsive states are verified;
- unit/integration/ownership tests pass;
- audit records are produced for privileged changes;
- API documentation and relevant developer docs are updated;
- `CHANGELOG.md` records the completed behavior;
- no fabricated review, metric, payment, purchase or provider result is displayed;
- manual QA evidence is attached to the ticket;
- no unresolved P0 regression remains.

---

# 7. Sprint plan

## Sprint 0 — Evidence audit and execution foundation

**Goal:** Turn workshop requests into verified gaps and establish a reproducible test baseline.  
**Priority:** P0 enabler  
**Estimate:** 26 points

### AUD-01 — Repository feature matrix (8 pts)

**Scope:** CL-01–CL-24.  
**Deliverables:** Map every requirement to current route, API, service, model, migration, component and test; classify COMPLETE, PARTIAL, MISSING or BROKEN with evidence.  
**Tests/QA:** Run current smoke tests and record reproducible failures.  
**Acceptance:** No COMPLETE classification without source evidence and, where possible, a passing test.

### AUD-02 — Local environment and dependency baseline (5 pts)

**Deliverables:** Clean-path setup procedure, Node/Flutter versions, PostgreSQL/Redis/MinIO startup, environment checklist and seeded test identities. Resolve the known stale API `node_modules` junction and Windows path-with-parentheses launcher issue without committing dependencies.  
**Acceptance:** A fresh developer can run web, API, database and Flutter using documented commands.

### AUD-03 — Contract and data-gap map (5 pts)

**Deliverables:** Compare Next.js preview data, NestJS/PostgreSQL contracts and Flutter models; identify drift and source-of-truth boundaries.  
**Acceptance:** Every planned schema/API change names its consumers and migration compatibility strategy.

### AUD-04 — Architecture decision records (3 pts)

**Deliverables:** Capture D-01–D-07 decisions, owners and deadlines.  
**Acceptance:** Dependent tickets cannot start with an unresolved product rule hidden as a developer assumption.

### AUD-05 — QA baseline and test data (5 pts)

**Deliverables:** Admin, merchant A, merchant B and customer fixtures; approved/pending/suspended merchant states; plan fixtures; listings, offers, orders, reviews and geodata.  
**Acceptance:** Ownership, role isolation and empty/error states can be tested repeatably without production data.

**Sprint exit gate:** Verified matrix, reproducible local stack and approved Sprint 1 scope.

---

## Sprint 1 — P0 security, integrity and routing

**Goal:** Remove authorization, fabricated-data, broken-link and publication-control risks.  
**CL coverage:** CL-06, CL-08, CL-22, CL-23  
**Estimate:** 39 points

### SEC-01 — Merchant ownership audit and fixes (8 pts)

**Scope:** CL-08.  
**Backend:** Resolve merchant/business ownership only from authenticated identity and permissions; reject caller-supplied ownership overrides. Cover listings, media, offers, leads, enquiries, subscriptions, products, services and orders.  
**Validation:** Return consistent 401/403/404 semantics without revealing another merchant’s resource existence.  
**Tests:** Merchant A cannot read or mutate Merchant B identifiers; customer and anonymous users cannot call merchant/admin APIs.  
**Acceptance:** All protected resource tests pass server-side; frontend role checks are supplementary only.

### PLAN-01 — Server-side entitlement enforcement baseline (8 pts)

**Scope:** CL-06.  
**Backend:** Audit the existing plan service and enforce active subscription, merchant approval, product/listing/offer/image/category limits and feature flags in domain services.  
**Validation:** Concurrent creates must not exceed a limit; expired, cancelled, unpaid or suspended access follows one documented policy.  
**Tests:** Boundary, concurrency, downgrade and unauthorized-plan tests.  
**Acceptance:** Editing browser state or calling APIs directly cannot bypass entitlements.

### REL-01 — Navigation, Nginx and deep-link reliability (8 pts)

**Scope:** CL-22.  
**Deliverables:** Audit hard-coded hosts/ports, `/admin/weekly-draw`, refresh/deep-link behavior, API proxy rules, asset routes, SPA/Next fallbacks and environment base URLs. Add health/readiness checks and a route smoke-test manifest.  
**Tests:** Refresh every primary public/admin/merchant route; verify no link switches from `127.0.0.1:3001` to an unavailable `localhost:3000`.  
**Acceptance:** Known menus no longer cause connection-refused/offline pages in the supported local topology.

### REV-01 — Genuine review integrity (8 pts)

**Scope:** CL-23.  
**Backend:** Require a genuine user identity and eligible interaction/purchase rule where configured; preserve moderation state, report reason and audit trail. Do not implement AI-generated reviews or fabricated purchase claims.  
**UI:** Clearly distinguish pending, verified interaction and moderated states without implying authenticity that was not verified.  
**Tests:** Duplicate/spam/rate-limit, cross-user, moderation and publication tests.  
**Acceptance:** Only persisted, authorized submissions can become public.

### SEC-02 — Authentication and role regression suite (5 pts)

**Tests:** Invalid login, expired/revoked token, refresh rotation, logout/back-button, merchant-to-admin denial, customer-to-panel denial and protected API checks.  
**Acceptance:** Automated tests cover admin, merchant and customer isolation.

### OPS-01 — Recovery and P0 release gate (2 pts)

**Deliverables:** Backup/rollback rehearsal notes, route/API smoke command and P0 incident checklist.  
**Acceptance:** Sprint 1 can be rolled back without data loss.

**Sprint exit gate:** Zero open P0 ownership, entitlement, route or review-integrity defect.

---

## Sprint 2 — Configurable plans and usage visibility

**Goal:** Match the approved six-plan matrix without hard-coded page behavior.  
**CL coverage:** CL-06 and foundation for CL-07, CL-10, CL-12, CL-17, CL-18, CL-19  
**Estimate:** 34 points

### PLAN-02 — Plan configuration migration and seed (8 pts)

**Backend/data:** Audit existing `SubscriptionPlan` fields; add only missing normalized entitlements, constraints and indexes. Seed Bronze, Silver, Gold, Platinum, Diamond and Ruby idempotently.  
**Required matrix:**

| Plan | Price | Gallery | Categories | Products | Reach | Booking | Delivery |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| Bronze | ₹499 | 0 | 1 | 3 | Basic/local | No | No |
| Silver | ₹999 | 5 | 3 | 10 | Constituency | No | No |
| Gold | ₹2999 | 15 | 6 | 30 | Constituency | No | No |
| Platinum | ₹4999 | 25 | 10 | 50 | Constituency | Yes | Yes |
| Diamond | ₹9999 | 50 | 15 | 100 | District | Yes | Yes |
| Ruby | ₹14999 | 75 | 20 | 150 | State | Yes | Yes |

**Acceptance:** Values are administered through plan entities, not repeated across frontend pages; billing-period decision D-01 is reflected.

### PLAN-03 — Central entitlement policy service (8 pts)

**Backend:** Expose typed capability/usage evaluation used by listings, products, offers, gallery, categories, booking, delivery, analytics, leads and Business Club.  
**Acceptance:** One policy calculation is authoritative and produces machine-readable denial reasons.

### PLAN-04 — Admin plan management and audit (5 pts)

**UI/API:** Create/edit/activate/deactivate/reorder plan fields and limits; protect existing subscriptions when a plan is deactivated.  
**Tests:** Invalid price/limits/order, duplicate names, role denial and before/after audit snapshots.  
**Acceptance:** Admin changes are audited and do not retroactively fake payment success.

### PLAN-05 — Merchant subscription and usage UI (5 pts)

**UI:** Current plan, access status, activation/expiry, usage versus limits, renewal/payment state and comparison view.  
**Acceptance:** UI uses the policy API and shows accurate recorded usage.

### PLAN-06 — Downgrade, expiry and renewal rules (5 pts)

**Backend:** Define grace period, over-limit existing content, reactivation and scheduled expiry behavior. Reuse existing renewal/payment workflow.  
**Acceptance:** No content is silently deleted; restricted actions explain the remediation.

### PLAN-07 — Subscription regression/performance (3 pts)

**Tests:** Six seeded plans, assignment, expiry, cancellation, extension, unpaid state, pagination and indexed usage queries.  
**Acceptance:** Existing subscription endpoints remain backward compatible or are versioned.

**Sprint exit gate:** Six plans and authoritative entitlements pass API and manual QA.

---

## Sprint 3 — Location-aware discovery and three search modes

**Goal:** Deliver accurate 5 km discovery, plan reach and typed search behavior.  
**CL coverage:** CL-03, CL-04  
**Estimate:** 36 points

### SRCH-01 — Geospatial query and indexes (8 pts)

**Backend/data:** Verify PostGIS coordinates, spatial indexes and active/approved filters. Default radius 5 km; implement D-02 expansion behavior explicitly.  
**Tests:** Inside/outside boundary, missing coordinates, inactive business and pagination.  
**Acceptance:** Query plan avoids full-table distance scans at production scale.

### SRCH-02 — Plan reach and transparent ranking (8 pts)

**Backend:** Combine eligible sponsored/plan priority with distance and organic relevance. Label sponsored/priority results. Respect constituency, district and state reach without hiding closer eligible results.  
**Tests:** Stable tie-breakers, expired plan, same-distance plans and region boundary cases.  
**Acceptance:** Paid placement never masquerades as review quality.

### SRCH-03 — Business, product and service modes (5 pts)

**API/contracts:** Reuse or extend typed search contracts for three modes, filters, suggestions and result payloads.  
**Acceptance:** A mode-specific query does not return ambiguous cards or duplicate records.

### SRCH-04 — Web search experience (5 pts)

**UI:** Mode selector, location/radius state, labelled results, list/map continuity, loading/empty/error states and keyboard accessibility.  
**Acceptance:** URLs are shareable and browser navigation preserves filters.

### SRCH-05 — Flutter search parity (7 pts)

**Mobile:** Consume the shared contracts; location permission denial/manual location/offline behavior; three result card types.  
**Acceptance:** Web and mobile apply the same server results and ranking labels.

### SRCH-06 — Search QA and telemetry (3 pts)

**Tests:** English/Malayalam/transliteration, p95 query timing, zero result, radius change and analytics events.  
**Acceptance:** Search metrics are genuine, privacy-safe and do not log raw sensitive queries unnecessarily.

**Sprint exit gate:** Search modes and location policy pass contract, browser and Flutter QA.

---

## Sprint 4 — Category media and reliable image pipeline

**Goal:** Make categories visual and all supported uploads reliable and efficient.  
**CL coverage:** CL-05, CL-11  
**Estimate:** 36 points

### CAT-01 — Category image model and administration (5 pts)

**Data/API/UI:** Audit current category image support; add object key, alt text and processing state only if absent. Admin upload/replace/remove with audit. Add Insurance through the existing category model.  
**Acceptance:** Active categories and images appear in merchant forms and public discovery without duplicate category records.

### CAT-02 — Category grid background treatment (5 pts)

**Web:** Use approved category image as the grid/card background with readable overlay, fallback, responsive crop and optimized sizes.  
**Acceptance:** Text maintains WCAG AA contrast and cards do not cause layout shift.

### CAT-03 — Flutter category parity (5 pts)

**Mobile:** Reuse the same media URLs/variants and fallback behavior.  
**Acceptance:** Category ordering and active state match the web/API.

### MEDIA-01 — Signed upload validation (8 pts)

**Backend:** JPEG/PNG/WebP content sniffing, size/dimension limits, checksum, ownership, private quarantine and malware-scan state.  
**Tests:** Spoofed MIME, oversized file, cross-owner key, duplicate retry and rejected scan.  
**Acceptance:** UI cannot mark a file ready until the backend accepts its object/processing state.

### MEDIA-02 — Compression and responsive variants (8 pts)

**Worker/storage:** Strip unsafe metadata, correct orientation, produce bounded responsive variants and retain original only according to policy.  
**Acceptance:** Failed processing is retryable and never exposes a quarantined image publicly.

### MEDIA-03 — Upload UX regression (5 pts)

**UI/tests:** Preview, progress, cancellation, inline error and ready state for banners, profiles, listings, products, services, offers and categories.  
**Acceptance:** Fix the false “image is required” state when a validated file is selected.

**Sprint exit gate:** Supported images upload, process and render consistently on web and Flutter.

---

## Sprint 5 — Trust, leads, offers and merchant identity

**Goal:** Improve customer engagement while preserving truth, consent and plan rules.  
**CL coverage:** CL-07, CL-09, CL-10, CL-12, CL-13  
**Estimate:** 41 points

### TRUST-01 — Plan badge versus review rating (5 pts)

**UI/API:** Display membership/plan badge separately from customer star rating and review count.  
**Tests:** No reviews, plan expiry, plan change and missing rating.  
**Acceptance:** Copy and icons cannot imply that a paid plan is a customer rating.

### LEAD-01 — Automatic lead event and matching extension (8 pts)

**Backend:** Audit existing enquiry/lead pipeline; define qualifying customer events, location/category match, consent release, merchant ownership and plan access.  
**Acceptance:** No contact information is released before consent and accepted assignment rules.

### LEAD-02 — Queue reliability and merchant controls (5 pts)

**Backend/UI:** Idempotent matching, retry/dead-letter visibility, duplicate suppression, status changes and merchant filters.  
**Tests:** Correct merchant routing, cross-merchant denial and job retry.  
**Acceptance:** A lead is neither lost nor delivered twice after worker retry.

### OFFER-01 — Daily offers and geographic delivery (8 pts)

**Backend:** Schedule, active window, plan limit, customer eligibility, location scope, notification preference and rate limit.  
**UI:** Merchant offer editor and customer labelled offer feed.  
**Acceptance:** Expired/rejected offers are excluded and notification delivery is auditable.

### DELIVERY-01 — Merchant home-delivery availability (5 pts)

**Scope:** CL-12 and D-04.  
**Data/UI:** Merchant-controlled availability, service area, minimum/order note where approved; separate from external fulfilment status.  
**Acceptance:** Public display is truthful and plan policy is enforced by API.

### CARD-01 — Social links, discount and digital business card (7 pts)

**UI/API:** Reuse the existing six-link validation and vCard generation; close gaps in owner editor, discount presentation and share/download behavior.  
**Tests:** HTTPS/protocol validation, maximum links, unsafe URL and stale cache.  
**Acceptance:** The card is generated from the current verified public profile.

### ENG-01 — Engagement dashboard regression (3 pts)

**Tests:** Only persisted views/calls/WhatsApp/enquiry/offer events appear; aggregate queries do not load complete tables.  
**Acceptance:** Zero data shows zero, never synthetic sample activity.

**Sprint exit gate:** Leads/offers are consent-aware, correctly routed and measurably reliable.

---

## Sprint 6 — Jobs and appointment booking

**Goal:** Complete two high-value merchant/customer operational modules already represented in the repository.  
**CL coverage:** CL-14, CL-18  
**Estimate:** 34 points

### JOB-01 — Jobs gap closure (8 pts)

**Audit/extend:** Employer ownership, plan access, draft/publish/close/expire, category/location, application states and admin moderation.  
**Acceptance:** Merchant can manage only its jobs; customer applications are private and status changes are auditable.

### JOB-02 — Jobs web and Flutter UX (5 pts)

**UI:** Discovery, detail, application, merchant applicant list and history with responsive states.  
**Acceptance:** Existing documented routes work end-to-end against live API data.

### BOOK-01 — Availability and slot engine (8 pts)

**Backend:** Provider schedule, time off, duration, timezone, concurrency-safe reservation and plan eligibility.  
**Tests:** Double booking, DST/timezone, inactive service, cancellation cutoff and ownership.  
**Acceptance:** Two clients cannot reserve the same capacity slot.

### BOOK-02 — Customer and merchant booking workflow (8 pts)

**UI/API:** Browse availability, book, confirm, reschedule, cancel and merchant schedule management.  
**Acceptance:** Status transition rules are server-controlled and notifications are retryable.

### OPS-02 — Jobs/booking audit and reporting (5 pts)

**Admin:** Moderation/oversight, paginated filters and genuine aggregate metrics.  
**Acceptance:** Privileged changes create audit records; dashboards use aggregate queries.

**Sprint exit gate:** Jobs and appointment flows pass ownership, concurrency and mobile/web QA.

---

## Sprint 7 — Customer messaging and Business Club

**Goal:** Complete private communication with explicit membership and privacy boundaries.  
**CL coverage:** CL-16, CL-17  
**Estimate:** 36 points

### CHAT-01 — Conversation authorization and lifecycle (8 pts)

**Backend:** Audit existing membership checks; conversation creation, block/report, retention, unread counts, pagination and attachment policy.  
**Tests:** Non-member read/write denial, blocked user, removed merchant team member and attachment ownership.  
**Acceptance:** Guessing a conversation/message ID reveals nothing.

### CHAT-02 — Web/Flutter realtime experience (8 pts)

**UI:** Conversation list, thread, send/retry, unread state, offline recovery, loading/error/empty states and notification deep links.  
**Acceptance:** Retry is idempotent and does not duplicate messages.

### CLUB-01 — Business Club entitlement and chapters (8 pts)

**Backend:** Verify 5–6 star/eligible plan policy, chapter membership, 16-shop capacity, invite/join/leave/role rules and total membership counts.  
**Acceptance:** Plan expiry/removal follows a documented non-destructive access policy.

### CLUB-02 — Club chat, directory, events and referrals (8 pts)

**UI/API:** Complete existing chapter workspaces and private routes.  
**Tests:** Cross-chapter denial, capacity race, role changes and archived event.  
**Acceptance:** Only current authorized chapter members access private content.

### PRIV-01 — Support/admin privacy controls (4 pts)

**Scope:** D-06.  
**Deliverables:** Least-privilege support escalation, metadata audit and legal-approved message access process if required.  
**Acceptance:** Super-admin role alone does not silently grant unrestricted private-message browsing.

**Sprint exit gate:** Messaging and club isolation tests pass with approved privacy policy.

---

## Sprint 8 — Orders, delivery, rewards and compliant messaging

**Goal:** Complete commerce-adjacent workflows without inventing provider success or bypassing legal gates.  
**CL coverage:** CL-15, CL-19, CL-20  
**Estimate:** 39 points

### DELIV-02 — Delivery provider abstraction (8 pts)

**Backend:** Reuse existing quote/dispatch/tracking/proof/settlement contracts; introduce provider adapters, webhook signature verification, idempotency and normalized states.  
**Acceptance:** Provider failures remain visible and retryable; browser cannot mark delivery complete.

### DELIV-03 — Merchant/customer delivery UX (5 pts)

**UI:** Quote selection, dispatch, tracking timeline, proof and support states.  
**Acceptance:** External provider attribution and fees are clear.

### DRAW-01 — Weekly/monthly/festival reward policy (8 pts)

**Dependency:** D-05 approved.  
**Backend:** Audit existing HMAC one-time draw IDs and ₹200 eligibility; add campaign schedule, eligibility snapshot, claim, audited selection and publication policy.  
**Acceptance:** Codes are one-time, non-enumerable and no winner can be manually substituted without an audit event.

### DRAW-02 — Reward web/Flutter/admin flow (5 pts)

**UI:** Merchant issue/copy, customer claim/status and admin campaign controls.  
**Acceptance:** Feature is disabled when legal/product configuration is absent.

### WA-01 — Official WhatsApp notification integration (8 pts)

**Dependency:** D-07.  
**Backend:** Approved templates, opt-in/opt-out, scope, frequency cap, provider callbacks, failure handling and audit.  
**Acceptance:** No unofficial automation, contact scraping or fabricated delivery receipts.

**Repository status (17 Aug 2026):** Provider-neutral implementation complete and disabled by default. It includes two-part consent enforcement, approved-template allowlisting, bounded retries/frequency, signed idempotent callbacks, durable callback outcomes and STOP handling. Live completion remains blocked on official provider selection, approved template names, credentials, callback registration and sandbox/compliance certification.

### ORDER-01 — Order and payment-state regression (5 pts)

**Tests:** Server pricing, stock, duplicate reference, cancellation, refund linkage, direct-merchant-payment boundary and verified webhooks.  
**Acceptance:** Manual/provider finance records remain clearly distinguishable.

**Sprint exit gate:** Delivery/reward/WhatsApp integrations are idempotent, auditable and legally enabled.

---

## Sprint 9 — Mobile parity, app distribution and onboarding

**Goal:** Align supported web/mobile capabilities and prepare an honest install/release experience.  
**CL coverage:** CL-01, CL-02, CL-21  
**Estimate:** 37 points

### MOB-01 — Web/mobile parity matrix (5 pts)

**Deliverables:** Route-by-route supported capability matrix, API contract/version inventory and intentionally web-only admin/merchant functions.  
**Acceptance:** “Parity” means shared business rules and documented surfaces, not duplicated UI where product scope says web-only.

### MOB-02 — Flutter integration gap closure (8 pts)

**Mobile:** Upgrade shared models and complete broken customer/approved merchant routes discovered by the matrix.  
**Tests:** Analyze, unit/widget tests, Android build and API contract fixtures.  
**Acceptance:** No production API field is guessed or silently ignored when required.

### MOB-03 — Versioning and release notes (5 pts)

**Scope:** CL-02.  
**Deliverables:** SemVer/build policy, API compatibility declaration, release notes and forced/optional upgrade configuration.  
**Acceptance:** Web and app display traceable versions; compatibility is server-configured.

### DIST-01 — Store/QR link management (5 pts)

**Scope:** CL-01.  
**UI/data:** Admin-configurable Android/iOS/store links, environment validation, QR generation and safe fallback while a store listing is unavailable.  
**Acceptance:** QR resolves to an approved HTTPS landing/store URL, not a local host or unverified APK.

### BRAND-01 — Splash, logo and theme consistency (5 pts)

**Scope:** CL-21.  
**Web/mobile:** Approved assets, accessible contrast, launch/splash variants and cache/version handling.  
**Acceptance:** No stretched, low-resolution or platform-noncompliant asset.

### ONB-01 — First-use onboarding (6 pts)

**UI:** Customer location/consent, merchant business setup/status and role-appropriate next steps; skip/revisit behavior.  
**Acceptance:** Onboarding never bypasses merchant approval or permission checks.

### MOB-04 — Device matrix QA (3 pts)

**Tests:** Android supported versions, small/large screen, permission denial, poor network, offline/retry and deep links.  
**Acceptance:** Release candidate build and evidence are archived; no automatic store publication.

**Sprint exit gate:** Signed internal release candidate, version notes, install links and parity evidence approved.

---

## Sprint 10 — UX consistency, regression and production readiness

**Goal:** Close cross-site CSS/state defects and produce a controlled release candidate.  
**CL coverage:** CL-24 and final regression for CL-01–CL-23  
**Estimate:** 36 points

### UX-01 — Shared layout and CSS audit (8 pts)

**Web:** Fix panel grid/card/form/modal/table spacing, overflow, sidebar/header behavior and missing component styles using existing design tokens. Avoid page-specific patches where a shared component is responsible.  
**Acceptance:** Admin, merchant and public key routes pass desktop, tablet and 360 px visual checks.

### UX-02 — State and form consistency (5 pts)

**UI:** Loading skeletons, empty/error/success notifications, button enabling, inline validation, confirmation and focus restoration.  
**Acceptance:** Correct input enables valid submissions; invalid input explains the exact field/rule.

### UX-03 — Accessibility audit (5 pts)

**Tests:** Keyboard, focus, dialog semantics, labels, live regions, image alt text, reduced motion and WCAG AA contrast.  
**Acceptance:** No critical/serious automated accessibility issue on primary journeys.

### PERF-01 — Query and client performance (5 pts)

**Review:** N+1 queries, dashboard aggregates, pagination/indexes, repeated requests, payload sizes, image variants and worker backlog.  
**Acceptance:** Agreed p95 API and Core Web Vitals targets are measured on representative production builds.

### REG-01 — Full automated regression (5 pts)

**Commands:** Lint, typecheck, Prisma validation, API tests, web tests and Flutter analyze/tests/build.  
**Acceptance:** All required gates pass from a clean environment; skipped tests have an approved issue and owner.

### REG-02 — Manual role-based QA (5 pts)

**Coverage:** Admin, merchant A/B and customer flows; auth, categories, locations, plans, subscriptions, search, media, products/services, leads, offers, jobs, chat, booking, orders, delivery, rewards, content, reports and audit log.  
**Acceptance:** Evidence links and defect disposition recorded.

### REL-02 — Release, backup and rollback rehearsal (3 pts)

**Deliverables:** Environment checklist, migration order, backup verification, canary/smoke checks, monitoring, rollback trigger and owner roster.  
**Acceptance:** Staging rehearsal succeeds; production deployment requires separate explicit authorization.

**Sprint exit gate:** Release candidate accepted with zero P0/P1 defects and a signed deployment checklist.

---

# 8. Requirement traceability

| Change | Priority | Primary tickets | Sprint |
| --- | --- | --- | ---: |
| CL-01 App store links and QR | P1 | DIST-01 | 9 |
| CL-02 Web/mobile version parity | P1 | MOB-01, MOB-02, MOB-03 | 9 |
| CL-03 5 km search and plan priority | P1 | SRCH-01, SRCH-02 | 3 |
| CL-04 Three search modes | P1 | SRCH-03, SRCH-04, SRCH-05 | 3 |
| CL-05 Category background images and Insurance | P1 | CAT-01, CAT-02, CAT-03 | 4 |
| CL-06 Plan entitlements server-side | P0 | PLAN-01, PLAN-02–PLAN-07 | 1–2 |
| CL-07 Plan badge versus review rating | P1 | TRUST-01 | 5 |
| CL-08 Merchant ownership and genuine analytics | P0 | SEC-01, ENG-01 | 1, 5 |
| CL-09 Automatic leads | P1 | LEAD-01, LEAD-02 | 5 |
| CL-10 Daily offers/geographic notifications | P1 | OFFER-01 | 5 |
| CL-11 Image upload/compression | P1 | MEDIA-01, MEDIA-02, MEDIA-03 | 4 |
| CL-12 Home-delivery availability | P2 | DELIVERY-01 | 5 |
| CL-13 Social links/discount/business card | P2 | CARD-01 | 5 |
| CL-14 Jobs | P2 | JOB-01, JOB-02 | 6 |
| CL-15 Weekly draw | P2 | DRAW-01, DRAW-02 | 8 |
| CL-16 Customer–merchant chat | P2 | CHAT-01, CHAT-02 | 7 |
| CL-17 Business Club chat | P2 | CLUB-01, CLUB-02, PRIV-01 | 7 |
| CL-18 Booking | P2 | BOOK-01, BOOK-02 | 6 |
| CL-19 Delivery-provider integration | P2 | DELIV-02, DELIV-03 | 8 |
| CL-20 Compliant official bulk WhatsApp | P3 | WA-01 | 8 |
| CL-21 Onboarding/branding | P2 | BRAND-01, ONB-01 | 9 |
| CL-22 Nginx/broken links | P0 | REL-01, OPS-01 | 1 |
| CL-23 Genuine reviews only | P0 | REV-01 | 1 |
| CL-24 Responsive/error/loading/visual consistency | P1 | UX-01, UX-02, UX-03 | 10 |

# 9. Milestones and release gates

| Milestone | After sprint | Release meaning |
| --- | ---: | --- |
| M0 Verified baseline | 0 | Estimates and scope approved |
| M1 Secure foundation | 1 | P0 fixes eligible for controlled staging release |
| M2 Directory/discovery core | 4 | Plans, search, categories and media integrated |
| M3 Merchant engagement | 5 | Trust, leads, offers and identity ready |
| M4 Operational modules | 8 | Jobs, booking, chat, club, delivery and rewards gated and tested |
| M5 Mobile release candidate | 9 | Internal app candidate and install flow ready |
| M6 Production candidate | 10 | Full regression and rollback rehearsal complete |

# 10. Mandatory test suites

## API/security

- Authentication, refresh, logout, revocation and rate limits.
- Admin/merchant/customer role matrix for every protected controller.
- Merchant A versus Merchant B ownership tests for every merchant-owned entity.
- Plan boundary/concurrency/downgrade/expiry tests.
- Idempotency for uploads, messages, lead jobs, orders, provider webhooks and notification jobs.
- Audit-log before/after/reason/actor/entity verification.

## Data/integration

- Migration up/down or forward/rollback procedure in a production-like snapshot.
- Unique, foreign-key and frequently queried index verification.
- Search query plans and dashboard aggregate performance.
- Object-storage quarantine, scan, variant and deletion lifecycle.
- Redis/BullMQ retry, dead-letter and recovery tests.

## Web/Flutter

- Loading, empty, error, success and permission-denied states.
- Desktop, tablet, 360 px web and supported Android device matrix.
- Keyboard/focus/labels/live regions/contrast/reduced motion.
- Offline, slow network, retry and deep-link behavior.
- Shared API fixture/contract tests to detect web/mobile drift.

## Truth and finance safeguards

- No generated review or fake purchase claim.
- No synthetic analytics displayed as real activity.
- No frontend/provider-unverified payment, refund, delivery or message-delivery success.
- Manual records visibly retain source, actor, evidence and external reference.

# 11. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Preview D1 and production PostgreSQL drift | Inconsistent behavior | Contract fixtures and source-of-truth map in Sprint 0 |
| Existing features are assumed complete from docs | Hidden broken flow | Verify route → API → data → response before classification |
| Geodata quality/constituency ambiguity | Wrong reach and leads | D-03 and stable region IDs before Sprint 3 |
| Plan downgrade deletes content | Data loss | Non-destructive restriction policy and migration tests |
| Provider webhook retries duplicate state | Finance/delivery inconsistency | Durable idempotency and immutable status history |
| Chat/admin access violates privacy | Legal/security exposure | D-06, least privilege and audited escalation |
| Weekly draw/WhatsApp compliance | Legal/reputation risk | Disabled by default until approved configuration |
| Large scope exceeds assumed capacity | Schedule slip | Re-estimate after Sprint 0 and protect P0/P1 milestones |

# 12. Handoff checklist for the next developer

1. Read `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/SECURITY_AND_PRIVACY.md`, `docs/DESIGN_SYSTEM.md` and relevant sprint notes.
2. Complete Sprint 0 matrix before creating new models or endpoints.
3. Search for an existing equivalent route/service/model/component before every change.
4. Preserve unrelated working-tree changes and never commit `node_modules`, build output, secrets or local databases.
5. Use migrations and add indexes for new query patterns.
6. Keep authorization in API guards/services and derive ownership from authenticated context.
7. Add tests in the same change; capture manual QA evidence.
8. Update API docs, relevant operational docs and `CHANGELOG.md` after verified completion.
9. Run all clean-environment release gates before handoff.
10. Do not deploy, publish an APK/store build, send messages or call live payment/delivery providers without explicit authorization.
