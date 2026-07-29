# BNC Nearu Web

Next.js public website, admin panel, SQLite catalog backend, and JSON API for the BNC/Nearu marketplace.

## Run Locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000` or the port printed by Next.js.

Set a real local admin password in `.env.local` before opening the admin panel:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-local-password
ADMIN_SESSION_SECRET=use-a-long-random-string
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEARU_DB_PATH=
```

`NEARU_DB_PATH` is optional. Leave it blank for the default `data/nearu.db`; set it only when you want the catalog database somewhere else.

## Main Routes

- `/` renders the approved BNC marketplace homepage.
- `/admin` manages categories and business listings.
- `/api/catalog` returns catalog data for the web and Flutter app.

## Catalog API

The API supports optional filters:

```bash
/api/catalog
/api/catalog?q=tailor
/api/catalog?category=restaurants
/api/catalog?featured=true
/api/catalog?popular=true&limit=6
/api/catalog?sort=rating
/api/catalog?sort=distance
```

The response includes `categories`, `featured`, `popular`, `all`, `stats`, and the active `filters`.

## SEO

Public pages use Next.js metadata, canonical URLs, Open Graph tags, `robots.txt`, and `sitemap.xml`.
Set `NEXT_PUBLIC_SITE_URL` to the deployed origin so canonical, Open Graph, robots, and sitemap URLs are absolute.

## Production Configuration

Before deploying, set:

- `NEXT_PUBLIC_SITE_URL` to the public origin, for example `https://example.com`.
- `ADMIN_USERNAME` to the admin username.
- `ADMIN_PASSWORD` to a strong password.
- `ADMIN_SESSION_SECRET` to a separate long random value. Production admin sessions fail closed if this is missing.
- `NEARU_DB_PATH` only if the SQLite database should live outside the default `data/nearu.db`.

The app adds basic security headers through `next.config.ts` and keeps `/admin` and `/api` out of `robots.txt`.

## Admin Notes

The admin panel is protected by a lightweight signed-cookie login at `/admin/login`.
It writes to `data/nearu.db` using Node SQLite. Adding a category or business with an existing slug updates that record instead of crashing on duplicates.

## Image Handling

Business listings use a local-first image strategy:

- Admin stores one optional hosted cover image URL plus a cover variant.
- The API returns an `images` array with `cover`, `thumbnail`, and `logo` roles.
- If no image URL is provided, the API uses development-friendly fallback images from the selected cover variant.
- Logo images are generated placeholders from the business name and badge color.
- No file upload/storage service is required for local development.

Admin controls currently support:

- Add or update categories.
- Add or update business listings.
- Toggle category active state.
- Toggle featured and popular placement.
- Delete business listings.

## Validation

```bash
npm.cmd run lint
npm.cmd test
npx.cmd tsc --noEmit
npm.cmd run build
```

`npm.cmd test` compiles the focused test suite with `tsconfig.test.json` and runs it with Node's built-in test runner. The tests use a temporary SQLite database via `NEARU_DB_PATH`, so they do not mutate `data/nearu.db`.
