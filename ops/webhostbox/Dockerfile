FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BNC_API_URL
ARG NEXT_PUBLIC_BASE_PATH
ARG BNC_ALLOW_HTTP

ENV NODE_ENV=production \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_BNC_API_URL=${NEXT_PUBLIC_BNC_API_URL} \
    NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH} \
    BNC_ALLOW_HTTP=${BNC_ALLOW_HTTP} \
    DATABASE_URL=postgresql://bnc:build-only@postgres:5432/bnc?schema=public \
    DIRECT_DATABASE_URL=postgresql://bnc:build-only@postgres:5432/bnc?schema=public \
    REDIS_URL=redis://redis:6379 \
    JWT_ACCESS_SECRET=build-only-jwt-access-secret-0000000000000000 \
    JWT_REFRESH_SECRET=build-only-jwt-refresh-secret-000000000000000 \
    OTP_HASH_SECRET=build-only-otp-hash-secret-000000000000000000 \
    ENQUIRY_DATA_KEY=build-only-enquiry-data-key-0000000000000000 \
    OBJECT_STORAGE_REGION=ap-south-1 \
    OBJECT_STORAGE_BUCKET=bnc-media-015872246618-ap-south-1

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY scripts/patch-vinext-windows.mjs scripts/patch-vinext-windows.mjs
RUN npm ci --include=dev --no-audit --no-fund

COPY . .
RUN npm run prisma:generate \
    && npm run api:build \
    && npm run build:vercel

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app

EXPOSE 3000 4000
