# BNC API guide

## Contract

The NestJS application exposes URI-versioned REST endpoints under `/api/v1`. Successful collection responses use `{ data, meta }`; successful mutations use `{ data }`. Errors use the global exception filter and include a request ID for support correlation. Request DTOs are transformed, allowlisted and rejected when unknown fields are supplied.

Interactive OpenAPI documentation is mounted at `/api/docs`.

## Modules

| Module | Representative routes |
| --- | --- |
| Authentication | mobile OTP, verified email/password, Google OIDC, refresh rotation and logout |
| Users | `GET/PATCH /users/me`, saved businesses/products, addresses, recent profiles, blocks, consent, sessions, export and deletion |
| Search and locations | `GET /search/businesses`, `/locations/suggestions`, `/locations/cities` |
| Businesses | public list/profile plus protected owner create/update/manage operations and `GET /businesses/mine` |
| Categories | hierarchical category tree |
| Products and services | paginated public lists/details and owner CRUD |
| Enquiries and leads | consented request submission, customer/business tracking, matching and accept/decline |
| Reviews | create with media, list, edit history, soft delete, one-user helpful vote, reporting and owner reply |
| Conversations | enquiry-scoped conversations, paginated messages, read receipts and archive state |
| Offers | active public offers and protected business management |
| Orders | create, customer/business lists, detail, status transitions, cancellation and return request |
| Payments | idempotent Razorpay order creation, payment history and signed webhook intake |
| Subscriptions | plan list, create, cancellation and pending payment state |
| Notifications | list, SSE stream, read state and per-category/channel preferences |
| Analytics | event collection plus business and platform summaries |
| Verification | owner request, private evidence reference and privileged decision |
| Admin | scoped directory operations, ranking versions and audit-log-backed decisions |

## Authentication

Access tokens are short lived. Refresh tokens rotate; a token presented after its stored session was revoked is treated as possible reuse and revokes the remaining active sessions. Future mobile clients receive the same token contract. The hosted web account uses the hosting platform’s server-validated identity handoff for private pages.

Role guards protect admin actions. Business mutations additionally prove ownership or an active team membership. Public profile status never authorizes a write.

## Idempotency and concurrency

- Payment checkout requires a unique `idempotencyKey`.
- Razorpay webhook event IDs are persisted before BullMQ delivery.
- Order totals use database prices, not browser totals.
- Stock decrements occur in the same transaction as order creation.
- Coupon redemption increments are conditional and transactional.
- Lead acceptance atomically checks quota and assignment status before revealing decrypted contact data.
- Duplicate contact submissions use non-reversible fingerprints and time windows.

## Pagination

List endpoints accept bounded `page` and `pageSize` values. Search also accepts
radius, location, sort, rating, open-now, verified, premium, offer and
home-service filters. Clients must consume the returned `meta` object instead
of inferring totals from a page length.

## Provider adapters

OTP delivery, email, SMS, WhatsApp and push are queued for provider-specific consumers. Razorpay is called only from the server; signed raw-body webhooks are persisted and processed asynchronously. Media upload production adapters must issue short-lived object-storage upload URLs and promote only files that pass type, size and malware checks.
