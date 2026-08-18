#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="${BNC_DEPLOY_ROOT:-$(cd "${SCRIPT_DIR}/../../.." && pwd)}"
PG_RUNTIME="${DEPLOY_ROOT}/runtime/postgres"
PACKAGE_DIR="${DEPLOY_ROOT}/runtime/packages/postgis"
PGDG_16_URL="https://download.postgresql.org/pub/repos/yum/16/redhat/rhel-9-x86_64"
PGDG_COMMON_URL="https://download.postgresql.org/pub/repos/yum/common/redhat/rhel-9-x86_64"
ROCKY_BASE_URL="https://dl.rockylinux.org/vault/rocky/9.3/BaseOS/x86_64/os/"
ROCKY_APP_URL="https://dl.rockylinux.org/vault/rocky/9.3/AppStream/x86_64/os/"
ROCKY_CRB_URL="https://dl.rockylinux.org/vault/rocky/9.3/CRB/x86_64/os/"

umask 077
mkdir -p "${PACKAGE_DIR}"
cd "${PACKAGE_DIR}"

download_if_missing() {
  local filename="$1"
  local url="$2"

  if [[ ! -f "${filename}" ]]; then
    curl --fail --silent --show-error --location \
      --output "${filename}" \
      "${url}/${filename}"
  fi
}

download_if_missing \
  "postgis34_16-3.4.0-1PGDG.rhel9.x86_64.rpm" \
  "${PGDG_16_URL}"
download_if_missing \
  "SFCGAL-libs-1.4.1-11.rhel9.x86_64.rpm" \
  "${PGDG_COMMON_URL}"
download_if_missing \
  "geos312-3.12.0-1PGDG.rhel9.x86_64.rpm" \
  "${PGDG_COMMON_URL}"
download_if_missing \
  "proj92-9.2.1-1PGDG.rhel9.x86_64.rpm" \
  "${PGDG_COMMON_URL}"

dnf --disablerepo="*" \
  --repofrompath="rocky93-base,${ROCKY_BASE_URL}" \
  --repofrompath="rocky93-app,${ROCKY_APP_URL}" \
  --repofrompath="rocky93-crb,${ROCKY_CRB_URL}" \
  --releasever=9.3 \
  --setopt=module_platform_id=platform:el9 \
  download \
  boost-serialization-1.75.0-8.el9.x86_64 \
  gmp-c++-1:6.2.0-13.el9.x86_64 \
  jbigkit-libs-2.1-23.el9.x86_64 \
  json-c-0.14-11.el9.x86_64 \
  libjpeg-turbo-2.0.90-6.el9_1.x86_64 \
  libtiff-4.4.0-10.el9.x86_64 \
  libwebp-1.2.0-8.el9.x86_64

extract_rpm() {
  local rpm_file="$1"
  (
    cd "${PG_RUNTIME}"
    rpm2cpio "${PACKAGE_DIR}/${rpm_file}" |
      cpio --extract --make-directories --unconditional --quiet
  )
}

extract_rpm "SFCGAL-libs-1.4.1-11.rhel9.x86_64.rpm"
extract_rpm "geos312-3.12.0-1PGDG.rhel9.x86_64.rpm"
extract_rpm "proj92-9.2.1-1PGDG.rhel9.x86_64.rpm"
extract_rpm "boost-serialization-1.75.0-8.el9.x86_64.rpm"
extract_rpm "gmp-c++-6.2.0-13.el9.x86_64.rpm"
extract_rpm "jbigkit-libs-2.1-23.el9.x86_64.rpm"
extract_rpm "json-c-0.14-11.el9.x86_64.rpm"
extract_rpm "libjpeg-turbo-2.0.90-6.el9_1.x86_64.rpm"
extract_rpm "libtiff-4.4.0-10.el9.x86_64.rpm"
extract_rpm "libwebp-1.2.0-8.el9.x86_64.rpm"
extract_rpm "postgis34_16-3.4.0-1PGDG.rhel9.x86_64.rpm"

cp -a \
  "${PG_RUNTIME}/usr/pgsql-16/lib/postgis-3.so" \
  "${PG_RUNTIME}/usr/lib64/pgsql/postgis-3.so"
cp -a \
  "${PG_RUNTIME}/usr/pgsql-16/share/extension/postgis.control" \
  "${PG_RUNTIME}/usr/share/pgsql/extension/postgis.control"
cp -a \
  "${PG_RUNTIME}"/usr/pgsql-16/share/extension/postgis--*.sql \
  "${PG_RUNTIME}/usr/share/pgsql/extension/"

export LD_LIBRARY_PATH="${PG_RUNTIME}/usr/lib64:${PG_RUNTIME}/usr/lib64/pgsql:${PG_RUNTIME}/usr/pgsql-16/lib:${PG_RUNTIME}/usr/geos312/lib64:${PG_RUNTIME}/usr/proj92/lib64:${LD_LIBRARY_PATH:-}"

if ldd "${PG_RUNTIME}/usr/lib64/pgsql/postgis-3.so" |
  grep --quiet "not found"; then
  ldd "${PG_RUNTIME}/usr/lib64/pgsql/postgis-3.so" >&2
  exit 1
fi

grep "default_version" \
  "${PG_RUNTIME}/usr/share/pgsql/extension/postgis.control"
