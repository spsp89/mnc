# BNC WebHostBox test deployment

Last verified: 7 August 2026 (Asia/Kolkata)

This document describes the isolated BNC test deployment on the existing
WebHostBox server. The source, configuration, database data, Redis data, logs,
and backups are all under `/srv/bnc`.

Do not write passwords, database URLs, JWT secrets, object-storage keys, or
other secret values into this file. The server-generated secrets are stored
only in `/srv/bnc/.env.production`, which is owned by `root` and has mode
`600`.

## Live endpoints

- Website: <http://66.116.240.235/bnc>
- Search verification:
  <http://66.116.240.235/bnc/search?q=Restaurants&radius=5>
- API health:
  <http://66.116.240.235/bnc/api/v1/health>
- API base: `http://66.116.240.235/bnc/api/v1`
- API documentation:
  <http://66.116.240.235/bnc/api/docs>

The database contains a comprehensive, explicitly labelled production-testing
dataset shared by the website and Flutter clients. It covers all marketplace
categories and the customer, business, catalogue, enquiry, commerce,
moderation, finance, verification, support, analytics, and administration
lifecycles. Disposable panel credentials are documented in
`docs/LIVE_DEMO_DATA.md`; infrastructure secrets and session tokens are not
stored in the repository.

## Server access

- Management panel: <https://panel.webhostbox.net>
- Public server IP: `66.116.240.235`
- SSH user: `root`
- Server hostname: `akpa.in`
- Operating system: Ubuntu 22.04.5 LTS
- Docker Engine: `29.1.3`
- Docker Compose: standalone `docker-compose` 1.29.2
- nginx: system service on ports `80` and `443`
- Server memory: approximately 12 GB
- Root filesystem: approximately 295 GB

The root password was provided separately by the server owner and is not
stored in this repository. Connect with:

```bash
ssh root@66.116.240.235
```

The command prompts for the password. Do not put the password in a command,
script, environment file, Markdown file, or shell history.

The management panel was not used for this deployment because its frontend
failed before rendering the login form. SSH and the installed Docker/nginx
tools were used instead.

## Isolation from existing sites

The pre-existing Bizscan application was not edited or restarted:

- Existing public site: <https://bizscan.pro>
- Existing containers: `deploy_web_1`, `deploy_api_1`, `deploy_db_1`
- Other existing container: `open-webui`
- Existing nginx file:
  `/etc/nginx/sites-available/bizscan.pro`
- Bizscan response before and after BNC setup: HTTP `200`
- Bizscan nginx configuration checksum remained unchanged:
  `819847cffade0f0fada5359605b9bcf444dbc330347e0261518a990d22d21b67`

BNC uses its own:

- Folder: `/srv/bnc`
- Docker Compose project: `bnc`
- Docker network: `bnc_internal`
- Containers: `bnc_web_1`, `bnc_api_1`, `bnc_postgres_1`,
  `bnc_redis_1`
- Loopback ports: `3100` and `4100`
- Database and Redis data directories
- nginx access and error logs

Docker stores image layers and container metadata in its standard
`/var/lib/docker` storage. The only nginx entry outside `/srv/bnc` is the
following symlink:

```text
/etc/nginx/sites-enabled/bnc
  -> /srv/bnc/config/nginx-bnc.conf
```

## Remote layout

```text
/srv/bnc/
├── .env.production          # private runtime and database secrets; mode 600
├── app/                     # uploaded BNC source
│   └── ops/webhostbox/
│       ├── Dockerfile
│       ├── compose.yml
│       └── nginx-bnc.conf
├── backups/
│   ├── bnc-initial-20260807T063452Z.dump
│   ├── bnc-before-live-demo-seed-20260807T080030Z.dump
│   ├── bnc-before-offer-correction-20260807T083048Z.dump
│   └── bnc-source-before-public-live-data-20260807T082226Z.tar.gz
├── config/
│   └── nginx-bnc.conf       # live nginx configuration
├── data/
│   ├── postgres/            # BNC-only PostgreSQL/PostGIS data
│   └── redis/               # BNC-only Redis append-only data
└── logs/
    ├── nginx-access.log
    └── nginx-error.log
```

Do not upload into `/srv/bizscan`, `/srv/bizscan-releases`, `/var/www`, or an
existing Docker volume.

## Runtime containers

| Service | Container | Internal address | Host binding | Public |
|---|---|---|---|---|
| Next.js frontend | `bnc_web_1` | `web:3000` | `127.0.0.1:3100` | Through nginx only |
| NestJS API | `bnc_api_1` | `api:4000` | `127.0.0.1:4100` | Through nginx only |
| PostgreSQL/PostGIS | `bnc_postgres_1` | `postgres:5432` | None | No |
| Redis | `bnc_redis_1` | `redis:6379` | None | No |

The frontend and API share one Docker image:

```text
bnc-app:20260807
```

Approximate idle memory observed after deployment:

| Container | Memory |
|---|---:|
| Frontend | 70 MiB |
| API | 128 MiB |
| PostgreSQL/PostGIS | 54 MiB |
| Redis | 4 MiB |
| Total | approximately 256 MiB |

The image is approximately 2.66 GB on disk because it contains the build
toolchain needed for future Prisma migrations and rebuilds. The running
services are comparatively light.

## Database

- Database engine: PostgreSQL 16 with PostGIS 3.4
- Database: `bnc`
- Database user: `bnc`
- Internal host: `postgres`
- Internal port: `5432`
- Host/public port: none
- Data directory: `/srv/bnc/data/postgres`
- Password location: `/srv/bnc/.env.production` only
- Completed Prisma migrations: `5`
- Demo businesses: `20` managed records (`15` active and `5` workflow states)
- Demo accounts: `9` customer, owner/team, and operational-role identities
- Demo categories: `46` seed-managed categories and subcategories
- Demo catalogue: `45` seed-managed products, `90` variants, and `30` services
- Demo operations: offers, leads, enquiries, messages, reviews, orders,
  payments, refunds, subscriptions, verification, support, notifications,
  analytics, advertising, translations, ranking, and audit data

Applied migrations:

```text
20260803130000_initial
20260803154500_webhook_and_analytics
20260803172000_product_service_media
20260803184500_account_reviews_conversations
20260807090000_identity_roles_and_product_workflow
```

The initial restorable database backup is:

```text
/srv/bnc/backups/bnc-initial-20260807T063452Z.dump
```

The verified rollback points created for the live demo-data rollout are:

```text
/srv/bnc/backups/bnc-before-live-demo-seed-20260807T080030Z.dump
/srv/bnc/backups/bnc-before-offer-correction-20260807T083048Z.dump
/srv/bnc/backups/bnc-source-before-live-demo-seed-20260807T080030Z.tar.gz
/srv/bnc/backups/bnc-source-before-public-live-data-20260807T082226Z.tar.gz
/srv/bnc/backups/bnc-source-before-admin-inventory-20260807T094500Z.tar.gz
```

All files are owned by `root` and use mode `600`; the database dumps were
validated by listing their `pg_restore` tables of contents.

Create a new backup before every database migration:

```bash
backup="/srv/bnc/backups/bnc-$(date -u +%Y%m%dT%H%M%SZ).dump"

docker exec bnc_postgres_1 \
  pg_dump -U bnc -d bnc -Fc > "$backup"

chmod 600 "$backup"
stat -c '%A %U:%G %s %n' "$backup"
```

The guarded demo seed can be rerun only when shared test data is explicitly
required:

```bash
docker exec bnc_api_1 \
  npm run demo:seed --workspace @bnc/api -- --confirm-live-demo
```

It updates deterministic demo records without deleting unrelated data. Always
create and validate a fresh backup first.

## nginx routing

The BNC nginx configuration is stored inside the project:

```text
/srv/bnc/config/nginx-bnc.conf
```

It responds only when the HTTP host is `66.116.240.235`:

- `/bnc` and `/bnc/*` proxy to the Next.js container.
- `/bnc/api/v1/*` proxies to the NestJS API.
- `/bnc/api/docs*` proxies to the NestJS Swagger UI.
- Other domains continue to use their existing virtual hosts.

After changing the checked-in nginx file, activate it with:

```bash
cp \
  /srv/bnc/app/ops/webhostbox/nginx-bnc.conf \
  /srv/bnc/config/nginx-bnc.conf

chmod 644 /srv/bnc/config/nginx-bnc.conf
nginx -t
systemctl reload nginx
```

Never reload nginx unless `nginx -t` reports that the configuration is
successful.

## Start, stop, status, and logs

Connect over SSH and use:

```bash
cd /srv/bnc

docker-compose \
  -p bnc \
  -f app/ops/webhostbox/compose.yml \
  ps
```

Start or recover the complete BNC stack:

```bash
cd /srv/bnc

docker-compose \
  -p bnc \
  -f app/ops/webhostbox/compose.yml \
  up -d postgres redis api web
```

Stop BNC without deleting its data:

```bash
cd /srv/bnc

docker-compose \
  -p bnc \
  -f app/ops/webhostbox/compose.yml \
  stop web api redis postgres
```

Do not run `docker-compose down -v`; the `-v` option can remove database or
Redis data.

View application logs:

```bash
docker logs --tail 200 bnc_web_1
docker logs --tail 200 bnc_api_1
docker logs --tail 200 bnc_postgres_1
docker logs --tail 200 bnc_redis_1

tail -n 200 /srv/bnc/logs/nginx-access.log
tail -n 200 /srv/bnc/logs/nginx-error.log
```

View current resource use:

```bash
docker stats --no-stream \
  bnc_web_1 \
  bnc_api_1 \
  bnc_postgres_1 \
  bnc_redis_1
```

## Future source upload

Run this from the local project root:

```bash
cd '/Volumes/SSD/Documents/bnc demo 3'

rsync -az \
  --exclude='.git/' \
  --exclude='.next/' \
  --exclude='node_modules/' \
  --exclude='dist/' \
  --exclude='.vercel/' \
  --exclude='.wrangler/' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='flutter app/' \
  --exclude='flutterapp.md' \
  --exclude='.DS_Store' \
  ./ \
  root@66.116.240.235:/srv/bnc/app/
```

This command does not use `--delete`, so it cannot delete remote files. It
prompts for the separately managed root password.

Never upload a local `.env`, `.env.local`, PEM, private key, database dump, or
credential file.

## Rebuild and migrate after an upload

First connect:

```bash
ssh root@66.116.240.235
cd /srv/bnc
```

Create a database backup:

```bash
backup="/srv/bnc/backups/bnc-before-update-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker exec bnc_postgres_1 \
  pg_dump -U bnc -d bnc -Fc > "$backup"
chmod 600 "$backup"
```

Stop and remove only the replaceable BNC web/API containers:

```bash
docker-compose \
  -p bnc \
  -f app/ops/webhostbox/compose.yml \
  stop web api

docker-compose \
  -p bnc \
  -f app/ops/webhostbox/compose.yml \
  rm -f web api
```

Build the shared production image:

```bash
docker-compose \
  -p bnc \
  -f app/ops/webhostbox/compose.yml \
  build api
```

Apply forward-only Prisma migrations:

```bash
docker-compose \
  -p bnc \
  -f app/ops/webhostbox/compose.yml \
  run --rm api \
  sh -lc 'cd apps/api && npx prisma migrate deploy'
```

Start the new API and frontend:

```bash
docker-compose \
  -p bnc \
  -f app/ops/webhostbox/compose.yml \
  up -d api web
```

Confirm that all four containers show `Up (healthy)` before considering the
upload complete:

```bash
docker-compose \
  -p bnc \
  -f app/ops/webhostbox/compose.yml \
  ps
```

For a code-only update, nginx does not need to be changed or reloaded.

## Verification checklist

From the server:

```bash
curl -I http://66.116.240.235/bnc
curl -I \
  'http://66.116.240.235/bnc/search?q=Restaurants&radius=5'
curl http://66.116.240.235/bnc/api/v1/health
curl -I http://66.116.240.235/bnc/api/docs

# The existing site must remain healthy.
curl -I https://bizscan.pro
```

Expected:

- BNC homepage: HTTP `200`
- BNC search: HTTP `200`
- API health: HTTP `200` with `status: healthy`
- API documentation and its CSS/JavaScript: HTTP `200`
- Bizscan: HTTP `200`
- Browser console errors/warnings: none
- Frontend links and static assets use the `/bnc` prefix

The frontend and API ports must remain private:

```bash
ss -lntp | grep -E ':(3100|4100) '
```

Both ports must show `127.0.0.1`, never `0.0.0.0`.

## Current limitations

This is a raw-IP HTTP test deployment, not a production release:

- Phone authentication can use the temporary universal code `123456` only
  when `/srv/bnc/.env.production` explicitly sets
  `TEST_FIXED_OTP_ENABLED=true`. The request endpoint still creates a
  rate-limited, five-minute challenge before verification. Disable the flag
  before any production launch; fixed-code mode does not queue an SMS.

- HTTPS is not configured for the BNC IP route.
- Secure cookies and automatic HTTP-to-HTTPS content upgrades are disabled
  only for this deployment through private environment flags.
- PostgreSQL and Redis are protected by generated credentials and Docker
  network isolation, but production should use stronger host access controls
  and automated backups.
- The existing private S3 media bucket name is configured, but AWS access-key
  values are intentionally empty. Media upload/download signing will not work
  until a scoped service credential is placed directly into the private
  server environment.
- Razorpay, Google authentication, and email-provider credentials are not
  configured.
- One explicitly labelled demo account has the `SUPER_ADMIN` role for panel
  testing. Remove that role assignment when the shared test account is no
  longer required.

Configured private S3 bucket:

```text
bnc-media-015872246618-ap-south-1
```

Do not create an AWS root access key. If media access is enabled later, use
only a bucket-scoped service identity, copy its key directly into the
mode-`600` remote environment, verify it, and securely discard the one-time
output.

Before production use, add a dedicated domain, managed TLS certificate,
non-root deploy access, secret management, off-host database backups,
monitoring, and provider credentials.

## Local deployment-support files

The following local files define this deployment:

```text
.dockerignore
ops/webhostbox/Dockerfile
ops/webhostbox/compose.yml
ops/webhostbox/nginx-bnc.conf
```

The application also contains:

- Optional `NEXT_PUBLIC_BASE_PATH` support in `next.config.ts`.
- Test-only HTTP cookie support through `BNC_SECURE_COOKIES=false`.
- The required `AuthModule` dependency in `MediaModule`.

Those settings preserve the existing secure defaults when the deployment
variables are absent.
