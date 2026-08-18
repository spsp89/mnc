# BNC Flutter app — durable project handoff

Last updated: 2026-08-15

This is the primary cross-chat handoff file for the BNC mobile application.
Read it before changing, testing, building, or handing off the Flutter app.

## Quick reference

| Item | Current value |
| --- | --- |
| Workspace | `/Volumes/SSD/Documents/bnc demo 3` |
| Flutter project | `flutter app/` |
| Dart package | `bnc_mobile` |
| App version | `1.1.0+2` |
| Android application ID | `in.bnc.bnc_mobile` |
| Android SDK levels | min 24; compile/target 36 with the current Flutter toolchain |
| iOS bundle ID | `in.bnc.bncMobile` |
| Minimum iOS version | 15.0 |
| Product scope | Customer-only mobile app; business-owner and administrator features remain website-only |
| Data mode | Live API only; no bundled marketplace/account fallback |
| Main backend | NestJS in `apps/api/` |
| State/navigation/network | Riverpod / GoRouter / Dio |
| Languages | English and Malayalam |
| Last verified Flutter checkpoint | 2026-08-17 analysis clean; all 68 tests pass with compiler temp redirected to `D:\BNC-local\flutter-temp` |
| Last verified API checkpoint | 2026-08-15 NestJS build clean and focused catalogue/discovery/DTO run: 3 suites / 21 tests passing |
| Last verified website checkpoint | 2026-08-15 workspace typecheck clean; latest full website build checkpoint remains 2026-08-14 |
| Current working tree | 2026-08-15 customer feature sync complete in source; no new APK was produced in the managed sandbox |

Flutter exposes customer authentication and customer workflows only.
Business-owner login, business management, Business Club, pricing and the
administrator console remain website-only. Do not add them to Flutter unless
the product scope is explicitly changed.

## Current handoff status

### 2026-08-17 Windows test-runner fix

The apparent test-loading stall was reproduced and traced to the default
Windows temporary directory running out of disk space while Dart wrote
`flutter_test_compiler` output. It was not an application loading, routing, or
network defect. The root command below scopes `TEMP` and `TMP` to the spacious
local BNC runtime directory, then resolves packages, analyzes the project, and
runs the complete suite:

```powershell
npm run flutter:verify:local
```

Verified result on Flutter 3.41.4 / Dart 3.11.1:

```text
flutter analyze
No issues found.

flutter test --dart-define-from-file=config.local.json --reporter expanded
All 68 tests passed.
```

The process-scoped temporary-directory override does not change the Windows
user or system temporary-directory configuration.

The customer website-to-Flutter feature audit was rechecked against the current
worktree on 2026-08-15. The latest website product/category discovery contracts,
sorts and delivery states were synced into Flutter. Business-owner and
administrator authentication/workspaces stay on the website and remain absent
from the customer router.

The 2026-08-15 incremental verification result is:

```text
dart format --output=none --set-exit-if-changed lib test integration_test
Formatted 60 files (0 changed).

flutter analyze
No issues found.

npm run typecheck
Completed successfully.

npm run build --workspace @bnc/api
Completed successfully.

npx jest --runInBand apps/api/test/local-discovery.test.cjs \
  apps/api/test/catalog-management.test.cjs \
  apps/api/test/query-dto-transform.test.cjs
3 suites passed; 21 tests passed.
```

Those 2026-08-15 managed-environment restrictions are now superseded by the
2026-08-17 local Windows verification. Redirecting compiler temporary output
and Gradle caches to drive D resolved the system-drive space failure:

```text
flutter analyze
No issues found.

flutter test --dart-define-from-file=config.local.json
68 tests passed.

flutter build apk --debug --dart-define-from-file=config.local.json
Built build\app\outputs\flutter-apk\app-debug.apk.
```

The repository retains this complete known-good checkpoint from 2026-08-14:

```text
dart format --output=none --set-exit-if-changed lib test integration_test
Formatted 60 files (0 changed after formatting).

flutter analyze
No issues found.

flutter test --dart-define-from-file=config.live.json
All 64 tests passed.

npm run -w apps/api prisma:generate
npm run -w apps/api prisma:validate
Completed successfully; Prisma schema is valid.

npm run -w apps/api build
Completed successfully.

npm run -w apps/api test
20 test suites passed; 84 tests passed.

npm run lint
npm run typecheck
npm run build
Completed successfully.

node --test tests/rendered-html.test.mjs
All 14 tests passed.
```

The verified customer-parity implementation includes:

- product-first category cards that open the live product directory with the
  selected API category filter;
- live product category, availability and courier controls plus every website
  sort option, including best-selling, nearest, newest, price, name, category,
  location and status;
- website-compatible product filter deep links that preserve query and Kerala
  city/constituency/district/state/coordinate context;
- best-seller product and top-rated service discovery from the shared API;
- aggregate category product/service/business counts and the expanded category
  set, including insurance;
- separate truthful courier and home-delivery presentation, with null delivery
  data treated as no declared delivery capability;
- customer-only notification filtering and removal of owner lead/enquiry
  preferences;
- removal of mobile business-owner login/workspaces, Business Club and
  `/pricing`; all authenticated roles land on the customer `/home` route;
- constituency, district and state context carried through business, product
  and service discovery so the server can apply plan-aware listing reach;
- authenticated explicit business searches recorded through the privacy-safe
  search-intent contract, with the server responsible for deduplication and
  entitled automatic lead alerts;
- product home-delivery labels and delivery checkout enabled only when the API
  explicitly returns a delivery mode; pickup-only products stay pickup-only;
- public business descriptions and social links omitted cleanly when the API
  hides them for plan entitlements;
- direct `/account/enquiries/:id` links with live status, responses, close and
  exact-conversation handoff;
- persistent customer language, city and search-radius settings;
- correct location semantics for known cities, unknown cities and precise
  device/map coordinates, so `Current area` is never sent as a false city
  filter;
- location-aware business, product, service, offer, booking and comparison
  discovery;
- live appointment-service and local-job discovery sections on Home, with no
  bundled fallback records;
- booking links preserve an initial query or selected service, and the
  website-compatible `/account/bookings` alias opens My bookings;
- website-compatible `/products/:id`, `/cart?add=:productId` and
  `/account/messages` paths, while keeping existing Flutter-native routes;
- an exact-coordinate picker and reusable current-location action on the
  locations screen;
- search sorting by review count and recency;
- real advanced business-search filters for delivery, fast response, price
  range, payment method, language and minimum years in business, plus
  low-to-high and high-to-low price sorting;
- live search-mode switching between businesses, products and services, with
  query, location and radius carried into the selected directory;
- native English/Malayalam voice search with microphone-permission handling,
  locale selection, partial recognition results, stop/cancel behavior and
  authenticated search-history recording for submitted voice queries;
- job search and employment-type filtering, richer job details and public job
  applications that do not unnecessarily require a customer login;
- business website/social links and similar-business discovery;
- login-safe save, review, helpful, report and chat actions;
- pickup-aware order timelines;
- a public customer-support form that can create either an anonymous ticket
  with reply-email metadata or an authenticated ticket, plus an authenticated
  `/account/support` history screen with live ticket status;
- searchable customer product, service and offer directories, with category or
  home-service filtering and honest no-result states;
- searchable appointment-service discovery filtered toward genuinely
  bookable health, beauty and appointment categories;
- product and service cards with real provider/seller location and distance;
- product minimum-order and delivery-option presentation, minimum-quantity
  enforcement in the cart and checkout blocking for items without a real
  seller;
- truthful comparison rows for hours, experience, home service and languages;
- truthful business availability derived from explicit API state or published
  working hours instead of a made-up open/closed default;
- business and product seller phone actions only when a real phone number is
  returned by the API;
- product seller calls and support/login flows that preserve the exact
  customer return destination;
- authenticated search-history recording shared by the website and Flutter,
  with complete filter/location replay and short-window duplicate suppression;
- exact authentication protection for the customer `/saved`, `/messages` and
  `/account` tabs as well as their nested routes;
- secure conversation creation from direct enquiry success/history screens;
- offer cards with provider location and an authenticated BNC-chat action;
- business membership presentation using the API’s real BNC star level, plan
  name and permanent-customer-discount fields;
- truthful nullable-distance handling: a business with no calculated distance
  no longer appears as `0.0 km`;
- normalized search-result parsing for flat category names and numeric price
  ranges.

The 2026-08-14 items are covered by that complete checkpoint and its APK. The
2026-08-15 incremental additions are format/analyze and focused API verified,
but are not included in the older APK described below.

Earlier focused checks retained for diagnostic history:

```text
flutter analyze
No issues found.

npm run -w apps/api build
Completed successfully.

node --test apps/api/test/support.test.cjs
3 support-ticket tests passed.

Prisma client generation and schema validation
Passed with a local non-secret placeholder database URL.

Focused API search DTO and discovery tests
7 tests passed.

Focused Flutter model, storage, routing and live-screen tests
Passed after fixing the jobs empty-state height.

Later focused Flutter location/catalogue/booking regression run
31 tests passed.

Focused Flutter advanced-search model and navigation tests
21 tests passed.

Focused Flutter public job-application navigation tests
6 tests passed.

Focused API search-history tests
3 tests passed.

Focused Flutter cross-client search-history model tests
17 model tests passed at that point in the working sequence.

Focused Flutter customer-scope and voice-search checks
22 tests passed after native voice-search integration; flutter analyze clean.

Focused Flutter membership, discount and nullable-distance model checks
22 tests passed; flutter analyze clean.

Focused API local-discovery checks
4 tests passed after exposing plan, BNC star and permanent-discount fields;
NestJS build clean.
```

These focused checks identify the areas exercised during development. The full
Flutter, API and website suites above supersede them as the current handoff
checkpoint.

The current-source local Android debug APK built on 2026-08-17 exists at:

```text
flutter app/build/app/outputs/flutter-apk/app-debug.apk
```

Current artifact facts:

- built: 2026-08-17 21:46:48 IST;
- size: 173,102,746 bytes;
- SHA-256:
  `61C26D5D2AC10846008200FFCB2DEFAB9F876353FC4BB3B6C8F9D76CCDA25BB4`;
- configuration: local Android emulator API and website aliases;
- package/version: `in.bnc.bnc_mobile`, `1.1.0+2`;
- minimum/compile/target SDK: 24 / 36 / 36;
- launch activity: `in.bnc.bnc_mobile.MainActivity`;
- signing: Android debug certificate; APK Signature Scheme v2 verified;
- ZIP alignment: verified;
- intended use: local development/testing, not store release;
- device installation and end-to-end runtime flows remain unverified.

The prior 2026-08-14 handoff APK remains at:

```text
flutter app/releases/BNC-live-current.apk
```

Artifact facts:

- built and copied to the handoff path: 2026-08-14 14:01:21 IST;
- size: 168,464,434 bytes;
- SHA-256:
  `88db06445a2295637615b892aa84acd7ad77334ba6609f14fcf34358e0fba4dd`;
- configuration: shared live-test API;
- package/version: `in.bnc.bnc_mobile`, `1.1.0+2`;
- compile/target SDK: 36;
- signing: Android debug certificate; APK Signature Scheme v2 verified;
- ZIP alignment: verified;
- expected voice-search `RECORD_AUDIO` permission: present;
- temporary authentication: every requested phone challenge uses `123456`
  when the shared API test flag is enabled;
- intended use: development/testing, not store release.
- important: this artifact predates the 2026-08-15 product/category sync and
  must not be presented as a build of the current source.

The preceding APK was preserved at:

```text
flutter app/releases/archive/BNC-live-before-website-sync-20260814-140040.apk
```

The repository currently has many uncommitted website, API and Flutter changes.
They are active project work, not disposable build output. Future chats must
inspect `git status`, preserve unrelated edits and avoid reset/checkout cleanup
commands.

## Product scope

Flutter is the customer client for discovering and transacting with local BNC
businesses. Its primary bottom navigation is:

- Home
- Explore/Search
- Saved
- Messages
- Account

Flutter intentionally excludes:

- business-owner login and owner mode;
- business dashboard and profile management;
- owner catalogue, leads, referrals, jobs, applicants and offers management;
- owner orders, bookings, deliveries, payments and analytics;
- owner team and Business Club workspaces;
- administrator login, moderation, finance, verification, ranking and audit
  consoles.

Those capabilities remain available through the protected website. Some old
owner-oriented Dart source files still exist under
`lib/features/business_manager/`, but they are not imported or routed by the
customer router. Treat them as unreachable legacy code, not mobile features.
The business-plan `/pricing` route and owner lead/enquiry notification
preferences are not exposed by the customer router/UI.

### Customer-parity audit decision

The latest route/action audit found that the meaningful website customer
workflows now have Flutter equivalents:

- discovery, text/voice search, filters, sorting, map/list presentation,
  coordinates, city/radius selection and cross-client search history;
- categories, business profiles, BNC star/plan/permanent discount,
  availability, contact/social links, save/share/compare/review/report/block
  and secure BNC chat;
- products, services, offers, seller/provider navigation, cart, checkout and
  customer orders;
- direct enquiries, matched responses and exact-conversation handoff;
- public jobs/applications and signed-in application history;
- appointment discovery, availability, booking, rescheduling and cancellation;
- saved items, notifications, messages, reviews, addresses, privacy controls,
  support tickets, weekly draws, localization and account management.

The following website areas are intentionally not Flutter gaps:

- `/business/*`, `/admin/*`, `/business/add`, `/business/claim` and
  `/pricing`, because they are owner/admin/acquisition products;
- Business Club owner workspaces and owner job posting/management;
- `/app`, because it is the website’s app-download page;
- `/offline` and `/maintenance`, because they are website/PWA delivery states;
- SEO city/category landing paths and the website’s `/ml` landing surface;
- website-local demonstration controls that do not persist through the shared
  API. Flutter should use real API operations rather than reproduce local fake
  state.

The authoritative detailed matrix is
`flutter app/docs/WEBSITE_MOBILE_FEATURE_PARITY.md`. Re-audit it whenever a
website customer route or backend contract is added.

## Website and Flutter backend relationship

Flutter calls the NestJS API in `apps/api/` through:

```text
flutter app/lib/core/data/app_repository.dart
```

The website and Flutter app share data whenever both use the same deployed
NestJS endpoint and database. This includes the main customer domains such as
authentication, businesses, search, products, services, offers, saved items,
recent views, addresses, blocked businesses, enquiries, conversations, jobs,
bookings, notifications, reviews, orders, locations and weekly draws.

They do not automatically share behavior merely because they are in the same
repository. Some website pages also contain Next.js route handlers or
website-local code. Full synchronization must be verified route by route.

For one shared environment:

1. Deploy `apps/api/` with its PostgreSQL, Redis, worker, object-storage and
   provider dependencies.
2. Give it a public URL whose API prefix ends in `/api/v1`.
3. Point Flutter `API_BASE_URL` to that prefix.
4. Point website `NEXT_PUBLIC_BNC_API_URL` to the same prefix.
5. Verify the affected workflow from both clients against the deployed
   database.

The customer review-history endpoint added during parity work is:

```text
GET /api/v1/reviews/me
```

It returns the signed-in customer’s non-deleted reviews with business
identity, moderation state, helpful count and owner reply.

Customer search history is shared through:

```text
GET    /api/v1/users/me/search-history
POST   /api/v1/users/me/search-history
DELETE /api/v1/users/me/search-history
```

The website and Flutter client now record authenticated explicit searches
through the `POST` endpoint. The server normalizes the query and updates a
matching search from the same customer within ten minutes instead of creating
rapid duplicates. Flutter retains the original mode, filters, location,
coordinates and radius so a history item can reopen the same search context.
Debounced typing does not write every intermediate query.

Privacy-safe submitted-search demand is shared through:

```text
POST /api/v1/leads/search-intents
```

Flutter calls this only after an authenticated customer explicitly submits a
business search. The request carries normalized query/location context, not
customer contact details. Server-side deduplication and plan entitlement checks
decide which businesses may receive automatic lead alerts.

Customer support is implemented in the current working tree through:

```text
POST /api/v1/support/tickets
GET  /api/v1/support/tickets/me
```

`POST /support/tickets` uses optional authentication. A signed-in ticket stores
the customer ID; a guest ticket stores a null user ID and uses the submitted
reply email in metadata. Rate limiting is applied by customer ID when signed
in and by reply email for a guest. `GET /support/tickets/me` remains
authenticated. The nullable-user schema change has a migration at:

```text
apps/api/prisma/migrations/20260808043000_anonymous_support_tickets/
```

Local Prisma generation and validation, the NestJS build and focused support
tests pass for this change. The migration must still be applied to the target
database before a deployed API can accept anonymous mobile support tickets.

Recent shared-contract fixes include:

- product, service and business search carries constituency, district and
  state alongside city/coordinates for plan-aware listing reach;
- product delivery options are plan-filtered by the API, and Flutter treats
  only explicit delivery modes as home delivery;
- public business descriptions and social links may be absent because of plan
  entitlements and are not replaced with invented content;
- product/service/offer/order/enquiry model parsing now follows the nested
  NestJS response shapes;
- saved product media uses the API’s canonical `approved` scan state;
- saved and recent business cards include category and media information;
- conversation messages identify which messages belong to the signed-in
  customer, and conversation lists include live unread counts;
- service detail resolves its business with the public business slug;
- notification payloads resolve to customer-safe destinations;
- authenticated customer routes preserve a safe `returnTo` destination.

## Implemented customer capabilities

### Discovery and marketplace

- Home discovery with live categories, businesses, products, services and
  offers.
- Search with sorting, filters and list/map presentation.
- Native voice search using the device speech recognizer. Customers can choose
  English or Malayalam; permission denial, unavailable recognition and
  recognition errors are shown honestly rather than replaced with a fake
  phrase.
- Authenticated cross-client search history recording, clearing and complete
  replay of the original query, location and filters.
- Advanced business filters for delivery, fast response, price range, payment
  method, language and minimum years in business. These are implemented in the
  shared NestJS search query rather than being presentation-only controls.
- Search-mode switching between businesses, products and services while
  retaining query, location, coordinates, constituency, district, state and
  radius.
- Category directory and category-filtered discovery.
- Product categories now open the server-filtered product directory directly.
- Product discovery uses API-backed query, category, availability, courier and
  website-equivalent sort controls, while retaining the selected Kerala
  location hierarchy and radius.
- Service discovery supports the website's top-rated ordering.
- Product, service and offer directories have live counts and honest no-result
  states; product filtering/sorting is server-backed rather than a local-only
  presentation filter.
- Business directory and public business profiles.
- Business website/social links and related-business discovery on profiles.
- Real BNC star level, current plan name and permanent customer discount on
  business cards/profiles when those values are present in the API response.
- Missing distance remains absent rather than being rendered as `0.0 km`.
- Business availability shown only when the API supplies an explicit state or
  usable working hours; otherwise the UI says that hours are not listed.
- Active Kerala city selection, device location and manually entered precise
  map coordinates.
- Location-aware product, service, booking, offer and business requests that
  avoid combining unrelated city and coordinate filters.
- Plan-aware discovery context that allows the API to apply nearby,
  constituency, district or state listing reach without client-side guessing.
- Live business comparison with selection of two or three businesses and
  truthful rows for hours, distance, reviews, response, price, experience,
  home-service availability and languages.
- Product and service directories and details.
- City-specific offers.
- Offer cards with business locality/city and a login-safe action that opens an
  exact BNC conversation with the provider.
- Recently viewed business tracking.
- Shareable public business links.
- Seller navigation, BNC chat entry and related items from product detail.
- Seller phone actions only when the selected business or product response
  includes a usable public phone number.
- Copyable offer codes with expiry/minimum-spend information.

### Saved and trust controls

- Save and unsave businesses.
- Save and unsave products.
- Saved screen tabs for businesses, products and recent profiles.
- Block and unblock businesses.
- Report a business/profile through the support flow.
- Mark published reviews helpful.
- Report published reviews.

### Customer transactions

- Cart and server-authoritative checkout.
- Razorpay checkout integration when a real public key and provider order are
  configured.
- Customer order list, live order detail and shareable text invoice for
  captured payments.
- Order cancellation and return requests.
- Customer enquiries, matched responses and enquiry closing.
- Direct enquiries can create or reopen their exact secure BNC conversation
  from the success screen or customer enquiry history. Guest enquiries remain
  intentionally unlinked to a later account and the UI explains this.
- Searchable public appointment-service discovery, provider slots, booking,
  rescheduling and cancellation.
- Product minimum-order quantities and delivery options, with minimum quantity
  enforced in the cart, delivery checkout available only for explicit delivery
  modes, and checkout blocked when no real seller is connected.
- Jobs with text/employment-type filtering, richer job details, public
  applications and signed-in application history.
- Weekly draws, winners and draw audit information.

### Account and communication

- Phone OTP authentication.
- Email registration, verification and login.
- Secure access/refresh-token storage and refresh coordination.
- Customer profile editing.
- Saved-address add, edit and remove.
- Search history and recently viewed history.
- Customer review creation, history, editing and deletion.
- Conversations, message send, read state and archive.
- Conversation/business block and report actions.
- Notification inbox, customer-safe destination navigation, mark-one/all-read
  and preferences.
- Persistent customer language, city and default search-radius preferences.
- Public support-ticket submission for general, account, billing, privacy and
  trust/safety requests. Guests can submit using a reply email; signed-in
  customers retain an account link to the ticket.
- Authentication-required abuse/report actions return customers to the exact
  form after login, and support messages use the same minimum-length contract
  as the API.
- Sessions, consent records, export request and account deletion.
- English and Malayalam localization.
- Help, contact, abuse reporting and policy screens.

No customer-facing feature should silently replace an API error with made-up
business, product, order, review, booking, notification or account records.
Empty live results should be shown as honest empty states.

## Customer route inventory

### Entry and authentication

| Route | Purpose |
| --- | --- |
| `/splash` | Restore session and launch app |
| `/onboarding` | Introduction, location permission and city choice |
| `/login` | Phone OTP or email authentication |
| `/otp` | Phone verification |
| `/email-verify` | Email verification |

### Main customer shell

| Route | Purpose |
| --- | --- |
| `/home` | Customer home |
| `/search` | Search/filter/list/map |
| `/saved` | Saved businesses, products and recent profiles |
| `/messages` | Customer conversations |
| `/account` | Customer account |

### Discovery, catalogue and community

| Route | Purpose |
| --- | --- |
| `/categories`, `/products?category=:slug`, `/category/:slug` | Product-first category discovery and the supported mixed-result route |
| `/businesses`, `/business/:slug` | Directory and profile |
| `/compare` | Compare live businesses |
| `/products`, `/product/:id` | Location/query/category/availability/courier-aware product directory/detail with website-equivalent sorting |
| `/services`, `/services/:id` | Location/query-aware service directory/detail |
| `/offers`, `/offers/:city` | Offers |
| `/locations` | Active Kerala cities |
| `/weekly-draw` | Draws, winners and audit information |
| `/jobs`, `/jobs/:id`, `/jobs/:id/apply` | Jobs and applications |
| `/bookings` | Appointments and customer bookings |

### Customer activity

| Route | Purpose |
| --- | --- |
| `/enquiry`, `/enquiry/success` | Enquiry flow |
| `/account/enquiries`, `/account/enquiries/:id` | Enquiry history/direct detail/close |
| `/messages/:id` | Conversation |
| `/review/new`, `/account/reviews` | Review create/manage |
| `/cart`, `/checkout` | Cart and checkout |
| `/orders`, `/orders/:id` | Order history/detail |
| `/notifications` | Inbox and preferences |
| `/account/job-applications` | Application history |

### Account, support and policy

| Route | Purpose |
| --- | --- |
| `/account/profile` | Profile editing |
| `/account/settings` | Customer settings |
| `/account/history` | Search/recent history |
| `/account/addresses` | Address management |
| `/account/blocked` | Blocked businesses |
| `/account/privacy` | Sessions, consent, export and deletion |
| `/help`, `/contact`, `/report-abuse` | Support and trust |
| `/about`, `/privacy`, `/terms`, `/refunds` | Policy content |

Public discovery pages can load without login. Private customer records and
mutations are authentication-protected. Every authenticated identity currently
lands on `/home`; Flutter has no owner/admin landing route.

Customer settings persist locally using `SharedPreferences`. The current
settings cover English/Malayalam, an active Kerala city, optional precise
coordinates and a default nearby search radius. Known cities use their matching
coordinates. A current/precise location omits a misleading city-text filter,
and an unknown city does not reuse coordinates from an unrelated city.

The local custom deep-link scheme is:

```text
bnc://app
```

Universal/app links still require production-domain verification.

## Project architecture

```text
flutter app/
├── lib/
│   ├── app/                 customer shell and GoRouter graph
│   ├── core/
│   │   ├── config/          compile-time configuration
│   │   ├── data/            live AppRepository
│   │   ├── models/          API/domain model mapping
│   │   ├── network/         Dio, errors and token refresh
│   │   ├── notifications/   disabled/Firebase adapters
│   │   ├── state/           Riverpod providers/controllers
│   │   └── storage/         preferences and secure tokens
│   ├── design_system/       theme and reusable components
│   ├── features/            feature-first screens
│   └── l10n/                English and Malayalam
├── test/                    unit, route and widget tests
├── integration_test/        native smoke coverage
├── docs/                    parity, API, store and architecture notes
├── releases/                handoff APK and archived APKs
├── android/
└── ios/
```

Important files:

- `flutter app/lib/main.dart` — app bootstrap.
- `flutter app/lib/app/router.dart` — authoritative mobile route graph.
- `flutter app/lib/app/customer_shell.dart` — bottom navigation shell.
- `flutter app/lib/core/config/app_config.dart` — Dart-define config.
- `flutter app/lib/core/data/app_repository.dart` — backend operations.
- `flutter app/lib/core/models/models.dart` — API model parsing.
- `flutter app/lib/core/network/api_client.dart` — Dio and auth handling.
- `flutter app/lib/core/state/app_state.dart` — shared Riverpod state.
- `flutter app/docs/WEBSITE_MOBILE_FEATURE_PARITY.md` — parity decision
  matrix.
- `flutter app/docs/API_COVERAGE.md` — customer endpoint inventory.
- `flutter app/docs/SCREEN_INVENTORY.md` — screen/route inventory.

Core packages include Riverpod, GoRouter, Dio, secure storage, shared
preferences, cached network images, geolocation, flutter_map, image/file
pickers, sharing, Razorpay, `speech_to_text` and optional Firebase Messaging.
The customer search screen uses `speech_to_text` for real native speech
recognition with English/Malayalam locale selection. It records only a
submitted final voice query in authenticated search history; partial
recognition updates do not create history spam.

Verified local toolchain for the 2026-08-17 test and APK checkpoint:

```text
Flutter 3.41.4 stable
Dart 3.11.1
```

`razorpay_flutter` currently emits a warning that it does not support Swift
Package Manager. It does not fail analysis or tests today, but Flutter warns
that this may become an error in a future version. Recheck the plugin before a
future Flutter/iOS toolchain upgrade.

## Configuration

Configuration is injected with Dart defines. The supported values are:

| Define | Meaning | Default |
| --- | --- | --- |
| `API_BASE_URL` | Complete API prefix ending in `/api/v1` | Android emulator: `http://10.0.2.2:4000/api/v1`; other platforms: `http://127.0.0.1:4000/api/v1` |
| `SITE_BASE_URL` | Public website used for shared links | `http://127.0.0.1:3000` |
| `MAPBOX_ACCESS_TOKEN` | Mapbox streets tiles | Empty; OpenStreetMap fallback |
| `RAZORPAY_KEY_ID` | Public Razorpay checkout key | Empty |
| `ENABLE_FIREBASE_PUSH` | Initialize configured Firebase push | `false` |

Checked-in examples:

- `config.example.json` — local template.
- `config.live.json` — shared HTTP test deployment.
- `config.production.example.json` — HTTPS production template.

The current `config.live.json` points to:

```text
API:  http://66.116.240.235/bnc/api/v1
Site: http://66.116.240.235/bnc
```

This is a test environment, not a final production configuration. Android
debug builds allow its cleartext HTTP endpoint through the debug manifest.
Android release and iOS production builds require HTTPS.

Never commit:

- private API/provider credentials;
- production Android keystores or `key.properties`;
- Apple signing material;
- Firebase native credentials;
- secret server environment files.

## Platform and UI decisions

- Primary blue: `#0F48D8`.
- The native splash is flat blue with a large white `BNC` wordmark.
- Native status and navigation bars remain visible; the app is not forced into
  full-screen mode.
- Immersive blue screens use white app-bar/status-bar content.
- Headers and category cards use solid colors rather than gradients.
- Home retains the heading “Find shops, services & deals near you” and the
  main search bar.
- Removed from home: demo banner, hero shortcut panel, weekly-draw card,
  match-me block and the extra “Explore what’s nearby” label.
- Category cards are compact, low-clutter and in the approved blue family.
- Login has no square BNC logo tile or mobile-phone illustration.
- Onboarding is text-led and card-free, without decorative logo/icon badges.
- Yellow accent treatments requested for removal should stay blue or white
  unless a later design decision explicitly changes them.
- Avoid gradients in the approved customer screens.
- Use a pickup-specific `READY_FOR_PICKUP`/collected timeline for pickup orders
  and the dispatched/delivered timeline for delivery orders.
- Do not label a business open or closed unless explicit availability or
  usable working hours came from the API.
- Do not show call actions when the API response has no public phone number.
- Preserve a safe route-specific `returnTo` value when a customer action needs
  authentication.

Native permissions currently declared:

- Internet and network state.
- Approximate/precise location.
- Camera.
- Microphone and speech recognition for customer voice search. Android uses
  `RECORD_AUDIO` and declares the speech recognition service query; iOS
  contains microphone and speech-recognition usage text.
- Notifications.
- iOS selected-photo access text is present.

The iOS status bar is visible and the app is locked to light appearance.

## Local development

From the repository root:

```bash
npm install
npm run api:dev
```

In another terminal:

```bash
cd "flutter app"
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1
```

Use `127.0.0.1` instead of `10.0.2.2` for iOS/macOS local networking.

Shared test deployment:

```bash
cd "flutter app"
flutter run --dart-define-from-file=config.live.json
```

The user explicitly requested that the iPhone simulator not be used. Prefer
code checks and APK handoff. Use an Android emulator only when the current
request explicitly asks for runtime verification. When installing an update,
use `adb install -r` so app data is retained; do not repeatedly uninstall the
app unless a clean install is specifically required.

If a test runner displays “test starting” and the app repeatedly disappears,
first stop the runner and inspect the command it is using. Some automated
integration-test or IDE launch paths uninstall/reinstall the package as part of
their lifecycle. For ordinary handoff verification, install the built APK
directly with:

```bash
adb install -r "releases/BNC-live-current.apk"
```

Do not use an uninstall-first loop for routine updates.

Default handoff preference:

- implement and verify in code;
- build an APK for Android handoff;
- do not launch iPhone Simulator;
- do not launch Android Emulator unless explicitly requested in that chat;
- if emulator installation is requested, update in place with
  `adb install -r`.

## Verification

Run from `flutter app/`:

```bash
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test --dart-define-from-file=config.live.json
```

Run the API checks from the repository root:

```bash
npm run -w apps/api prisma:generate
npm run -w apps/api prisma:validate
npm run -w apps/api build
npm run -w apps/api test
```

The verification counts above are a point-in-time checkpoint, not a permanent
guarantee. Any source change must be followed by the same format, analysis,
Flutter-test and relevant API-test commands, and this file must be updated with
the new result.

## APK and store builds

Build the shared-test debug APK:

```bash
cd "flutter app"
flutter build apk --debug --dart-define-from-file=config.live.json
```

The generated file is:

```text
build/app/outputs/flutter-apk/app-debug.apk
```

Before replacing the handoff APK:

1. Run formatting, analysis and tests.
2. Archive the existing `releases/BNC-live-current.apk`.
3. Build with the intended configuration.
4. Copy the generated APK to `releases/BNC-live-current.apk`.
5. Verify its signature.
6. Calculate and record its SHA-256 in this file.
7. State clearly whether it is debug/test or release/store signed.

Production Android App Bundle:

```bash
flutter build appbundle --release \
  --dart-define-from-file=config.production.json \
  --obfuscate \
  --split-debug-info=build/symbols/android
```

Release Android signing reads `android/key.properties` when present. Store
handoff requires a private upload keystore; the debug certificate is not
suitable for Play Store publication.

iOS uses the same Dart application and customer feature code, but App Store
distribution still requires the Apple team, signing profiles, final bundle
configuration, provider files and an HTTPS production environment.

## Security and data rules

- Store access and refresh tokens in encrypted native storage.
- Carry an `x-request-id` for API traceability.
- Keep token refresh single-flight to avoid concurrent refresh races.
- Server pricing and stock are authoritative during order creation.
- Never simulate successful payment.
- Signed server webhook processing is payment truth.
- Verification/evidence media must use private object keys and the configured
  upload flow.
- Do not place secrets in Flutter; mobile applications cannot safely retain
  server secrets.
- Show real API errors or honest empty states instead of customer-visible
  sample records.

## Deployment/provider work still required

- Final HTTPS API and website domains.
- Production PostgreSQL, Redis, background workers, storage and backups.
- SMS/WhatsApp OTP provider and email delivery.
- Firebase/APNs native files, server credentials and device registration.
- Mapbox token if Mapbox tiles are desired.
- Razorpay environment keys and signed webhook deployment.
- Private media upload, validation and malware scanning.
- Android Play upload keystore and Play Console setup.
- Apple developer team, certificates and provisioning.
- Universal/app-link domain verification.
- Monitoring, crash reporting, rate limits and production alerting.
- End-to-end verification of website ↔ API ↔ Flutter data consistency.

## Known follow-up items

1. Verify the APK on a real Android device or emulator only if
   requested.
2. Deploy and live-test the new support-ticket API before relying on support
   submission in a distributed APK.
3. Optionally remove the now-unreachable owner/administrator Dart source after
   confirming it is no longer wanted anywhere.
4. Complete production provider credentials, signing and HTTPS deployment.
5. Perform end-to-end live tests for OTP/email delivery, checkout/webhooks,
   push notifications, uploads, jobs, bookings, messaging and account export/
   deletion.

## Instructions for continuing in another chat

Start a future Flutter task by giving the new chat this file:

```text
Read /Volumes/SSD/Documents/bnc demo 3/flutterapp.md completely before making
changes. Treat it as the Flutter source of truth, then verify any claim that
may have changed against the current source and git status.
```

Because this file lives at the repository root, every Codex chat opened on this
workspace can read the same handoff. Chat history itself is not the source of
truth; this file and the current repository are.

For implementation work, the next chat should:

1. Read this file and the relevant supporting document.
2. Run `git status --short` and preserve all existing user changes.
3. Inspect `flutter app/lib/app/router.dart` to confirm current exposure.
4. Keep the Flutter product customer-only unless explicitly told otherwise.
5. Use the shared NestJS API rather than introducing local sample data.
6. Run the documented checks after changes.
7. Rebuild, sign-check and hash the APK if an APK handoff is requested.
8. Update this file whenever routes, backend contracts, build configuration,
   verification counts or artifact details change.

## Supporting documents

- `flutter app/README.md`
- `flutter app/docs/ARCHITECTURE_DECISIONS.md`
- `flutter app/docs/WEBSITE_MOBILE_FEATURE_PARITY.md`
- `flutter app/docs/SCREEN_INVENTORY.md`
- `flutter app/docs/API_COVERAGE.md`
- `flutter app/docs/store/STORE_LISTING.md`
- `flutter app/docs/store/RELEASE_CHECKLIST.md`
- `docs/API.md`
- `docs/DEPLOYMENT.md`

If this file and an older chat disagree, verify the current source and then
update this file. Do not preserve stale route, APK, backend or test information
just because it appeared in a previous conversation.
