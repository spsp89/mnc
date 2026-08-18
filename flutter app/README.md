# BNC mobile

Flutter client for BNC — Business Near & Close. Android and iOS share the same
Dart feature modules, API repository, state, navigation, and design system.

Flutter is the customer application. Business-owner login, merchant management,
Business Club and platform administration remain on the protected website and
are not exposed by the mobile router.

The application is live-data-only. It contains no bundled businesses,
products, offers, accounts, orders, jobs, appointments, analytics, or
administrative records, and it never substitutes local records after an API
failure.

## Requirements

- Flutter 3.44.1 or newer
- Dart 3.12.1 or newer
- Android SDK and Java 17
- Xcode 26 or newer for iOS builds

```bash
flutter pub get
flutter run
```

## API configuration

Copy the non-secret configuration template and set the environment values:

```bash
cp config.example.json config.local.json
flutter run --dart-define-from-file=config.local.json
```

Supported compile-time values:

| Define | Purpose | Default |
| --- | --- | --- |
| `API_BASE_URL` | Complete NestJS API prefix | Android: `http://10.0.2.2:4000/api/v1`; other platforms: `http://127.0.0.1:4000/api/v1` |
| `SITE_BASE_URL` | Public website base used for shared business links | `http://127.0.0.1:3000` |
| `MAPBOX_ACCESS_TOKEN` | Mapbox streets tiles; OSM is the no-key fallback | empty |
| `RAZORPAY_KEY_ID` | Public checkout key | empty |
| `ENABLE_FIREBASE_PUSH` | Enables the configured Firebase push adapter | `false` |
| `TEST_OTP_CODE` | Displays the temporary shared-test phone code; keep empty for production | empty |

Run the parent API locally before using live features:

```bash
cd ..
npm run api:dev
```

The checked-in `config.live.json` targets the shared live test deployment and
contains no private credentials:

```bash
flutter run --dart-define-from-file=config.live.json
flutter build apk --debug --dart-define-from-file=config.live.json
flutter test --dart-define-from-file=config.live.json test/core/config_test.dart
```

The current installable test artifact is
`releases/BNC-live-current.apk`. It is signed with the Android debug
certificate for development/testing installation; it is not a store release.
Its SHA-256 is
`88db06445a2295637615b892aa84acd7ad77334ba6609f14fcf34358e0fba4dd`.
The previous artifact is preserved under `releases/archive/`.

Debug Android builds permit the shared HTTP test deployment. Release Android
and iOS builds reject cleartext traffic and therefore require final HTTPS API
and website domains.

Phone OTP and email authentication, catalogue, search, locations, orders, and
other customer domains call the NestJS API. An API
failure remains visible as an error or empty state.

The checked-in shared-test configuration displays `123456` as the temporary
phone OTP for every valid number. The API accepts it only when its explicit
`TEST_FIXED_OTP_ENABLED` flag is enabled; production configuration keeps both
test settings disabled.

Jobs and applications, appointments, saved businesses and products, recent
views, business comparison, weekly draws, conversations, review history, and
customer account controls use live backend contracts. Features that still
depend on an unavailable provider continue to show honest errors or empty
states rather than generated content.

The latest client-acceptance release also covers:

- native English/Malayalam voice search with real permission and recognition
  errors;
- shared website/Flutter search-history recording and full search replay;
- advanced business filters, sorting, list/map results and precise location;
- provider chat from businesses, products, services, offers and direct
  enquiries;
- BNC star level, plan name and permanent customer discount;
- live appointment and job discovery on Home, plus public job applications and
  appointment booking/reschedule/cancel;
- constituency, district and state discovery context shared with the website,
  allowing the API to apply each business plan's geographic reach;
- privacy-safe recording of explicit signed-in searches for entitled business
  lead alerts, without exposing customer contact details;
- explicit home-delivery labels and checkout choices only when the API confirms
  delivery support; pickup-only products stay pickup-only;
- direct customer enquiry detail links with live status, responses, closing and
  exact-conversation handoff;
- plan-aware public business content: descriptions, social links and product
  delivery options are displayed only when returned by the API;
- website-compatible product, cart, booking and customer-account deep links;
- anonymous or signed-in support-ticket submission with signed-in request
  history.

Cinema/theatre ticket booking and seat selection are explicitly excluded from
this release. Business-owner and administrator routes remain website-only.

## Safety boundaries

- Access and refresh tokens are stored in encrypted native storage.
- Requests carry an `x-request-id` and token refresh is single-flight.
- Server prices and stock remain authoritative during order creation.
- Razorpay checkout requires a real key and provider order. The client never
  simulates payment success; a signed server webhook is payment truth.
- Verification submissions require a private object key from the configured
  upload adapter.
- Firebase push remains disabled until native provider files and build defines
  are supplied.

## Project layout

```text
lib/
  app/                 app shell and route graph
  core/
    config/            compile-time environment
    data/              live AppRepository
    models/            API/domain mapping
    network/           Dio, errors, refresh coordination
    notifications/     disabled/Firebase push adapters
    state/             Riverpod session, cart, search, connectivity
    storage/           preferences and secure session storage
  design_system/       theme and reusable components
  features/            feature-first presentation modules
  l10n/                English and Malayalam localizations
integration_test/      native smoke coverage
test/                  unit, route, localization, and widget tests
```

## Verification

```bash
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test --dart-define-from-file=config.live.json
flutter build apk --debug --dart-define-from-file=config.live.json
```

For a production Android build, provide a private upload keystore and a
production configuration file:

```bash
flutter build appbundle --release \
  --dart-define-from-file=config.production.json \
  --obfuscate \
  --split-debug-info=build/symbols/android
```

See [architecture decisions](docs/ARCHITECTURE_DECISIONS.md),
[website/mobile parity](docs/WEBSITE_MOBILE_FEATURE_PARITY.md),
[screen inventory](docs/SCREEN_INVENTORY.md), and
[API coverage](docs/API_COVERAGE.md). Store metadata and submission steps are
under [docs/store](docs/store/RELEASE_CHECKLIST.md).
