#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="${BNC_DEPLOY_ROOT:-$(cd "${SCRIPT_DIR}/../../.." && pwd)}"
APP_ROOT="${DEPLOY_ROOT}/app"
ENV_FILE="${DEPLOY_ROOT}/.env.production"
LOG_DIR="${DEPLOY_ROOT}/logs"
RUN_DIR="${DEPLOY_ROOT}/run"
NODE_BIN="${DEPLOY_ROOT}/runtime/node/bin"
PG_BIN="${DEPLOY_ROOT}/runtime/postgres/usr/bin"
PG_RUNTIME="${DEPLOY_ROOT}/runtime/postgres"
PG_LIB_PATH="${PG_RUNTIME}/usr/lib64:${PG_RUNTIME}/usr/lib64/pgsql:${PG_RUNTIME}/usr/pgsql-16/lib:${PG_RUNTIME}/usr/geos312/lib64:${PG_RUNTIME}/usr/proj92/lib64"
VALKEY_BIN="${DEPLOY_ROOT}/runtime/valkey/usr/bin"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Run configure.sh before start.sh" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

export PATH="${NODE_BIN}:${PG_BIN}:${VALKEY_BIN}:${PATH}"
export LD_LIBRARY_PATH="${PG_LIB_PATH}:${LD_LIBRARY_PATH:-}"
mkdir -p "${LOG_DIR}" "${RUN_DIR}" "${RUN_DIR}/postgres"

pid_is_running() {
  local pid_file="$1"
  [[ -f "${pid_file}" ]] && kill -0 "$(cat "${pid_file}")" 2>/dev/null
}

wait_for_url() {
  local url="$1"
  local header_name="${2:-}"
  local header_value="${3:-}"
  local attempt

  for attempt in {1..60}; do
    if [[ -n "${header_name}" ]]; then
      if curl --fail --silent --output /dev/null \
        --header "${header_name}: ${header_value}" "${url}"; then
        return 0
      fi
    elif curl --fail --silent --output /dev/null "${url}"; then
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for ${url}" >&2
  return 1
}

if ! "${PG_BIN}/pg_ctl" \
  --pgdata="${DEPLOY_ROOT}/data/postgres" status >/dev/null 2>&1; then
  "${PG_BIN}/pg_ctl" \
    --pgdata="${DEPLOY_ROOT}/data/postgres" \
    --log="${LOG_DIR}/postgres.log" \
    --options="-h 127.0.0.1 -p 55432 -k ${RUN_DIR}/postgres" \
    start >/dev/null
fi

if ! pid_is_running "${RUN_DIR}/valkey.pid"; then
  nohup "${VALKEY_BIN}/valkey-server" \
    "${DEPLOY_ROOT}/config/valkey.conf" \
    > "${LOG_DIR}/valkey.out" 2>&1 &
  echo "$!" > "${RUN_DIR}/valkey.pid"
fi

if ! pid_is_running "${RUN_DIR}/api.pid"; then
  (
    cd "${APP_ROOT}"
    nohup "${NODE_BIN}/node" apps/api/dist/main.js \
      > "${LOG_DIR}/api.log" 2>&1 &
    echo "$!" > "${RUN_DIR}/api.pid"
  )
fi

if ! pid_is_running "${RUN_DIR}/frontend.pid"; then
  (
    cd "${APP_ROOT}"
    nohup "${NODE_BIN}/node" node_modules/next/dist/bin/next \
      start --hostname 127.0.0.1 --port "${FRONTEND_PORT}" \
      > "${LOG_DIR}/frontend.log" 2>&1 &
    echo "$!" > "${RUN_DIR}/frontend.pid"
  )
fi

if ! pid_is_running "${RUN_DIR}/gateway.pid"; then
  (
    cd "${APP_ROOT}"
    nohup "${NODE_BIN}/node" ops/lightsail/gateway.mjs \
      > "${LOG_DIR}/gateway.log" 2>&1 &
    echo "$!" > "${RUN_DIR}/gateway.pid"
  )
fi

wait_for_url "http://127.0.0.1:${PORT}/api/v1/health"
wait_for_url "http://127.0.0.1:${FRONTEND_PORT}/"
wait_for_url \
  "http://127.0.0.1:${GATEWAY_PORT}/api/v1/health" \
  "X-BNC-Origin-Token" \
  "${BNC_ORIGIN_TOKEN}"

echo "BNC frontend, API, PostgreSQL, Valkey, and gateway are running."
