# Deployment

## Release units

BNC has two independently deployable units:

1. The Next.js/vinext worker and its Sites D1/R2 bindings.
2. The NestJS API and BullMQ workers backed by PostgreSQL, Redis and object storage.

Deploy the API before a web release that depends on a new endpoint. Backward-compatible API changes may be rolled out independently.

## Database release

1. Take a restorable PostgreSQL backup.
2. Review the SQL migration and lock implications.
3. Apply Prisma migrations with the production `DIRECT_DATABASE_URL`.
4. Run a read-only health and schema check.
5. Deploy the API.
6. Run a synthetic OTP/search/order request using test identities.

Migrations are forward-only during normal operation. Roll back application code when compatible; use a corrective migration rather than manually editing production schema history.

For Sites D1, apply the checked-in Drizzle migrations before enabling a route that writes a new table or column.

## API runtime

Build and start:

```bash
npm ci
npm run prisma:generate
npm run api:build
npm run start --workspace @bnc/api
```

Provide health-checked PostgreSQL and Redis endpoints, all secrets from a secrets manager, exact `WEB_ORIGIN`, provider credentials and S3-compatible media settings. Run BullMQ processors with enough concurrency for payment and lead queues. Do not expose Redis or the database publicly.

## Web runtime

Before release:

```bash
npm ci
npm run lint
npm run typecheck
npm test
```

Set `NEXT_PUBLIC_BNC_API_URL` to the public `/api/v1` origin and `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin. Configure `ENQUIRY_DATA_KEY` as a worker secret. Bind logical `DB` and `MEDIA` resources exactly as declared in `.openai/hosting.json`.

The Sites deployment is private by default for review. Promote access only after verifying routes, forms, canonical URLs and provider origins.

## Rollback

- Web: redeploy the previously saved immutable version.
- API: redeploy the preceding image when it is compatible with the migrated schema.
- Payment incident: disable new checkout, keep webhook ingestion durable, reconcile before retrying jobs.
- Queue incident: pause consumers rather than deleting jobs; fix and resume with idempotency intact.

## Post-deploy checks

- `/`, `/search`, one business/product/service page and `/ml` return 200.
- `/sitemap.xml`, `/robots.txt` and `/manifest.webmanifest` reference the production origin.
- `/api/v1/health` and `/api/docs` are reachable according to policy.
- Anonymous `/account` redirects to secure sign-in.
- CSP allows OpenStreetMap and Razorpay checkout without broad unsafe frames.
- Test payment webhook is accepted once and a retry is acknowledged as duplicate.
- D1 enquiry and contact forms create records; R2 proof remains private.
