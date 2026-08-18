# BNC Workshop Change Log — Implementation Audit

**Date:** 17 August 2026  
**Scope:** CL-01–CL-24 from the Malayalam workshop change log  
**Repository:** Next.js/Vinext web, NestJS/Prisma/PostgreSQL API, Flutter customer app  
**Deployment:** Not performed. Production deployment still requires the documented release checklist and explicit authorization.

## മലയാളം സംഗ്രഹം

Workshop change log codebase-നോട് താരതമ്യം ചെയ്ത് പരിശോധിച്ചു. ഭൂരിഭാഗം core workflows repository-ൽ ഇതിനകം production-oriented implementation ആയി ഉണ്ട്. ഈ pass-ൽ കണ്ടെത്തിയ പ്രധാന P0 security gaps പരിഹരിച്ചു: logout/revocation കഴിഞ്ഞുള്ള stale access-token access, database role/status മാറ്റങ്ങൾ ഉടൻ പ്രാബല്യത്തിൽ വരാത്തത്, configured rate limiting പ്രവർത്തിക്കാത്തത്, invalid business-കളിലേക്ക് analytics event എഴുതാൻ കഴിയുന്നത് എന്നിവ. External provider credentials, app-store URLs, legal approval, and exhaustive device QA ആവശ്യമായ items `PARTIAL` ആയി തന്നെയാണ് രേഖപ്പെടുത്തിയിരിക്കുന്നത്.

## Status rules

- **COMPLETE:** Required repository implementation is present and supported by source/test evidence.
- **PARTIAL:** Core implementation exists, but an external credential, legal/product decision, production configuration, or final manual-device verification remains.
- **MISSING:** No usable implementation was found.
- **BROKEN:** An implementation exists but its verified primary workflow fails.

## Feature matrix

| ID | Requirement | Status | Verified implementation/evidence | Remaining work |
| --- | --- | --- | --- | --- |
| CL-01 | Mobile-app landing and QR/store links | PARTIAL | `/app` generates a canonical landing-page QR. Store controls now fail closed behind an explicit release switch; canonicalization rejects credentials, custom ports, fake domains and non-HTTPS URLs, strips tracking fragments, and requires both official listings plus a non-local HTTPS site origin. `npm run verify:mobile-release` provides a CI/release gate, while missing or invalid configuration remains non-clickable. | Supply both real published store URLs, enable the reviewed release switch, run the validator with production configuration, and verify both physical-device store handoffs. |
| CL-02 | Flutter release/version readiness | COMPLETE | Flutter customer app is versioned `1.1.0+2`; release notes and passing analyse/test gates are present. | Store submission is an operational release action, not a code gap. |
| CL-03 | Nearby search and plan reach | COMPLETE | `apps/api/src/modules/search/search.service.ts` uses PostGIS `ST_DWithin`; subscription plan reach fields and indexes are persisted. | Production query-plan/load monitoring remains an operations task. |
| CL-04 | Business/product/service search modes | COMPLETE | Public web navigation and typed API/search contracts expose businesses, products, and services separately. | Continue relevance tuning from genuine search telemetry. |
| CL-05 | Category artwork and Insurance | COMPLETE | Homepage renders full-card category backgrounds; rendered-HTML tests cover the category section and Insurance. | Content team may replace seeded artwork without a code change. |
| CL-06 | Six configurable plans and limits | COMPLETE | Six-plan migration, plan entities, `PlanEntitlementsService`, admin plan UI, and server-side limits exist. Product, offer, and gallery count-and-create operations use a transaction-scoped PostgreSQL advisory lock per business and recheck capacity after acquiring it. | None for the audited scope. |
| CL-07 | BNC plan-star badge | COMPLETE | Public business cards distinguish BNC plan stars from genuine review rating/count. | None. |
| CL-08 | Merchant ownership and genuine analytics | COMPLETE | Server-side ownership services/tests exist. This pass added live session/role enforcement and analytics target/deduplication checks. | None for the audited scope. |
| CL-09 | Enquiry/lead routing | COMPLETE | Lead matching, merchant assignment, consent-aware contact reveal, per-merchant pipeline state, and ownership tests exist. | Tune matching weights only from measured outcomes. |
| CL-10 | Offer notification distribution | COMPLETE | Approved/live offer delivery, target-customer isolation, notification processors, and moderation rules exist. | Real push/WhatsApp delivery still depends on configured providers. |
| CL-11 | Image upload/compression | COMPLETE | `lib/private-media-upload.ts` performs browser-side resizing/compression, thumbnail generation, signed upload, verification, and quarantine flow. | CDN/image-transform tuning may follow production measurements. |
| CL-12 | Home delivery and profile social links | COMPLETE | Product home-delivery state, delivery options, plan-gated social links, and backend validation are implemented. | None for the audited scope. |
| CL-13 | Permanent discount, contact card, UPI QR | COMPLETE | Business profile/domain and public detail UI expose persisted discount/contact/payment helpers without inventing transaction success. | Merchants must configure verified payment/contact data. |
| CL-14 | Jobs | COMPLETE | Job posting, discovery, applications, merchant management, status transitions, and tests are present. | None for the audited scope. |
| CL-15 | Weekly/monthly/festival draw | PARTIAL | Weekly draw models, customer/merchant/admin routes, eligibility records, deterministic evidence, and tests exist. Operational routes are now disabled by default; opening, issuing, claiming, selecting and publishing are impossible until `DRAW_FEATURE_ENABLED=true` and a legal/tax approval reference is configured. Public feeds return no campaigns while disabled, and reward-code hashing requires a dedicated strong secret with no application fallback. | Obtain formal legal/tax/product approval, record its reference in production secrets, and complete the approved campaign acceptance checklist before enablement. |
| CL-16 | Customer–merchant conversation | COMPLETE | Authenticated conversation/message routes, participants, attachments/status handling, and panel UI exist. | Production retention/moderation policy should remain documented. |
| CL-17 | Business Club | COMPLETE | Membership gating, chapters, events, referrals, messages, admin moderation, UI, and workflow tests exist. | Admin access to private content must continue to follow the approved privacy policy. |
| CL-18 | Booking | COMPLETE | Provider services/schedules, booking lifecycle, reminders, web UI, and tests exist; plan entitlements gate access. | Provider calendar integrations are optional future work. |
| CL-19 | Delivery workflow/provider integration | PARTIAL | Delivery availability, shipment lifecycle, proof/settlement models, manual/HTTP adapter paths, routes, and tests exist. Provider callbacks now require a raw-body HMAC signature plus durable unique event ID, persist processing outcomes in the webhook ledger, acknowledge duplicates, reject disabled/wrong providers, and prevent terminal-state regression. External-mode startup validation requires the complete HTTPS provider configuration. | Select and certify the live provider, provision production credentials/webhook secret, register its callback, and complete sandbox reconciliation certification. |
| CL-20 | WhatsApp automation | PARTIAL | A disabled-by-default official HTTP adapter now requires both a per-type WhatsApp preference and current scoped consent, uses only environment-allowlisted approved templates, enforces a daily frequency cap and three-attempt ceiling, records accepted/failure state, verifies callback raw-body HMAC plus unique event ID, persists callbacks in `WebhookEvent`, and converts STOP/unsubscribe callbacks into append-only consent withdrawal plus channel opt-out. No unofficial sender or fabricated delivery result exists. | Select the official provider, obtain template approvals, configure production credentials/callback, map the provider contract to the generic adapter, and complete provider sandbox plus legal/compliance QA. |
| CL-21 | Flutter splash/onboarding/branding | COMPLETE | Flutter assets, onboarding/splash flow, and automated widget/configuration tests are present. | Final physical-device visual acceptance remains a release task. |
| CL-22 | Broken admin menu/deep links | COMPLETE | `/admin/weekly-draw` exists and is server protected. Local browser verification showed redirect to `/admin/login?returnTo=%2Fadmin%2Fweekly-draw` on port 3001. | Keep route smoke checks in CI/release QA. |
| CL-23 | Review integrity/no fake AI reviews | COMPLETE | Verified-purchase evidence, one-review-per-order constraints, authenticated review submission, moderation, and regression tests exist. No AI review generator was found or added. | None; fabricated review generation remains prohibited. |
| CL-24 | CSS/responsive consistency | COMPLETE | Dependency-free Chromium QA verifies the public homepage and authenticated Admin/Merchant dashboards at 1440×900, 1024×768, and 390×844. Exact viewport, rendered-surface readiness, settled transitions, hero backdrop position/coverage, readable hero copy, overflow, visible-element bounds, mobile navigation, and dashboard-layout assertions pass; screenshots and JSON evidence are generated by `npm run test:responsive`. Mobile Admin copy/action-row, Merchant 520px flex-basis, public loading-skeleton false-positive, and public inline hero-backdrop defects found by the matrix were fixed. | Physical-device acceptance remains a release activity, not a repository implementation gap. |

**Summary:** 20 COMPLETE, 4 PARTIAL, 0 MISSING, 0 BROKEN.

## P0 changes implemented in this pass

### 1. Immediate session and role revocation

Files:

- `apps/api/src/common/auth/active-identity.service.ts`
- `apps/api/src/common/auth/jwt-auth.guard.ts`
- `apps/api/src/common/auth/optional-jwt-auth.guard.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/admin/admin.module.ts`

Behavior:

- Every protected access token contains a refresh-session ID (`sid`).
- Guards resolve the current active session, current active user, and current database role assignments.
- Revoked/expired sessions and suspended/deleted users receive 401 immediately.
- Removed roles cannot remain usable from a stale token claim.
- Legacy access tokens without `sid` are rejected; a still-valid refresh token can rotate into the current format.

Authorization rule: The API remains authoritative. Frontend redirects are usability controls only.

### 2. Effective rate limiting

Files:

- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts`
- `apps/api/src/modules/analytics/analytics.controller.ts`
- `apps/api/src/modules/payments/payments.controller.ts`

Behavior:

- The configured throttler is now installed as a global guard.
- Only the normal 100-request-per-minute policy is global. OTP and other sensitive authentication routes carry explicit endpoint limits, preventing the former five-request OTP quota from accidentally throttling every API route for 15 minutes.
- One trusted reverse proxy is configured for correct client IPs.
- Analytics ingestion has a stricter endpoint limit.
- Signed Razorpay webhook retries remain idempotent and are not discarded by the generic client throttle.

### 3. Analytics integrity

File: `apps/api/src/modules/analytics/analytics.service.ts`

Validation:

- Business engagement events require an existing active, published, non-deleted business.
- Supplied category IDs must reference an active category.
- Identical session/event/target/source retries inside five seconds return a deduplicated result instead of incrementing metrics.
- Search impressions remain valid without a business target.

### 4. Reliable quality gate

File: `eslint.config.mjs`

Generated workshop extraction artifacts are ignored by ESLint; maintained application source is still checked.

### 5. Concurrency-safe subscription limits

Files:

- `apps/api/src/common/subscriptions/plan-entitlements.service.ts`
- `apps/api/src/modules/products/products.service.ts`
- `apps/api/src/modules/offers/offers.service.ts`
- `apps/api/src/modules/businesses/businesses.service.ts`

Behavior:

- Product, public-offer, and business-gallery creates acquire one transaction-level PostgreSQL advisory lock keyed by business.
- The active subscription and current usage are re-read inside the locked transaction.
- The successful create commits in the same transaction as the final capacity decision.
- PostgreSQL automatically releases the lock on commit or rollback.
- Business category updates already replace the complete submitted set and validate its final size, so concurrent updates cannot accumulate categories beyond the submitted plan limit.

### 6. Safe mobile release destinations

Files:

- `app/app/page.tsx`
- `lib/mobile-app-release.mjs`
- `.env.example`
- `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- `tests/rendered-html.test.mjs`

Behavior:

- The QR targets the canonical BNC `/app` landing page instead of sending every scanner to whichever store variable happens to be listed first.
- Android links accept only `https://play.google.com/store/apps/details?id=...`.
- iOS links accept only an official `https://apps.apple.com/.../app/.../id...` listing.
- Invalid configured values are visible as configuration errors but never rendered as download links.
- Missing values retain the waitlist/release-pending experience.
- Official external store links open with `noopener noreferrer` protection.

### 7. Delivery-provider callback integrity

Files:

- `apps/api/src/modules/deliveries/deliveries.controller.ts`
- `apps/api/src/modules/deliveries/deliveries.service.ts`
- `apps/api/src/config/environment.ts`
- `apps/api/test/delivery-webhook.test.cjs`

Behavior:

- Provider callbacks sign the exact raw request body with HMAC-SHA256 in `x-bnc-delivery-signature` and supply a stable `x-bnc-delivery-event-id`.
- The API persists the authenticated callback before changing shipment/order state and uses the existing `(provider, eventId)` unique constraint for durable replay protection.
- Duplicate delivery callbacks are acknowledged without applying the state twice; processing failures remain visible as failed webhook-ledger records.
- Lifecycle callbacks move only forward through normalized shipment states. Delivered, cancelled, and failed shipments cannot be reopened by a delayed callback.
- Manual mode rejects provider callbacks, and an external provider must match the configured adapter.

## Tests added or updated

- `apps/api/test/active-identity.test.cjs`
- `apps/api/test/jwt-auth-guard.test.cjs`
- `apps/api/test/analytics-integrity.test.cjs`
- `apps/api/test/plan-entitlements.test.cjs`
- `apps/api/test/catalog-management.test.cjs`
- `apps/api/test/delivery-webhook.test.cjs`

Covered cases:

- missing session ID;
- revoked/expired refresh session;
- suspended/deleted user;
- live database role replacement;
- active/published analytics target;
- missing or unavailable target;
- duplicate analytics retry suppression.
- two simultaneous product creates at the final available slot yield one success and one conflict, never an over-limit count.
- official and fake mobile-store URL validation, canonical QR landing URL, and safe `/app` release-page rendering.
- deterministic production-Worker rendering across genuine-data and empty-data states, public entry routes, protected redirects, crawl controls, branded 404 handling, and cross-site mutation rejection.
- invalid delivery webhook signatures, transactional authenticated state advancement, duplicate event acknowledgement, and terminal-state regression suppression.

## Browser verification performed

Local URL: `http://127.0.0.1:3001`

- Public homepage loaded meaningful live/seeded content and genuine empty states without an error overlay.
- Category cards, Insurance, published businesses, scheduled banner, appointment content, and weekly-draw content were visible in the DOM.
- `/admin/login` rendered the secure administrator form.
- `/merchant/login` rendered the merchant form.
- Anonymous `/admin/weekly-draw` access redirected to the admin login and preserved the return path on the same port.
- Automated Chromium checks passed for public, authenticated Admin, and authenticated Merchant surfaces at desktop (1440×900), tablet (1024×768), and mobile (390×844).
- The responsive probe verified genuine rendered surfaces with no lingering loading skeleton, a full-size absolutely positioned public hero backdrop, readable settled hero copy, no document-level horizontal overflow, no uncontained visible element escaping the viewport, off-canvas mobile sidebars, visible mobile menu controls, and bounded dashboard hero structure.
- Exact screenshots and the machine-readable report are generated under `artifacts/responsive-qa/automated/` and can be regenerated with `npm run test:responsive` while the local web/API stack is running.

## Database changes

No migration was required by this pass. Existing tables and indexes were reused, especially `RefreshSession`, `User`, `GlobalRoleAssignment`, `Business`, `Category`, and `AnalyticsEvent`.

## Remaining release blockers and external dependencies

1. **P1 configuration:** provide Android/iOS store URLs and verify production app deep links (CL-01).
2. **P1 governance:** approve draw legal/tax/eligibility rules before enabling production draws (CL-15).
3. **P1 integration:** select/configure the production delivery provider and reconcile webhooks/settlements (CL-19).
4. **P1 compliance/integration:** configure an official WhatsApp provider, templates, consent evidence, opt-out, and signed callbacks (CL-20).
5. **Release QA:** run the existing physical Flutter-device smoke test before store submission (CL-21); repository-level responsive browser QA for CL-24 is complete.

## Exact verification commands

```powershell
npm run typecheck
npm run lint
npm run prisma:validate
npm run api:build
npm run api:test
npm run build
npm run test:responsive
Set-Location 'flutter app'
flutter analyze
flutter test
```

## Verification results

| Gate | Result |
| --- | --- |
| TypeScript (`npm run typecheck`) | PASS |
| ESLint (`npm run lint`) | PASS |
| Prisma schema (`npm run prisma:validate`) | PASS |
| NestJS production build (`npm run api:build`) | PASS |
| API unit/integration tests (`npm run api:test`) | PASS — 35 suites, 212 tests |
| Web production build (`npm run build`) | PASS |
| Web production render/CSS contracts (`npm test`) | PASS — 21 tests |
| Responsive Chromium matrix (`npm run test:responsive`) | PASS — 9/9 public/Admin/Merchant viewport cases |
| Flutter static analysis (`flutter analyze`) | PASS — no issues |
| Flutter tests (`flutter test`) | PASS — 68 tests |

Production deployment must only proceed after environment validation, database backup, migration rehearsal, provider-secret verification, smoke testing, and explicit deployment authorization.
