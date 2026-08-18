#!/usr/bin/env bash
set -euo pipefail

DISTRIBUTION_ID="${BNC_DISTRIBUTION_ID:-E2VMDONQ9OODO8}"
DEPLOY_ROOT="${BNC_REMOTE_ROOT:-/home/ec2-user/bnc-testing-20260806}"
LIGHTSAIL_HOST="${BNC_LIGHTSAIL_HOST:-35.154.228.125}"
LIGHTSAIL_USER="${BNC_LIGHTSAIL_USER:-ec2-user}"
PEM_PATH="${BNC_PEM_PATH:-/Users/namith/.ssh/akpa-lightsail-20260301183445-key.pem}"

TEMP_DIR="$(mktemp -d)"
trap 'rm -r "${TEMP_DIR}"' EXIT

scp -q -i "${PEM_PATH}" \
  "${LIGHTSAIL_USER}@${LIGHTSAIL_HOST}:${DEPLOY_ROOT}/config/cloudfront-before-${DISTRIBUTION_ID}.json" \
  "${TEMP_DIR}/before.json"

export CF_BEFORE_FILE="${TEMP_DIR}/before.json"
export CF_ROLLBACK_FILE="${TEMP_DIR}/rollback.json"

node <<'NODE'
const fs = require("node:fs");
const envelope = JSON.parse(
  fs.readFileSync(process.env.CF_BEFORE_FILE, "utf8"),
);
fs.writeFileSync(
  process.env.CF_ROLLBACK_FILE,
  JSON.stringify(envelope.DistributionConfig),
);
NODE

CURRENT_ETAG="$(
  aws cloudfront get-distribution-config \
    --id "${DISTRIBUTION_ID}" \
    --query "ETag" \
    --output text
)"

aws cloudfront update-distribution \
  --id "${DISTRIBUTION_ID}" \
  --if-match "${CURRENT_ETAG}" \
  --distribution-config "file://${TEMP_DIR}/rollback.json" \
  --output json > /dev/null

aws cloudfront wait distribution-deployed --id "${DISTRIBUTION_ID}"

INVALIDATION_ID="$(
  aws cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text
)"

aws cloudfront wait invalidation-completed \
  --distribution-id "${DISTRIBUTION_ID}" \
  --id "${INVALIDATION_ID}"

printf 'Distribution %s rolled back; invalidation %s completed.\n' \
  "${DISTRIBUTION_ID}" \
  "${INVALIDATION_ID}"
