# Security and privacy

## Trust boundaries

The browser is untrusted. Prices, plan benefits, lead entitlement, ownership, admin roles and consent release are checked in the API. PostgreSQL is the production source of truth; Redis is used for expiring challenges, rate limits, cache and jobs, never as the sole durable payment record.

## Identity and authorization

- OTP requests are limited by mobile number and IP and expire after five minutes.
- OTP digests use a keyed HMAC and failed attempts invalidate the challenge.
- Access JWTs expire after 15 minutes.
- Refresh sessions store Argon2 hashes, rotate on use, record device/IP context and support revocation.
- Nest guards enforce role claims; business services also check owner/team membership.
- Hosted customer pages read signed identity headers on the server and redirect anonymous visitors through the platform sign-in flow.
- Administrative and finance actions are deny-by-default in the API and create audit records.

## Personal data

Customer phone numbers attached to enquiries use AES-256-GCM at rest. A separate keyed/digested fingerprint supports duplicate detection without exposing the number. Matched businesses see approximate need/location data first and receive contact data only after consent, assignment acceptance and quota checks.

Verification documents are private objects. Public URLs are not stored for evidence. Application routes accept only PDF, JPEG or PNG under 5 MB; production promotion requires a malware-scan result. Retention jobs should delete expired enquiry contact payloads and unneeded verification evidence.

## Web safeguards

The web runtime sends CSP, HSTS, frame denial, MIME-sniff prevention, referrer and feature-permission headers. React escapes customer text by default. Structured-data JSON replaces `<` before insertion. D1 and Prisma queries are parameterized. Forms apply schema validation and duplicate/rate guards.

The PWA caches only GET navigation responses. It never caches mutation responses, tokens or API payloads. Mobile API access tokens are held in session storage for the local connected workflow and expire quickly; refresh credentials are not stored there.

## Payments

The API creates Razorpay Orders using database totals and amounts in paise. Webhooks authenticate the exact raw body with HMAC-SHA256 and use the provider event ID for durable idempotency. Payment state moves monotonically in the background processor. Browser success callbacks are informative only and never mark a payment captured.

## Production checklist

- Generate four independent secrets with a secrets manager.
- Restrict `WEB_ORIGIN` to exact HTTPS origins.
- Use TLS for PostgreSQL, Redis and object storage.
- Keep D1/R2 bindings and provider secrets in platform configuration, not source.
- Configure Razorpay webhook IP/secret controls and alert on failed processing.
- Add provider-side CAPTCHA escalation for suspicious OTP/enquiry traffic.
- Run object malware scanning before media becomes public.
- Schedule expired-contact deletion, audit-chain verification and session cleanup.
- Test data export and deletion against legal retention exceptions.
- Review regional admin scopes and key rotation at least quarterly.

## Incident response

Revoke affected sessions, rotate the specific secret, preserve immutable logs, disable provider callbacks if integrity is uncertain and assess notification obligations. Never “repair” an audit event in place; append a corrective event linked to the incident.
