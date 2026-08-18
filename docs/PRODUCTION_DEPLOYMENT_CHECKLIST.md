# NearU production deployment checklist

## Environment

- Set `NODE_ENV=production`, `PORT`, `WEB_ORIGIN`, `BNC_API_URL`, `NEXT_PUBLIC_BNC_API_URL`, and `NEXT_PUBLIC_SITE_URL` to HTTPS production origins.
- Set `NEXT_PUBLIC_ANDROID_APP_URL` to the official `https://play.google.com/store/apps/details?id=...` page and `NEXT_PUBLIC_IOS_APP_URL` to the official `https://apps.apple.com/.../app/.../id...` page only after each listing is live. Keep `NEXT_PUBLIC_MOBILE_APP_RELEASE_ENABLED=false` until `npm run verify:mobile-release` passes with the production HTTPS site origin and both listings. Verify the `/app` QR and store handoffs on Android and iPhone; invalid or missing values must remain non-clickable.
- Provision PostgreSQL and set pooled `DATABASE_URL`; set `DIRECT_DATABASE_URL` to a direct connection for migrations and backups. Keep `DATABASE_QUERY_TIMEOUT_MS` below `BNC_API_REQUEST_TIMEOUT_MS` (5 and 7 seconds by default). Set `HEALTH_READINESS_TIMEOUT_MS` to the platform probe budget (3 seconds by default) and confirm an unavailable database produces a bounded HTTP 503 from `/api/v1/health/ready` while `/api/v1/health` remains live. Increase request limits only after production query profiling proves that a specific optimized operation requires it.
- Provision Redis and set `REDIS_URL` for BullMQ workers.
- Generate independent high-entropy values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENQUIRY_DATA_KEY`, `FINGERPRINT_KEY`, `OTP_HASH_SECRET`, and `DRAW_CODE_SECRET`. Disable `TEST_FIXED_OTP_ENABLED`.
- Configure the S3-compatible bucket, credentials, public CDN URL, CORS, encryption, lifecycle rules, and image/document size limits. Banner CMS requires `OBJECT_STORAGE_PUBLIC_URL`.
- Configure Razorpay keys and `RAZORPAY_WEBHOOK_SECRET`; register the HTTPS webhook endpoint. Never expose secret keys to the web client.
- Keep `DELIVERY_PROVIDER=MANUAL` until a provider is certified. For `PORTER` or `HTTP`, configure the HTTPS API base URL, token, raw-body HMAC webhook secret, and provider paths; register callbacks with stable event-ID and HMAC signature headers, then complete the reconciliation runbook in `docs/OPERATIONS.md`.
- Keep `WHATSAPP_PROVIDER=DISABLED` until an official provider and approved templates are certified. Then configure its HTTPS API URL/token, send path, raw-body HMAC callback secret, JSON approved-template map and daily cap; register the signed callback and prove opt-in/STOP/retry/reconciliation behavior from `docs/OPERATIONS.md`.
- Keep `DRAW_FEATURE_ENABLED=false` until written legal/tax/eligibility approval exists. Enabling requires a traceable `DRAW_LEGAL_APPROVAL_REFERENCE`, a dedicated strong `DRAW_CODE_SECRET`, and completion of the reward-draw activation checklist in `docs/OPERATIONS.md`.
- Configure Mapbox, Firebase, email, SMS, WhatsApp, and delivery-provider values only for enabled features.
- Restrict database, Redis, storage, and provider credentials to the minimum required permissions. Store secrets in the deployment platform, never source control.

## Release sequence

1. Create and verify a database backup using `docs/DATABASE_BACKUP_AND_ROLLBACK.md`.
2. On a clean checkout use Node.js 22.13 or newer and run `npm ci`.
3. Run `npm run prisma:generate`, `npm run prisma:validate`, `npm run lint`, `npm run typecheck`, `npm run api:test`, and `npm test`.
4. Run production builds: `npm run api:build` and `npm run build:vercel` (or the configured Vinext target).
5. Review pending SQL, then apply it once with `npx prisma migrate deploy --schema apps/api/prisma/schema.prisma` using `DIRECT_DATABASE_URL`.
6. Deploy the API and workers, verify `/api/v1/health`, then deploy the web application. Deploy the Flutter customer app only after its configured API origin is production-ready.
7. Smoke test admin and merchant login/RBAC, banner scheduling/upload, offer approval, listing ownership, subscriptions, signed payment webhook, enquiries, and logout/expired-session handling.
8. Monitor API error rate, queue failures, database connections, webhook failures, storage errors, and latency. Keep the previous API/web artifacts available for rollback.

Do not run demo seeding or development migrations in production.
