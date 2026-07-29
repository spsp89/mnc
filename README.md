# BNC Nearu

Flutter mobile app plus the `nearu-web` Next.js marketplace, admin panel, catalog API, and local SQLite data source.

## Local Setup

Start the web/API app first:

```bash
cd nearu-web
npm install
npm run dev
```

Then run Flutter against that local API:

```bash
flutter pub get
flutter run -d chrome
```

Chrome defaults to `http://localhost:3000`. Android emulator builds default to `http://10.0.2.2:3000`. For a physical device, use the computer's LAN address instead, for example `http://192.168.1.20:3000`.

## Flutter Runtime Configuration

- `CATALOG_API_BASE_URL` points the app at the Next.js API.
- `CATALOG_API_TIMEOUT_SECONDS` controls request timeout duration. The default is `20`.
- `USE_CATALOG_FALLBACK` keeps local fallback data available when the API is unreachable. Set it to `false` when checking production-like behavior.

Example:

```bash
flutter run -d chrome \
  --dart-define=CATALOG_API_BASE_URL=http://localhost:3000 \
  --dart-define=USE_CATALOG_FALLBACK=false
```

## Web Environment

Copy `nearu-web/.env.example` to `nearu-web/.env.local` for local overrides. Production deployments should set:

- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

The admin panel uses a lightweight signed cookie session. Local development falls back to `admin` / `admin` only when admin credentials are not configured.

## Android Release Notes

Debug Android builds allow cleartext HTTP so the emulator can reach the local Next.js API. Release builds disable cleartext traffic by default.

To sign Android release builds, create `android/key.properties` locally:

```properties
storeFile=../release-keystore.jks
storePassword=replace-me
keyAlias=nearu
keyPassword=replace-me
```

This file is ignored by Git. Keep the keystore and passwords outside source control.

## Validation

Web/API tests:

```bash
cd nearu-web
npm test
```

Flutter checks:

```bash
flutter analyze
flutter test
```
