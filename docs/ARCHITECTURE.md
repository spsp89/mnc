# BNC system architecture

## Product boundary

BNC is organized as a modular commerce platform with three primary clients:

1. The public and authenticated Next.js web application in the repository root.
2. The versioned NestJS REST API in `apps/api`, designed for web, Android and iOS clients.
3. Background workers in the API process for lead matching, notifications, payments and media processing.

The public Sites deployment uses Cloudflare D1 and R2 for the hosted interactive preview. The production API is deliberately independent and uses PostgreSQL, Prisma, Redis and S3-compatible object storage as required by the product specification.

## Runtime topology

```text
Browser / PWA / future mobile apps
        |
        | HTTPS REST / SSE
        v
Next.js web --------------> NestJS API
                                |
             +------------------+------------------+
             |                  |                  |
        PostgreSQL            Redis          Object storage
      source of truth      cache/sessions      images/video
                           rate limits/jobs
                                |
                             BullMQ workers
                                |
               SMS / WhatsApp / email / push / Razorpay
```

## Domain modules

- Identity: users, customer profiles, business owners, OTP sessions, refresh-token rotation, device history and consent.
- Directory: businesses, locations, categories, products, services, offers, verification and translations.
- Discovery: multilingual search, transliteration, geospatial radius filtering, suggestions and configurable ranking.
- Engagement: enquiries, leads, assignment, conversations, notifications, saved records and reviews.
- Commerce: carts, orders, payments, settlements, refunds, coupons and invoices.
- Operations: subscriptions, advertisements, support, analytics, regional permissions, content and immutable audit logs.

Each NestJS feature owns its controller, validation DTOs and service. Cross-cutting concerns live under `src/common`; persistence is isolated in `src/database`.

## Search and ranking

Search candidates are retrieved with PostgreSQL full-text search and geospatial distance. Production should enable PostGIS and `pg_trgm`. Candidate ranking separates paid and organic signals:

1. Eligible sponsored listings are selected within the chosen radius and always labelled.
2. Paid order is plan priority, then plan start time.
3. Organic order combines text relevance, distance, profile completeness, verification, review quality, responsiveness and freshness.
4. Ranking weights are versioned, editable by privileged admins and written to the audit log.

The default search radius is 5 km. Fallback resolution is locality, city, district and state.

## Security model

- Short-lived JWT access tokens and rotating refresh tokens.
- OTP hashes, rate limits and expiry enforced server-side.
- Role and region-scoped authorization guards.
- AES-GCM for customer contact data and deterministic salted fingerprints for duplicate detection.
- Signed object-storage uploads with content-type, size and malware-scan gates.
- Consent checked before contact details are released to a matched business.
- Immutable audit records for verification, finance, moderation, ranking and access-control changes.
- Separate secrets for access tokens, refresh tokens, OTP hashing and personal-data encryption.

## Reliability and scale

- Redis caches location/category data and search suggestions.
- BullMQ isolates lead assignment and notification delivery with retries and dead-letter handling.
- Idempotency keys protect payment, order and enquiry mutations.
- Durable webhook records and idempotent BullMQ jobs protect asynchronous payment and lead delivery.
- Cursor or page pagination is required for list APIs.
- Health, readiness and OpenAPI endpoints are exposed by the API.

## Deployment

Local development uses Docker Compose for PostgreSQL, Redis and MinIO. The web app can run independently against realistic local data. Production deploys the web and API independently so either can scale without coupling release cadence.
