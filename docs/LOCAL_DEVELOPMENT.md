# Local development

This Windows workstation uses isolated, portable PostgreSQL and Redis runtimes. They do not replace or modify the system PostgreSQL installation.

## Prerequisites

- Node.js 22.13 or newer
- Repository dependencies installed with `npm install`
- Portable dependency files under `D:\BNC-local`
- Root `.env` configured for PostgreSQL on port `55433` and Redis on port `6379`

Start or verify both data services from the repository root:

```powershell
npm run local:dependencies
node scripts/check-local-services.mjs
```

If the portable files are moved, call the helper directly with the new base directory:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local-dependencies.ps1 -BasePath "D:\BNC-local"
```

The helper is idempotent: it leaves healthy processes running and starts only missing BNC dependencies. PostgreSQL listens on `127.0.0.1:55433`; Redis listens on `127.0.0.1:6379`.

## Database setup

Apply committed migrations and load the local demo data:

```powershell
npx prisma migrate deploy --config apps/api/prisma.config.ts
npm run demo:seed
npm run demo:local-logins
```

Do not use these demo accounts outside local development:

| Panel | Email | Password |
| --- | --- | --- |
| Customer | `c@bnc.in` | `Demo@12345` |
| Merchant | `m@bnc.in` | `Demo@12345` |
| Admin | `a@bnc.in` | `Demo@12345` |

## Run the API and web app

Use separate PowerShell terminals from the repository root:

```powershell
npm run api:dev
```

```powershell
npm run dev -- --port 3001
```

To exercise a production web build over local plain HTTP, explicitly disable
secure cookies for that loopback-only process. Never use this override on a
public or HTTPS deployment:

```powershell
npm run build:vercel
$env:BNC_SECURE_COOKIES = "false"
npx next start --hostname 127.0.0.1 --port 3001
```

Production keeps secure cookies enabled by default.

Local entry points:

- Public website: `http://127.0.0.1:3001/`
- Customer login: `http://127.0.0.1:3001/login`
- Merchant login: `http://127.0.0.1:3001/merchant/login`
- Admin login: `http://127.0.0.1:3001/admin/login`
- API: `http://127.0.0.1:4000/api/v1`
- API liveness: `http://127.0.0.1:4000/api/v1/health`
- API readiness: `http://127.0.0.1:4000/api/v1/health/ready`
- Swagger: `http://127.0.0.1:4000/api/docs`

## Verification

```powershell
npm run lint
npm run typecheck
npm run api:test
npm test
npm run test:responsive
```

Run Flutter analysis and all customer-app tests with compiler output redirected
away from the space-constrained Windows system temp directory:

```powershell
npm run flutter:verify:local
```

Build a local Android debug APK with the compiler and Gradle caches redirected
to drive D:

```powershell
npm run flutter:build:android:local
```

The mobile local configuration targets the Android emulator loopback aliases:
API `http://10.0.2.2:4000/api/v1` and website `http://10.0.2.2:3001`.
The APK is written to `flutter app\build\app\outputs\flutter-apk\app-debug.apk`.
This is a debug/testing artifact; production distribution still requires a
release keystore, provider configuration, and device QA.

Verified local build on 2026-08-17:

- package/version: `in.bnc.bnc_mobile` / `1.1.0+2`
- minimum/target SDK: 24 / 36
- size: 173,102,746 bytes (165.08 MB)
- SHA-256: `61C26D5D2AC10846008200FFCB2DEFAB9F876353FC4BB3B6C8F9D76CCDA25BB4`
- launch activity: `in.bnc.bnc_mobile.MainActivity`
- integrity: four-byte ZIP alignment and APK Signature Scheme v2 verified
- signer: Android debug certificate (not a production upload certificate)

This confirms compilation and APK packaging only. Installation and runtime
flows still need verification on an Android emulator or physical device.

The web server may choose a different port if the requested port is already occupied. Always use the URL printed by the development server.
