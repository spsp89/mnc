# Sprint 6 QA and performance checklist

## Automated gates

- Prisma generation and validation; API build/Jest; web lint, type check, production build, and rendered HTML tests.
- Authentication: invalid credentials, revoked/expired access and refresh tokens, unauthenticated protected APIs, merchant denial from admin routes.
- Ownership: merchant A listing, offer, lead, enquiry, subscription, and media identifiers must fail for merchant B.
- CMS: upload type/size/checksum/owner checks; CTA pair and HTTPS/internal URL validation; invalid date range; active window and placement filtering; audit before/after snapshots.
- Offers: pending-by-default, edit returns to pending, approval/rejection reason and audit, rejected offer excluded from discovery and notification delivery, expiry exclusion.
- Payments: only verified/idempotent webhook transitions produce captured status; amount/currency mismatch fails; each transition adds status history.

## Manual flows

- Exercise every merchant page at desktop, tablet, and 360 px width; verify loading, empty, error, success, keyboard focus, and destructive confirmations.
- Exercise admin categories, locations, plans, featured listings, users, merchants, banners, reports, offers and audit log using least-privilege test roles.
- Confirm banner date boundaries in UTC and local display, image CDN availability, ordering, CTA behavior, and inactive exclusion.

## Performance review

- Dashboard endpoints use database aggregates rather than loading tables. Large merchant/listing/enquiry/user/subscription reads are paginated and indexed.
- Offer public reads are indexed on moderation/activity/date; banners are indexed on placement/activity/order and schedule; payment history is indexed by payment/status/source.
- Keep Prisma relation selections explicit, inspect slow-query logs for N+1 patterns, cap admin inventories still using 100-row compatibility views, and compress browser images before upload where the existing uploader supports it.
- Monitor duplicate dashboard calls, API p95, query duration, payload size, image transfer size, and BullMQ backlog after release.

## Superseding local verification note (2026-08-18)

- Prisma generation/validation, NestJS production build, ESLint, TypeScript, Vinext rendered/CSS contracts, and the optimized Next.js production build pass from the current Windows path.
- API unit/integration result: 35 suites and 212 tests passing.
- Web rendered/CSS contract result: 21 tests passing.
- Responsive Chromium result: 9/9 public, authenticated Admin, and authenticated Merchant cases passing at 1440×900, 1024×768, and 390×844. The probe rejects loading skeletons, overflow, escaped elements, an incorrectly positioned public hero backdrop, unreadable hero copy, and broken mobile dashboard navigation.
- Flutter 3.41.4 analysis reports no issues and all 68 customer-app tests pass using the repository's local verification command.
- No deployment, app-store submission, external provider write, or live payment action was performed. Production credentials, legal approvals, store listings, and physical-device acceptance remain explicit release gates.
