# BNC Nearu Web

Next.js public website, admin panel, SQLite catalog backend, and JSON API for the BNC/Nearu marketplace.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` or the port printed by Next.js.

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

## Admin Notes

The admin panel writes to `data/nearu.db` using Node SQLite. Adding a category or business with an existing slug updates that record instead of crashing on duplicates.

Admin controls currently support:

- Add or update categories.
- Add or update business listings.
- Toggle category active state.
- Toggle featured and popular placement.
- Delete business listings.

## Validation

```bash
npm.cmd run lint
npm.cmd run build
```
