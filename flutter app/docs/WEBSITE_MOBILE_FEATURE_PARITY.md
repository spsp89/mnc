# BNC website → Flutter parity audit

Last audited: 2026-08-15

## Scope and evidence

Flutter is the customer client. Business-owner authentication and management,
Business Club, pricing and administrator consoles remain intentionally
website-only. The authoritative mobile exposure is `lib/app/router.dart`; it
contains the customer shell and customer routes only.

`Live` means Flutter reads or mutates the same NestJS `/api/v1` domain as the
website. `Static` means customer policy/help content intentionally ships in the
client. Flutter never replaces a failed API request with bundled marketplace,
account, order, review, booking or notification records.

This audit compares customer routes and customer-visible actions, not merely
page names. The matching API calls are documented in `API_COVERAGE.md`, and the
mobile route graph is documented in `SCREEN_INVENTORY.md`.

## Audited customer parity matrix

| Website customer capability | Flutter destination | State and action coverage |
| --- | --- | --- |
| Home discovery and popular queries | `/home`, `/search` | Live categories, businesses, offers, appointment services, products, jobs and cities; popular queries open the matching live search |
| Business search | `/search`, `/businesses` | Live query, sorting, filters, list/map modes and honest empty/error states |
| Voice search | `/search` | Native English/Malayalam recognition, permission/errors, partial results, submit/stop |
| Search modes | `/search`, `/products`, `/services` | Businesses/products/services retain query, coordinates, city, constituency, district and state context |
| Advanced search filters | `/search` | Delivery, fast response, price, payment, language, experience, review/recency/price sorting |
| Search history | `/account/history` | Shared API record, dedupe, clear and complete query/filter/location replay |
| Nearby discovery | onboarding, `/locations`, discovery screens | City, constituency, district, state, radius, GPS and manually selected coordinates; no false city/coordinate combination; the API applies plan-aware listing reach |
| Categories and results | `/categories`, `/products?category=:slug`, `/category/:slug` | Live aggregate counts and product-first category navigation; the older mixed-result route remains supported |
| Business directory/profile | `/businesses`, `/business/:slug` | Live identity, media, category, location, hours, contact and social links |
| BNC membership benefits | business cards/profile | Real BNC star level, plan name and permanent-customer discount when supplied |
| Distance/availability truth | discovery/profile/compare | Missing distance stays absent; open/closed is derived only from explicit state or usable hours |
| Save/recent/share | `/saved`, business/product details, `/account/history` | Live save/unsave, recent views and public links |
| Compare businesses | `/compare` | Live selection of 2–3 and truthful hours/distance/reviews/response/price/experience/home-service/language rows |
| Trust actions | business profile and reviews | Live review, helpful, report, block/unblock and login-safe return paths |
| Secure BNC conversation | profile, product/service/offer/enquiry screens, `/messages/:id` | Creates/reopens the exact provider or enquiry conversation |
| Products | `/products`, `/product/:id`, `/products/:id` | Live query, category, availability and courier filters; recommended, best-selling, nearest, newest, price, name, category, location and status sorts; seller/location/distance, minimum quantity, plan-authorized delivery options and related items; home/courier delivery is advertised only when explicit; both detail path shapes resolve |
| Saved products | `/saved` → Products, product detail | Live |
| Services | `/services`, `/services/:id` | Live search/filter/detail, top-rated sorting, provider/location/distance and provider chat |
| Offers | `/offers`, `/offers/:city` | Live city-aware offers, provider location, copy code and provider chat |
| Cart/checkout | `/cart`, `/checkout` | Minimum quantities, seller validation and server-authoritative order/payment creation; website-style `/cart?add=:productId` loads the live product once |
| Orders | `/orders`, `/orders/:id` | Live list/detail, pickup/delivery timelines, cancellation, return and captured-payment invoice sharing |
| Direct and matched enquiries | `/enquiry`, `/enquiry/success`, `/account/enquiries`, `/account/enquiries/:id` | Live create/list/direct detail/responses/close and exact-conversation handoff |
| Conversations | `/messages`, `/messages/:id` | Live list, unread state, messages, send, mark read, archive, block and report |
| Jobs | `/jobs`, `/jobs/:id`, `/jobs/:id/apply` | Live text/type filtering, detail and public application |
| Application history | `/account/job-applications` | Live authenticated history |
| Appointments | `/bookings`, `/account/bookings` | Live relevant providers, slots, create, list, reschedule and cancel; `q` and `service` links preserve the intended appointment context |
| Phone OTP | `/login`, `/otp` | Live |
| Email registration/login | `/login`, `/email-verify` | Live |
| Customer profile/settings | `/account`, `/account/profile`, `/account/settings` | Live profile plus persistent language/city/radius preferences |
| Addresses | `/account/addresses` | Live add/edit/remove |
| Customer reviews | `/review/new`, `/account/reviews` | Live create/history/edit/delete |
| Notifications | `/notifications` | Live inbox, customer-safe navigation, mark one/all read, preferences and device registration |
| Privacy/account controls | `/account/privacy` | Live sessions, consent records, export request and deletion |
| Support and abuse | `/help`, `/contact`, `/report-abuse`, `/account/support` | Live anonymous/authenticated ticket submission and signed-in status history |
| Weekly/monthly/festival draws | `/weekly-draw` | Live draws, merchant-issued reward-ID claim, winners and audit information |
| Language | app settings | English and Malayalam |
| Policy/about content | `/about`, `/privacy`, `/terms`, `/refunds` | Static customer content |

## Website-only by product decision

These are not mobile gaps and must not be added unless product scope changes:

- `/admin/*`, including moderation, finance, verification, rankings, weekly
  draws, conversations, Business Club and audit logs;
- `/business/*` owner-management routes, `/business/add`, `/business/claim`,
  `/pricing` and `/business-club`; the public customer `/business/:slug`
  profile remains available in Flutter;
- `/app`, the website’s app-download/acquisition page;
- `/offline` and `/maintenance`, which are website/PWA delivery states;
- SEO city/category landing paths and the web-only `/ml` landing surface.

Website-local demo controls that do not persist through the shared API are not
parity authority. Flutter uses real API mutations instead of reproducing local
React-only fake saved/history/settings state.

Customer links generated with website path conventions are accepted where they
carry useful state: `/products/:id`, `/cart?add=:productId`,
`/bookings?q=...`, `/bookings?service=...`, `/account/bookings`,
`/account/messages` and `/account/enquiries/:id`. The Flutter-native singular
`/product/:id` route remains available for existing app navigation.

Old business-manager Dart files may remain for history, but they are unreachable
and unimported by the customer router. They are not supported mobile features.

## Shared-backend rule

Both clients share customer records only when both target the same deployed
`apps/api/` `/api/v1` prefix and PostgreSQL database. Flutter uses
`lib/core/data/app_repository.dart`; website Next.js handlers proxy or call the
same API. Merely living in one repository does not synchronize website-local
state.

Contracts added or expanded during this parity audit include:

- `GET /reviews/me` for customer review history;
- `GET/POST/DELETE /users/me/search-history` for cross-client history;
- authenticated `POST /leads/search-intents` for privacy-safe explicit search
  demand, deduplicated and delivered only to businesses entitled to lead alerts;
- optional-auth `POST /support/tickets` and authenticated
  `GET /support/tickets/me`;
- search responses containing plan name, BNC star level and permanent discount;
- precise coordinate, city, constituency, district and state search fields
  shared by website and Flutter;
- product directory category, availability, courier and website-equivalent sort
  parameters, including `best-selling`;
- aggregate category business/product/service counts used by customer discovery;
- plan-filtered product delivery options and public business description/social
  fields; Flutter does not synthesize hidden content;
- exact conversation creation from provider and enquiry actions.
- `POST /weekly-draws/entries/claim` for customer reward-ID claims.

## Verification gates

Before declaring a customer-parity build complete:

```bash
cd "flutter app"
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test --dart-define-from-file=config.live.json

cd ..
npm run -w apps/api prisma:generate
npm run -w apps/api prisma:validate
npm run -w apps/api build
npm run -w apps/api test
npm run typecheck
npm run build

cd "flutter app"
flutter build apk --debug --dart-define-from-file=config.live.json
```

The APK must then be signature-checked and hashed. Runtime installation is only
required when explicitly requested; use `adb install -r` and do not uninstall
first.
