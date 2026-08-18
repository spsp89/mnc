# Customer mobile API coverage

Last audited: 2026-08-15

All paths are relative to `/api/v1`. Flutter normalizes `{ data, meta }`
responses through `ApiClient` and has no local-record fallback.

| Customer domain | Endpoint coverage used by Flutter |
| --- | --- |
| Phone authentication/session | `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/refresh`, `POST /auth/logout` |
| Email authentication | `POST /auth/email/register`, `POST /auth/email/verify`, `POST /auth/email/login` |
| Profile | `GET/PATCH/DELETE /users/me` |
| Search | `GET /search/businesses`, authenticated `POST /leads/search-intents` for submitted search demand |
| Categories | `GET /categories`; Flutter consumes aggregate business/product/service counts and opens product-first category results |
| Public business | `GET /businesses`, `GET /businesses/:slug` |
| Products | `GET /products`, `GET /products/:id`; directory requests support query, category, availability, courier, all website sort options, coordinates, city, constituency, district and state |
| Services | `GET /services`, `GET /services/:id`; directory requests support query, top-rated sorting, coordinates, city, constituency, district and state |
| Offers | `GET /offers`, `GET /offers/:id` |
| Saved businesses | `GET /users/me/saved-businesses`, `POST/DELETE /users/me/saved-businesses/:businessId` |
| Saved products | `GET /users/me/saved-products`, `POST/DELETE /users/me/saved-products/:productId` |
| Recent profiles | `GET/POST /users/me/recent-businesses`, `DELETE /users/me/recent-businesses/:businessId` |
| Search history | `GET/POST/DELETE /users/me/search-history` |
| Addresses | `GET/POST /users/me/addresses`, `PATCH/DELETE /users/me/addresses/:id` |
| Blocking | `GET /users/me/blocked-businesses`, `POST/DELETE /users/me/blocked-businesses/:businessId` |
| Enquiries | `POST /enquiries`, `GET /enquiries/me`, `POST /enquiries/:id/close` |
| Conversations | `GET/POST /conversations`; messages, send, read and archive under `/conversations/:id` |
| Jobs | `GET /jobs`, `GET /jobs/:id`, `POST /jobs/:id/applications`, `GET /jobs/applications/me` |
| Booking discovery | `GET /booking-availability/providers`, `GET /booking-availability/slots` |
| Customer bookings | `GET /bookings/mine`, `POST /bookings`, `POST /bookings/:id/reschedule`, `POST /bookings/:id/cancel` |
| Rewards and draws | `GET /weekly-draws`, `GET /weekly-draws/entries/me`, `POST /weekly-draws/entries/claim` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `GET/PUT /notifications/preferences`, `POST/DELETE /notifications/devices` |
| Reviews | `POST /reviews`, `GET /reviews/me`, `PATCH/DELETE /reviews/:id`, `GET /reviews/business/:businessId`, helpful/report actions |
| Orders | `POST /orders`, `GET /orders/me`, `GET /orders/:id`, `POST /orders/:id/cancel`, `POST /orders/:id/return` |
| Checkout/payments | `POST /payments/checkout`, `GET /payments/me`; signed server webhook remains payment truth |
| Locations | `GET /locations/cities` |
| Customer support | optional-auth `POST /support/tickets`, authenticated `GET /support/tickets/me` |
| Privacy | `GET /users/me/sessions`, `GET /users/me/consents`, `GET /users/me/export`, account deletion under `/users/me` |
| Analytics events | `POST /analytics/events` |

## Contracts added or expanded by the parity audit

### Customer review history

`GET /reviews/me` returns the authenticated customer’s non-deleted reviews with
business identity, moderation status, helpful count and owner reply. It enables
live review history and customer-owned edit/delete operations.

### Cross-client search history

`POST /users/me/search-history` records an explicit authenticated website or
Flutter search. The server normalizes the query and updates a matching search
from the same customer within ten minutes. Flutter stores mode, sort, filters,
city, coordinates and radius so a record can replay the original context.
Debounced intermediate text does not create history entries.

### Privacy-safe search demand

After an authenticated customer explicitly submits a business search, Flutter
also calls `POST /leads/search-intents` with the normalized search and location
context. The API deduplicates the intent and exposes it only to businesses whose
plan enables automatic lead alerts. This records demand, not customer contact
details, and failed intent recording does not falsify the search result.

### Anonymous and authenticated support

`POST /support/tickets` accepts optional authentication. Guest tickets retain a
reply email in metadata; authenticated tickets retain the customer link.
`GET /support/tickets/me` is authenticated and feeds `/account/support`, where
the customer can see ticket numbers, subjects, statuses and update dates. The
nullable-user schema migration must be applied before the deployed API can
accept anonymous tickets.

### Membership, listing reach and public content

Business search responses expose `planName`, `bncStarLevel`,
`permanentDiscountPercent` and `permanentDiscountLabel` when present.
`distanceKm` is nullable; Flutter must not convert a missing distance into
`0.0 km`.

Business, product and service discovery accepts `constituency`, `district` and
`state` alongside city/coordinates so the server can enforce each plan's
geographic listing reach. Product `deliveryOptions` are plan-filtered by the
API; Flutter shows home delivery only for an explicit delivery mode and keeps
pickup-only checkout honest. Public descriptions and social links may be absent
because of plan entitlements, so the app omits them instead of inventing copy.

The product directory also passes `category`, `status`, `courier` and the same
sort vocabulary as the website, including `best-selling`. Category cards open
that server-filtered product directory directly. Courier and home-delivery
badges are derived from explicit API fields/options; a null delivery value is
not converted into a delivery capability.

## Deliberate website-only contracts

Every business-owner and administrator endpoint remains website-only. Flutter
exposes no merchant dashboard, catalogue management, lead workspace, Business
Club, pricing, platform moderation, finance or global-account controls.

## Provider boundaries

- Firebase/APNs native files and server credentials are deployment inputs.
- Razorpay keys and signed server webhooks are deployment inputs.
- SMS/email delivery requires configured provider workers.
- Private media requires deployed storage/upload/scanning providers.
- Release Android and iOS builds require HTTPS and production signing.
