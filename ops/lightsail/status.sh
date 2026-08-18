#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="${BNC_DEPLOY_ROOT:-$(cd "${SCRIPT_DIR}/../../.." && pwd)}"
RUN_DIR="${DEPLOY_ROOT}/run"
PG_BIN="${DEPLOY_ROOT}/runtime/postgres/usr/bin"
PG_RUNTIME="${DEPLOY_ROOT}/runtime/postgres"
PG_LIB_PATH="${PG_RUNTIME}/usr/lib64:${PG_RUNTIME}/usr/lib64/pgsql:${PG_RUNTIME}/usr/pgsql-16/lib:${PG_RUNTIME}/usr/geos312/lib64:${PG_RUNTIME}/usr/proj92/lib64"

show_pid_status() {
  local name="$1"
  local pid_file="${RUN_DIR}/${name}.pid"

  if [[ -f "${pid_file}" ]] && kill -0 "$(cat "${pid_file}")" 2>/dev/null; then
    printf '%-12s running (pid %s)\n' "${name}" "$(cat "${pid_file}")"
  else
    printf '%-12s stopped\n' "${name}"
  fi
}

show_pid_status gateway
show_pid_status frontend
show_pid_status api
show_pid_status valkey

export LD_LIBRARY_PATH="${PG_LIB_PATH}:${LD_LIBRARY_PATH:-}"
if "${PG_BIN}/pg_ctl" \
  --pgdata="${DEPLOY_ROOT}/data/postgres" status >/dev/null 2>&1; then
  printf '%-12s running\n' "postgres"
else
  printf '%-12s stopped\n' "postgres"
fi
