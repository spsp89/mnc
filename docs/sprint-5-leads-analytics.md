# Sprint 5 — Leads, enquiries, users, and analytics

## Database changes

Migration: `apps/api/prisma/migrations/20260815230000_merchant_enquiry_pipeline/migration.sql`

- Adds a per-business `MerchantEnquiryState` instead of overloading the customer-facing `Enquiry.status`.
- Adds `NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `CLOSED`, and `SPAM` pipeline states.
- Adds indexes for merchant pipeline filters, merchant joining dates, currently active offers, and subscription distribution.

## APIs

Merchant enquiries:

- `GET /enquiries/business?businessId=&q=&status=&from=&to=&page=&pageSize=`
- `GET /enquiries/business/:id?businessId=`
- `PATCH /enquiries/business/:id/status`
- Existing `POST /leads/:assignmentId/accept` reveals contact only after ownership and credit validation.

Merchant dashboard:

- `GET /analytics/business/dashboard?businessId=` uses database `count`, `groupBy`, and targeted subscription queries.
- Recorded metrics are limited to existing `PROFILE_VIEW`, `CALL_CLICK`, and `WHATSAPP_CLICK` events.

Administration:

- `GET /admin/users`
- `GET /admin/users/:id`
- `PATCH /admin/users/:id/status`
- `GET /admin/merchants` supports status, plan, location, joining-date, search, and pagination filters.
- `GET /admin/reports/summary?from=&to=` returns aggregate KPIs and subscription distribution.

## Authorization

- Enquiry list/detail/status operations require `business:leads:manage` for the selected listing.
- Direct ownership or a non-declined/non-expired lead assignment is rechecked inside every enquiry operation.
- Matched contact information is decrypted only for an accepted assignment.
- User reads require an allowed administrative/support role; account status mutation requires `SUPER_ADMIN` or `STATE_ADMIN` and a mandatory audit reason.
- Reports require `SUPER_ADMIN` or `STATE_ADMIN`.

## Manual QA

1. Apply migrations and regenerate Prisma Client.
2. Create a direct enquiry for merchant A, then verify it appears under merchant A and returns 404 for merchant B.
3. Create a quote request matched to merchants A and B. Change A's pipeline status and verify B still sees `NEW`.
4. Open an unaccepted matched enquiry and verify contact is absent. Accept the assignment and verify consent-scoped contact becomes available.
5. Test enquiry search, status, listing, date, and pagination filters.
6. Verify `/merchant/dashboard` counts listings, active offers, leads, current plan, and expiry from the aggregate endpoint.
7. Trigger recorded profile, call, and WhatsApp events and verify only those persisted counts change. Confirm no offer-view metric is shown.
8. Search and open users at `/admin/users`; activate or suspend one and verify a hash-chained audit entry exists.
9. Filter `/admin/merchants` by each status, plan, location, and joining-date combination.
10. Compare `/admin/reports` KPIs with direct database count queries for the same date range.
11. Request merchant enquiry and dashboard APIs with another merchant's business ID and verify HTTP 403/404 without data disclosure.
