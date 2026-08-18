#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="${BNC_DEPLOY_ROOT:-$(cd "${SCRIPT_DIR}/../../.." && pwd)}"
RUN_DIR="${DEPLOY_ROOT}/run"
PG_BIN="${DEPLOY_ROOT}/runtime/postgres/usr/bin"
PG_RUNTIME="${DEPLOY_ROOT}/runtime/postgres"
PG_LIB_PATH="${PG_RUNTIME}/usr/lib64:${PG_RUNTIME}/usr/lib64/pgsql:${PG_RUNTIME}/usr/pgsql-16/lib:${PG_RUNTIME}/usr/geos312/lib64:${PG_RUNTIME}/usr/proj92/lib64"

stop_pid_file() {
  local name="$1"
  local pid_file="${RUN_DIR}/${name}.pid"
  local attempt

  if [[ ! -f "${pid_file}" ]]; then
    return
  fi

  pid="$(cat "${pid_file}")"
  if kill -0 "${pid}" 2>/dev/null; then
    kill "${pid}"
    for attempt in {1..20}; do
      if ! kill -0 "${pid}" 2>/dev/null; then
        break
      fi
      sleep 1
    done
  fi
  rm -f "${pid_file}"
}

stop_pid_file gateway
stop_pid_file frontend
stop_pid_file api
stop_pid_file valkey

export LD_LIBRARY_PATH="${PG_LIB_PATH}:${LD_LIBRARY_PATH:-}"
if "${PG_BIN}/pg_ctl" \
  --pgdata="${DEPLOY_ROOT}/data/postgres" status >/dev/null 2>&1; then
  "${PG_BIN}/pg_ctl" \
    --pgdata="${DEPLOY_ROOT}/data/postgres" \
    --mode=fast \
    stop >/dev/null
fi

echo "Isolated BNC services stopped."
