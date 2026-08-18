# Operations runbook

## Health and alerts

Monitor API error rate, p95 latency, PostgreSQL connections, Redis memory, BullMQ waiting/failed counts, OTP throttles, enquiry duplicates, lead acceptance, Razorpay webhook delay, payment reconciliation differences and object-scan failures.

Alert immediately when payment webhook age exceeds five minutes, the audit chain fails verification, contact decryption fails, or lead contact is returned without an accepted assignment.

## Queue handling

- Payment jobs retry exponentially and remain idempotent by webhook event ID.
- Lead matching jobs may be replayed because assignment uniqueness prevents duplicate recipients.
- Notification delivery should store channel outcome and provider reference.
- Pause a queue before changing payload semantics.
- Inspect failed jobs, correct the cause, then retry; never delete payment failures merely to clear a dashboard.

## Scheduled work

- Every 15 minutes: expire stale lead assignments and offers.
- Hourly: reconcile pending payments and provider events.
- Daily: remove expired OTP/session keys and anonymize expired enquiry contact payloads.
- Daily: verify audit hash continuity.
- Weekly: rebuild search documents and inspect zero-result queries.
- Monthly: review admin roles, object retention and provider spend.

## Reward-draw activation gate

1. Leave `DRAW_FEATURE_ENABLED=false` in every production-like environment until legal, tax, eligibility and prize-publication rules have written approval.
2. Store a traceable approval identifier in `DRAW_LEGAL_APPROVAL_REFERENCE` and a dedicated random secret of at least 32 characters in `DRAW_CODE_SECRET`. Never reuse JWT secrets or rely on a local fallback.
3. Enable the feature only through reviewed deployment configuration. Opening, issuing, claiming, selecting and publishing all fail closed while disabled; the public feed and customer-entry feed return no active records.
4. Before enablement, test minimum purchase, one-time claim, delivered-and-captured order eligibility, campaign boundaries, deterministic evidence, winner publication wording, tax handling and incident rollback.
5. To suspend a campaign immediately, set `DRAW_FEATURE_ENABLED=false` and restart the API workers. Preserve campaign, entry and selection evidence; do not delete or manually replace a selected winner.

## Support playbooks

### Customer says a business contacted them unexpectedly

Locate the enquiry and assignment by request ID, confirm consent snapshot and acceptance time, suspend the business when access lacks a valid path, preserve audit evidence and start privacy-incident assessment.

### Paid order remains pending

Check persisted webhook events first, then the Razorpay order/payment status. Replay the stored event through the worker only after confirming signature acceptance. Do not trust a browser callback or manually mark capture without provider evidence.

### Delivery-provider reconciliation

1. Configure exactly one external adapter (`PORTER` or `HTTP`) with an HTTPS base URL, API token, and a minimum 16-character webhook secret. Keep `MANUAL` selected until the provider sandbox is certified.
2. Register `POST /api/v1/deliveries/webhooks/{provider}` at the provider. Every callback must include a stable `x-bnc-delivery-event-id` and `x-bnc-delivery-signature`, calculated as the lowercase hexadecimal HMAC-SHA256 of the exact raw request body. A `sha256=` prefix is accepted.
3. Reconcile provider references and shipment status against `WebhookEvent` records using provider `DELIVERY_{PROVIDER}`. Investigate `FAILED` records; `IGNORED` records represent duplicate/no-op or regressive/terminal-state updates.
4. Compare provider dispatches with `DeliveryShipment` rows by provider and provider reference. Use the authenticated tracking operation to refresh non-terminal shipments; never edit a terminal row to simulate a provider result.
5. Before production enablement, prove duplicate acknowledgement, invalid-signature rejection, out-of-order handling, cancellation, delivery proof, and settlement totals in the provider sandbox.

### WhatsApp-provider activation and reconciliation

1. Keep `WHATSAPP_PROVIDER=DISABLED` until an official provider account and approved message templates exist. Configure the HTTPS API URL/token, send path, minimum 16-character webhook secret, daily limit, and a JSON `NotificationType`-to-approved-template map together.
2. Register `POST /api/v1/notifications/whatsapp/webhooks`. Each callback must include stable `x-bnc-whatsapp-event-id` and `x-bnc-whatsapp-signature` headers; the signature is lowercase hexadecimal HMAC-SHA256 over the exact raw body (an optional `sha256=` prefix is accepted).
3. A channel preference alone is insufficient: outbound dispatch also requires the latest `WHATSAPP_NOTIFICATIONS` consent to be granted with either `{ "all": true }` or a matching `notificationTypes` array. STOP, UNSUBSCRIBE, or CANCEL callbacks append a withdrawal record and disable all WhatsApp preferences for the user.
4. Provider API acceptance is recorded as `ACCEPTED`; delivery/read/failure is updated only from an authenticated callback. Reconcile callback rows under provider `WHATSAPP_HTTP` in `WebhookEvent`; duplicates are acknowledged without replaying state.
5. Before enablement, certify approved templates, opt-in evidence, STOP processing, daily cap, retry ceiling, duplicate callbacks, invalid signatures, provider failure mapping and phone-number normalization in the provider sandbox. Never bulk-import contacts or infer marketing consent from enquiries.

### Search result seems unfair

Record the query, location/radius, ranking version and sponsored labels. Compare plan ordering separately from organic score. Any weight change requires a new configuration version and audit reason.

### Verification dispute

Keep evidence private, assign a reviewer outside the original decision where possible and append a new decision record. Do not overwrite the original audit entry.

## Backup and recovery

Use encrypted automated PostgreSQL backups with point-in-time recovery and perform restore drills. Enable Redis persistence for durable queue metadata while treating PostgreSQL as the business source of truth. Version or lifecycle R2/S3 objects according to retention. Recovery is incomplete until a search, enquiry, lead acceptance and webhook replay pass.
