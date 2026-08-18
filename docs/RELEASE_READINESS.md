# BNC release readiness

This checklist maps the product brief to the implemented release. “Provider-configured” means the product path is implemented but requires the named production account or secret; demo data is never represented as a live merchant record.

## Product surfaces

| Area | Release evidence |
| --- | --- |
| Responsive discovery | Sticky desktop/mobile header, global and hero search, location selector, mobile bottom navigation, category/city browsing and responsive cards |
| Homepage | All 15 requested discovery, marketplace, offer, recent, city, business and app sections |
| Search | Suggestions, English/Malayalam vocabulary and transliteration aliases, 1–50 km radius, list/map views, complete filters and seven sorts |
| Ranking | Labelled sponsored results, plan priority, plan tenure, organic scoring and versioned admin-configurable weights |
| Business profiles | SSR metadata, gallery, services/products/offers, reviews, FAQ, map/hours, consent-aware enquiry, report/share/save/directions and similar profiles |
| Customer account | Hosted secure account pages plus mobile OTP, verified email/password and Google OIDC API flows; addresses, saves, recent history, blocks, consent, sessions, export and deletion |
| Business workspace | Profile, leads, enquiries, products, services, orders, offers, reviews, messages, subscriptions, payments, team, analytics, notifications and settings |
| Administration | Role-aware frontend modules and protected APIs for overview, directories, verification, review moderation, finance, support, ranking and hash-chained audit logs |
| Marketplace | Cart, server-priced products/coupons, pickup/delivery, Razorpay checkout, signed webhook state, order tracking, cancellation, returns and invoice download |
| Localization | Instant English/Malayalam switch, Malayalam landing content, preserved translation records and correction states |
| SEO and PWA | Server rendering, clean/canonical routes, JSON-LD graphs, Open Graph, sitemap, robots, manifest, service worker, offline/error/404 states |

## Data and services

| Layer | Implementation |
| --- | --- |
| Web runtime | Next.js/React/vinext worker with D1 for hosted forms and R2 for private application evidence |
| Domain API | Modular NestJS REST API under `/api/v1`, Swagger under `/api/docs`, DTO allowlisting, request IDs and consistent errors |
| Primary store | Normalized Prisma/PostgreSQL schema with PostGIS, `pg_trgm`, full-text and spatial indexes, migrations and seed data |
| Cache and jobs | Redis plus BullMQ for OTP, lead matching and webhook processing |
| Realtime | Authenticated notification SSE stream |
| Payments | Razorpay server order creation and raw-body HMAC webhook verification with durable idempotency |
| Media | Object-key DTO validation, private evidence, quarantine scan state and clean-only public reads |

## Production configuration required

- PostgreSQL/PostGIS, Redis and S3-compatible storage endpoints.
- Four independent high-entropy keys for access JWT, refresh JWT, OTP/fingerprint HMAC and personal-data encryption.
- Razorpay key pair and webhook secret.
- Google OAuth client ID when Google sign-in is enabled.
- SMS/WhatsApp/email/push provider workers for queued notification records.
- Malware-scanning worker before quarantined product, service or review media is promoted.
- Exact HTTPS web origin and the public site/API URLs.

See `DEPLOYMENT.md`, `OPERATIONS.md` and `SECURITY_AND_PRIVACY.md` for rollout, monitoring and incident procedures.

## Verification gates

The release is blocked unless all of these pass:

```bash
npm run lint
npm run typecheck
npm run prisma:validate
npm run api:test
npm test
npm run verify:mobile-release
```

The mobile release command is intentionally expected to fail until both official store listings are live, the public site uses a non-local HTTPS origin, and `NEXT_PUBLIC_MOBILE_APP_RELEASE_ENABLED=true` has been explicitly reviewed.

Browser verification covers desktop and mobile overflow, global search, filters, business media, cart state, saved-product tabs, admin filtering and browser console errors.
