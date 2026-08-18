#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="${BNC_DEPLOY_ROOT:-$(cd "${SCRIPT_DIR}/../../.." && pwd)}"
RUNTIME_DIR="${DEPLOY_ROOT}/runtime"
PACKAGE_DIR="${RUNTIME_DIR}/packages"

umask 077
mkdir -p \
  "${RUNTIME_DIR}/node" \
  "${RUNTIME_DIR}/postgres" \
  "${RUNTIME_DIR}/valkey" \
  "${PACKAGE_DIR}/node" \
  "${PACKAGE_DIR}/postgres" \
  "${PACKAGE_DIR}/valkey"

if [[ ! -x "${RUNTIME_DIR}/node/bin/node" ]]; then
  (
    cd "${PACKAGE_DIR}/node"
    curl --fail --silent --show-error --location \
      --output SHASUMS256.txt \
      https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt
    archive="$(awk '/linux-x64\.tar\.xz$/ { print $2; exit }' SHASUMS256.txt)"
    if [[ -z "${archive}" ]]; then
      echo "Unable to find the Node.js Linux x64 archive" >&2
      exit 1
    fi
    curl --fail --silent --show-error --location \
      --output "${archive}" \
      "https://nodejs.org/dist/latest-v22.x/${archive}"
    grep "  ${archive}$" SHASUMS256.txt | sha256sum --check -
    tar --extract --xz --file="${archive}" \
      --directory="${RUNTIME_DIR}/node" \
      --strip-components=1
  )
fi

extract_rpms() {
  local package_source="$1"
  local destination="$2"
  local rpm_file

  shopt -s nullglob
  for rpm_file in "${package_source}"/*.rpm; do
    (
      cd "${destination}"
      rpm2cpio "${rpm_file}" |
        cpio --extract --make-directories --unconditional --quiet
    )
  done
  shopt -u nullglob
}

if [[ ! -x "${RUNTIME_DIR}/postgres/usr/bin/postgres" ||
  ! -f "${RUNTIME_DIR}/postgres/usr/share/pgsql/extension/pg_trgm.control" ]]; then
  (
    cd "${PACKAGE_DIR}/postgres"
    dnf download --quiet --resolve \
      postgresql16 \
      postgresql16-contrib \
      postgresql16-private-libs \
      postgresql16-server
  )
  extract_rpms "${PACKAGE_DIR}/postgres" "${RUNTIME_DIR}/postgres"
fi

if [[ ! -x "${RUNTIME_DIR}/valkey/usr/bin/valkey-server" ]]; then
  (
    cd "${PACKAGE_DIR}/valkey"
    dnf download --quiet --resolve valkey
  )
  extract_rpms "${PACKAGE_DIR}/valkey" "${RUNTIME_DIR}/valkey"
fi

BNC_DEPLOY_ROOT="${DEPLOY_ROOT}" "${SCRIPT_DIR}/install-postgis.sh"

export PATH="${RUNTIME_DIR}/node/bin:${PATH}"
export LD_LIBRARY_PATH="${RUNTIME_DIR}/postgres/usr/lib64:${RUNTIME_DIR}/postgres/usr/lib64/pgsql:${RUNTIME_DIR}/postgres/usr/pgsql-16/lib:${RUNTIME_DIR}/postgres/usr/geos312/lib64:${RUNTIME_DIR}/postgres/usr/proj92/lib64:${LD_LIBRARY_PATH:-}"

"${RUNTIME_DIR}/node/bin/node" --version
"${RUNTIME_DIR}/postgres/usr/bin/postgres" --version
"${RUNTIME_DIR}/valkey/usr/bin/valkey-server" --version
