# BNC — trusted local discovery and commerce

BNC is a responsive local-business search, enquiry, lead-management and marketplace platform for Kerala. It combines a server-rendered Next.js PWA, a modular NestJS API, PostgreSQL/PostGIS, Prisma, Redis and BullMQ. The public experience is original to BNC and supports English and Malayalam.

The repository also includes a production-oriented Flutter application for
Android and iOS. It shares the website's customer discovery and commerce
contracts; business-owner and administrator login/management remain
website-only by product decision.

## What is implemented

- Location-aware search with 1–50 km radii, multilingual synonyms, transparent sponsored ordering, map/list views and detailed filters.
- SEO-friendly business, product, service, city/category and offer pages with structured data, sitemap, robots, canonicals and social metadata.
- Consent-aware enquiries, encrypted contact details, duplicate suppression, lead matching, quotas and accept-before-reveal contact access.
- Mobile OTP, verified email/password and Google OIDC sign-in; saved addresses/businesses/products, recent history, blocks, consent/export/deletion controls, reviews, notifications, compare, cart, server-priced coupons, Razorpay checkout and order tracking.
- Review media quarantine, edit history, one-vote helpful counts, abuse reporting and enquiry-scoped conversations with read receipts.
- Business onboarding, claiming, verification evidence storage, dashboard modules, analytics, catalogues, offers, reviews, subscription and lead management.
- Role-aware administration, verification decisions, ranking configuration, moderation, audit controls and operational views.
- Offline shell, installable manifest, responsive layouts, loading/empty/error states and keyboard-visible focus.

The Sites-hosted web runtime uses D1 and R2 for its self-contained forms and private evidence uploads. The production domain API remains independently deployable so the same REST contract can serve web, Android and iOS clients.

## Repository map

| Path | Purpose |
| --- | --- |
| `app/`, `components/`, `lib/` | Next.js App Router web application |
| `apps/api/` | NestJS v1 REST API, Prisma client and BullMQ processors |
| `apps/api/prisma/` | Normalized PostgreSQL schema, migrations and realistic seed |
| `db/`, `drizzle/` | Sites D1 schema and migrations |
| `packages/contracts/` | Framework-neutral shared API contracts |
| `flutter app/` | Flutter Android/iOS client, native projects, tests and mobile documentation |
| `worker/` | Cloudflare/vinext worker entry |
| `docs/` | Architecture, security, API, deployment, operations and testing |
| `tests/` | Rendered production-worker integration tests |

## Prerequisites

- Node.js 22.13 or newer
- npm 10 or newer
- Docker with Compose
- A Razorpay test account only when exercising online checkout

## Local setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run demo:seed -- --confirm-live-demo
```

Run the two processes in separate terminals:

```bash
npm run api:dev
npm run dev
```

The web app defaults to `http://localhost:3000` and the API to `http://localhost:4000/api/v1`. Swagger is available at `http://localhost:4000/api/docs`. If port 3000 is occupied, the web development server selects the next free port.

The OTP worker writes development challenges to Redis and returns the development code only when `NODE_ENV=development`. Production requires a configured SMS or WhatsApp provider consumer.

## Verification

```bash
npm run lint
npm run typecheck
npm run prisma:validate
npm run api:test
npm test
cd "flutter app" && flutter analyze && flutter test
```

`npm test` builds the production worker before checking real rendered routes, security headers, SEO endpoints, Malayalam output, secure account redirects and the branded 404. API tests build NestJS and exercise authenticated encryption plus raw-body Razorpay webhook verification and idempotency.

## Environment and secrets

Start from `.env.example`. Use different high-entropy values for access JWTs, refresh JWTs, OTP HMAC and enquiry encryption. Never reuse them or commit real values. Production also requires:

- managed PostgreSQL with PostGIS and `pg_trgm`;
- managed Redis with persistence and transport security;
- private S3-compatible storage plus a public CDN for approved media;
- Razorpay keys and a webhook secret;
- messaging/push provider credentials;
- exact allowed web origins and a public `NEXT_PUBLIC_SITE_URL`.

See [Security and privacy](docs/SECURITY_AND_PRIVACY.md) for the threat model and [Deployment](docs/DEPLOYMENT.md) for release order, migrations and rollback.

## Important demo boundaries

Names, ratings and catalogue records are realistic seed/demo data, not claims about real businesses. The UI labels illustrative business workflow data as a demo workspace. Live contact, OTP, payment and background-delivery operations require the corresponding production API and providers.

## Documentation

- [System architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Repository structure](docs/REPOSITORY_STRUCTURE.md)
- [API guide](docs/API.md)
- [Security and privacy](docs/SECURITY_AND_PRIVACY.md)
- [Testing and accessibility](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Live demo data and test accounts](docs/LIVE_DEMO_DATA.md)
- [Operations runbook](docs/OPERATIONS.md)
- [Release readiness matrix](docs/RELEASE_READINESS.md)
