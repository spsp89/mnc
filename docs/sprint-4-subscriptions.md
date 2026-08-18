# Sprint 4 — Subscription operations

## Database

Migration: `apps/api/prisma/migrations/20260815220000_subscription_renewal_management/migration.sql`

- `SubscriptionPlan.offerLimit` makes offer capacity configurable. No separate listing-count limit is stored because the existing domain attaches one subscription to one business listing.
- `SubscriptionPlan.displayOrder` controls comparison-page order independently from the existing marketplace `priority` weight.
- `BusinessSubscription.autoRenew`, `renewalStatus`, `lastRenewedAt`, `source`, and `assignedById` preserve renewal and assignment provenance.
- `PaymentStatus.CANCELLED` completes the normalized pending/paid/failed/refunded/cancelled workflow.
- `BusinessSubscription(renewalStatus, currentPeriodEnd)` supports scheduled expiry/renewal processing.

## API contracts

Merchant/customer billing:

- `GET /subscriptions/plans` — active plans, display order, prices, limits, and features.
- `GET /subscriptions/current?businessId=...` — authorized subscriptions, usage, renewal data, and normalized payment state.
- `POST /subscriptions` — creates a free activation or paid `PENDING_PAYMENT` checkout target.
- `POST /subscriptions/:id/cancel` — disables renewal; active access continues through period end.
- `POST /payments/checkout` — prepares provider checkout only when Razorpay is configured.
- `POST /payments/webhooks/razorpay` — existing signed, idempotent provider-confirmation boundary.

Administration:

- `GET|POST /admin/subscription-plans`
- `PATCH /admin/subscription-plans/:id`
- `POST /admin/subscription-plans/reorder`
- `GET|POST /admin/subscriptions`
- `PATCH /admin/subscriptions/:id`

There is deliberately no API that accepts a frontend request to set a payment to paid. Admin grants and extensions update entitlement provenance and the audit log, not payment status.

The current Razorpay integration uses one-time orders, not provider-managed recurring subscriptions. Renewal is therefore an explicit merchant checkout; `autoRenew` remains false until a validated recurring-provider contract is introduced.

## Authorization and validation

- Merchant reads and writes resolve business access from the authenticated user and require `business:billing:manage`.
- Plan reads require `SUPER_ADMIN` or `FINANCE`; plan configuration requires `SUPER_ADMIN`.
- Admin subscription reads and mutations require `SUPER_ADMIN` or `FINANCE`.
- DTO validation bounds prices, quotas, durations, feature lists, identifiers, and mandatory audit reasons.
- Plan assignment/change is rejected when current product, media, category, or offer usage exceeds the target plan.
- Offer creation checks the active plan on the backend before writing.
- Deactivating a plan removes it from new selection but does not revoke already-paid access before the subscriber's period end.

## Manual QA

1. Apply migrations and regenerate Prisma Client.
2. Log in as a merchant with `business:billing:manage`; open `/merchant/subscription` and verify the six plans are loaded from the API.
3. Select a paid plan with Razorpay keys absent and verify checkout returns a service-unavailable error without activating the plan or creating a success response.
4. With sandbox Razorpay configured, complete checkout and verify the subscription remains pending until the signed capture webhook is processed.
5. Cancel an active renewal and verify access remains active through its period end while `autoRenew=false` and renewal state is cancelled.
6. Log in as `SUPER_ADMIN`; create/edit/deactivate/reorder a plan at `/admin/plans` and verify an audit entry exists for every mutation.
7. At `/admin/subscriptions`, search/filter records, assign an admin grant, change its plan, extend it, and cancel/reactivate it. Verify payment status never changes as a side effect.
8. Attempt to assign a plan below current usage and verify the API returns HTTP 409.
9. Attempt to create more offers than the configured limit and verify the API returns HTTP 409.
10. Log in as a merchant and request `/admin/subscriptions`; verify the API returns HTTP 403.

## Mobile scope

The existing Flutter README and router intentionally define the shipped mobile app as customer-only; merchant and admin workspaces open on the protected website. Its repository layer already consumes the dynamic subscription APIs, so no alternate mobile billing domain or unsafe payment-success callback was added.
