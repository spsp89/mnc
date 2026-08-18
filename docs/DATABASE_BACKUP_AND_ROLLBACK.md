# Database backup and rollback

## Backup

1. Put deploy-time write-heavy jobs into maintenance mode and record the current migration name.
2. Create an encrypted custom-format backup from a trusted host:
   `pg_dump --format=custom --no-owner --no-acl --file=nearu-predeploy-YYYYMMDDHHMM.dump "$DIRECT_DATABASE_URL"`
3. Verify it with `pg_restore --list nearu-predeploy-YYYYMMDDHHMM.dump` and copy it to encrypted, access-controlled storage with retention and checksum metadata.
4. Test restoration regularly into an isolated database; a backup is not verified until a restore succeeds.

## Application rollback

1. Stop the rollout and restore the previous API/web/worker artifacts while leaving compatible additive migrations in place.
2. Confirm health, login, reads, queues, and payment webhook idempotency. Re-enable traffic gradually.

## Database rollback

Prisma production migrations do not provide automatic down migrations. The Sprint 6 migration is additive, so prefer an application rollback while retaining its tables/columns. If a database restore is unavoidable:

1. Stop all writers and webhook consumers; preserve inbound webhook events for replay.
2. Create a forensic backup of the failed database.
3. Restore the verified pre-deploy dump into a new database, point a canary API at it, and validate counts and critical records.
4. Switch the production connection only after validation. Reconcile writes made after the backup (especially payments and enquiries) from provider/webhook and operational logs before reopening traffic.

Never drop production columns or tables ad hoc. Prepare and peer-review a forward corrective migration.
