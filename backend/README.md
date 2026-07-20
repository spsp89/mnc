# BNC Go Backend

Go + PostgreSQL API for the BNC marketplace/catalog app.

## Setup

1. Install Go and PostgreSQL.
2. Start PostgreSQL:

```powershell
docker compose up -d
```

Or create a local database manually:

```powershell
createdb bnc
```

3. Run migration manually if you are not using Docker Compose:

```powershell
psql postgres://postgres:postgres@localhost:5432/bnc -f migrations/001_init.sql
```

4. Start API:

```powershell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/bnc?sslmode=disable"
$env:ADMIN_TOKEN="change-me"
go mod tidy
go run ./cmd/api
```

Default API URL: `http://localhost:8080`

Admin UI:

```text
http://localhost:8080/admin
```

Local admin token:

```text
change-me
```

For production, set a stronger token before starting the server:

```powershell
$env:ADMIN_TOKEN="use-a-long-private-token"
```

## Main Endpoints

- `GET /health`
- `GET /api/catalog`
- `GET /api/catalog?query=salon&category=beauty&featured=true&sort=rating&limit=10`
- `GET /api/categories`
- `GET /api/business/{slug}`
- `GET /api/deals`
- `GET /api/deals?section=combo`
- `GET /api/clinics`
- `GET /api/clinics?query=dental`
- `GET /api/clinics/{slug}`
- `POST /api/booking-requests`

Open `/admin` in the browser to sign in before using the admin panel.
Local default username is `admin`. The password uses `ADMIN_PASSWORD`, or `ADMIN_TOKEN` when `ADMIN_PASSWORD` is not set.

Admin writes also support `Authorization: Bearer <ADMIN_TOKEN>`.

- `POST /api/admin/categories`
- `PATCH /api/admin/categories/{slug}`
- `DELETE /api/admin/categories/{slug}`
- `POST /api/admin/businesses`
- `PATCH /api/admin/businesses/{slug}`
- `DELETE /api/admin/businesses/{slug}`
- `POST /api/admin/clinics`
- `PATCH /api/admin/clinics/{slug}`
- `DELETE /api/admin/clinics/{slug}`
- `POST /api/admin/doctors`
- `PATCH /api/admin/doctors/{slug}`
- `DELETE /api/admin/doctors/{slug}`
- `POST /api/admin/deals`
- `PATCH /api/admin/deals/{slug}`
- `DELETE /api/admin/deals/{slug}`

## Flutter API URLs

For Flutter Chrome/web, use:

```text
http://localhost:8080
```

For Android emulator, use:

```text
http://10.0.2.2:8080
```

For a real Android phone, use your computer Wi-Fi IP:

```text
http://YOUR_PC_WIFI_IP:8080
```

Example:

```powershell
flutter run --dart-define=CATALOG_API_BASE_URL=http://192.168.1.16:8080
flutter build apk --release --dart-define=CATALOG_API_BASE_URL=http://192.168.1.16:8080
```

Make sure Windows Firewall allows the Go backend port `8080`.

## Next.js Connection

When the Next.js website is ready, point it to this backend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Use these shared endpoints from the website:

- `/api/catalog`
- `/api/categories`
- `/api/business/{slug}`
- `/api/deals`
- `/api/clinics`
- `/api/clinics/{slug}`

## Image Strategy

Current local-first image handling supports:

- bundled mockup paths like `/mockup/im-restaurant.jpg`
- full remote URLs like `https://...`

The admin panel stores image paths/URLs in PostgreSQL. Full file upload storage can be added later without changing the app contract.
