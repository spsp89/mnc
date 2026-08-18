#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="${BNC_DEPLOY_ROOT:-$(cd "${SCRIPT_DIR}/../../.." && pwd)}"
APP_ROOT="${DEPLOY_ROOT}/app"
CONFIG_DIR="${DEPLOY_ROOT}/config"
DATA_DIR="${DEPLOY_ROOT}/data"
LOG_DIR="${DEPLOY_ROOT}/logs"
RUN_DIR="${DEPLOY_ROOT}/run"
ENV_FILE="${DEPLOY_ROOT}/.env.production"
TOKEN_FILE="${DEPLOY_ROOT}/.origin-token"
PG_BIN="${DEPLOY_ROOT}/runtime/postgres/usr/bin"
PG_LIB="${DEPLOY_ROOT}/runtime/postgres/usr/lib64"
PUBLIC_HOST="${BNC_PUBLIC_HOST:-d3enmc1q3ihoro.cloudfront.net}"

umask 077
mkdir -p \
  "${CONFIG_DIR}" \
  "${DATA_DIR}/postgres" \
  "${DATA_DIR}/valkey" \
  "${LOG_DIR}" \
  "${RUN_DIR}/postgres"

if [[ ! -x "${PG_BIN}/initdb" ]]; then
  echo "PostgreSQL runtime is missing at ${PG_BIN}" >&2
  exit 1
fi

if [[ ! -f "${TOKEN_FILE}" ]]; then
  openssl rand -hex 32 > "${TOKEN_FILE}"
  chmod 600 "${TOKEN_FILE}"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  jwt_access_secret="$(openssl rand -hex 48)"
  jwt_refresh_secret="$(openssl rand -hex 48)"
  enquiry_data_key="$(openssl rand -hex 32)"
  fingerprint_key="$(openssl rand -hex 32)"
  otp_hash_secret="$(openssl rand -hex 32)"
  origin_token="$(tr -d '\r\n' < "${TOKEN_FILE}")"

  {
    printf '%s\n' \
      "NODE_ENV=production" \
      "PORT=4000" \
      "FRONTEND_PORT=3000" \
      "GATEWAY_HOST=0.0.0.0" \
      "GATEWAY_PORT=8088" \
      "PUBLIC_HOST=${PUBLIC_HOST}" \
      "NEXT_PUBLIC_SITE_URL=https://${PUBLIC_HOST}" \
      "NEXT_PUBLIC_BNC_API_URL=https://${PUBLIC_HOST}/api/v1" \
      "NEXT_PUBLIC_MAPBOX_TOKEN=" \
      "WEB_ORIGIN=https://${PUBLIC_HOST}" \
      "DATABASE_URL=postgresql://ec2-user@127.0.0.1:55432/bnc?schema=public" \
      "DIRECT_DATABASE_URL=postgresql://ec2-user@127.0.0.1:55432/bnc?schema=public" \
      "REDIS_URL=redis://127.0.0.1:56379" \
      "JWT_ACCESS_SECRET=${jwt_access_secret}" \
      "JWT_REFRESH_SECRET=${jwt_refresh_secret}" \
      "ENQUIRY_DATA_KEY=${enquiry_data_key}" \
      "FINGERPRINT_KEY=${fingerprint_key}" \
      "OTP_HASH_SECRET=${otp_hash_secret}" \
      "OBJECT_STORAGE_ENDPOINT=" \
      "OBJECT_STORAGE_REGION=ap-south-1" \
      "OBJECT_STORAGE_BUCKET=bnc-media-015872246618-ap-south-1" \
      "OBJECT_STORAGE_ACCESS_KEY_ID=" \
      "OBJECT_STORAGE_SECRET_ACCESS_KEY=" \
      "OBJECT_STORAGE_PUBLIC_URL=" \
      "OBJECT_STORAGE_SIGNED_URL_TTL_SECONDS=300" \
      "OBJECT_STORAGE_MAX_IMAGE_BYTES=10000000" \
      "OBJECT_STORAGE_MAX_DOCUMENT_BYTES=5000000" \
      "BNC_ORIGIN_TOKEN=${origin_token}" \
      "LOG_LEVEL=info"
  } > "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
fi

cat > "${CONFIG_DIR}/valkey.conf" <<EOF
bind 127.0.0.1
protected-mode yes
port 56379
daemonize no
supervised no
dir ${DATA_DIR}/valkey
appendonly yes
appendfsync everysec
loglevel notice
logfile ${LOG_DIR}/valkey.log
pidfile ${RUN_DIR}/valkey.pid
EOF
chmod 600 "${CONFIG_DIR}/valkey.conf"

if [[ ! -f "${DATA_DIR}/postgres/PG_VERSION" ]]; then
  export LD_LIBRARY_PATH="${PG_LIB}:${PG_LIB}/pgsql:${LD_LIBRARY_PATH:-}"
  "${PG_BIN}/initdb" \
    --pgdata="${DATA_DIR}/postgres" \
    --encoding=UTF8 \
    --locale=C.UTF-8 \
    --auth-local=trust \
    --auth-host=trust \
    --username=ec2-user > "${LOG_DIR}/postgres-init.log"
fi

chmod 700 "${DATA_DIR}/postgres" "${DATA_DIR}/valkey"
echo "Isolated BNC runtime configured at ${DEPLOY_ROOT}"
