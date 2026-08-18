# Live demo data and test accounts

The shared production-testing deployment contains only clearly labelled,
fictional BNC demo records. Web, Android, and iOS consume the same NestJS API
and PostgreSQL database.

## Endpoints

| Surface | URL |
| --- | --- |
| Website | `http://66.116.240.235/bnc` |
| API | `http://66.116.240.235/bnc/api/v1` |
| API health | `http://66.116.240.235/bnc/api/v1/health` |
| API documentation | `http://66.116.240.235/bnc/api/docs` |
| Flutter live config | `flutter app/config.live.json` |
| Installable Android test APK | `flutter app/releases/BNC-live-current.apk` |

The homepage, category, business, product, service, offer, search, city, and
business-detail views are server-rendered from this API. They do not use the
old static catalogue arrays.

The customer account, business workspace, and administrator panel also read
the shared API. Administrator inventory screens use an allowlisted,
`SUPER_ADMIN`-only read endpoint that excludes password hashes, encrypted
contacts, tokens, and other authentication material.

## Primary panel accounts

| Panel | Email | Password | Mobile OTP identity |
| --- | --- | --- | --- |
| Customer | `bnc.customer.demo.0807@example.com` | `BNC!Customer2026#` | `+91 98765 43210` |
| Business owner | `bnc.business.demo.0807@example.com` | `BNC!Business2026#` | `+91 98765 43212` |
| Super administrator | `bnc.admin.demo.0807@example.com` | `BNC!Admin2026#` | `+91 98765 43214` |

The website supports email/password login. The current Flutter login screen
uses mobile OTP, so use the corresponding mobile identity when testing the
native app. Development OTP codes are exposed only when the server's explicit
development OTP mode is enabled.

## Specialist and team accounts

These accounts all use `BNC!DemoTester2026#`.

| Role | Email |
| --- | --- |
| Secondary customer | `bnc.customer2.demo.0807@example.com` |
| Business team member | `bnc.team.demo.0807@example.com` |
| Moderator | `bnc.moderator.demo.0807@example.com` |
| Support | `bnc.support.demo.0807@example.com` |
| Verification | `bnc.verification.demo.0807@example.com` |
| Finance | `bnc.finance.demo.0807@example.com` |

These credentials are disposable test credentials. Do not reuse them for real
accounts, and remove or rotate them before the test deployment becomes a real
production service.

## Dataset coverage

The idempotent seed creates or updates:

- 46 categories: 15 active roots, 30 subcategories, and one inactive category;
- 15 active fictional businesses across every root category, plus five
  businesses covering draft, pending, suspended, rejected, and closed states;
- primary and branch locations with PostGIS points, hours, media, owner/team
  access, free-to-premium plans, and every subscription state;
- 46 products, 90 variants, 30 services, 15 offers, public media, stock states,
  catalogue moderation states, pricing types, and offer validity states;
- every lead, assignment, enquiry, conversation, message, order, payment,
  refund, verification, advertisement, support ticket, webhook, review, and
  notification lifecycle state;
- three published jobs plus a shortlisted application, two customer bookings,
  one tracked referral, weekly draws with a published winner, Business Club
  chapters and chat, and a delivery order with provider tracking;
- saved businesses/products, addresses, recently viewed and blocked listings,
  search history, analytics events, settlements, translations, consents,
  notification preferences, ranking configurations, and audit records.

All customer-facing names and descriptions say that the records are demo data.
No real payment is collected and no seeded order should be fulfilled.

## Verified panel coverage

The live browser verification on 7 August 2026 confirmed:

- customer login plus saved businesses, active enquiries, recent views, and
  submitted reviews, bookings, jobs, applications, weekly draws, conversations,
  Business Club participation, and delivery tracking;
- business login plus workspaces, leads, enquiries, products, services,
  offers, orders, messages, reviews, team, subscription, payments,
  notifications, analytics, jobs, referrals, bookings, chapter chat,
  deliveries, and settings;
- administrator login plus businesses, users, verification, review and product
  moderation, leads, enquiries, categories and subcategories, services, plans,
  payments, refunds, orders, offers, advertisements, locations, reports,
  support, notifications, translations, search analytics, ranking, content,
  conversation moderation, weekly draws, audit log, settings, and system
  readiness.

The administrator login and the formerly incomplete inventory screens were
checked for the original `JSON.parse` failure and returned rendered live data
without that error.

## Run or refresh the seed

The script is guarded and refuses to write without explicit confirmation:

```bash
npm run demo:seed -- --confirm-live-demo
```

It uses deterministic IDs or natural unique keys, never deletes unrelated
records, and is safe to rerun. Relative offer, expiry, and subscription dates
are refreshed on each run so the dataset remains useful.

Always create and verify a database backup before running it against a shared
environment. On the webhostbox deployment, run it inside the API container:

```bash
docker exec bnc_api_1 \
  npm run demo:seed --workspace @bnc/api -- --confirm-live-demo
```

## Flutter

Build or run the native client against the shared data:

```bash
cd "flutter app"
flutter run --dart-define-from-file=config.live.json
flutter build apk --debug --dart-define-from-file=config.live.json
flutter test --dart-define-from-file=config.live.json test/core/config_test.dart
```

`releases/BNC-live-current.apk` is the current debug-signed, installable test
build. It is intentionally not represented as a production-signed release.
An Android App Bundle can be generated for release review, but the Play Store
upload must use the client's Android upload keystore.
Its SHA-256 checksum is
`2af9fa62acfa5f13ff50a0579256ef18bd24acb41254e948e4707302a9cd7378`.

The test server currently uses an HTTP IP address. Cleartext exceptions are
limited to Android debug builds for local/live testing. Release builds reject
cleartext traffic and therefore require the final HTTPS API domain. App Store
submission also requires the client's Apple developer team, signing
certificates, provisioning profile, and final store metadata.
