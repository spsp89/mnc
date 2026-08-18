#!/usr/bin/env bash
set -euo pipefail

DISTRIBUTION_ID="${BNC_DISTRIBUTION_ID:-E2VMDONQ9OODO8}"
ORIGIN_DOMAIN="${BNC_ORIGIN_DOMAIN:-ec2-35-154-228-125.ap-south-1.compute.amazonaws.com}"
ORIGIN_PORT="${BNC_ORIGIN_PORT:-8088}"
DEPLOY_ROOT="${BNC_REMOTE_ROOT:-/home/ec2-user/bnc-testing-20260806}"
LIGHTSAIL_HOST="${BNC_LIGHTSAIL_HOST:-35.154.228.125}"
LIGHTSAIL_USER="${BNC_LIGHTSAIL_USER:-ec2-user}"
PEM_PATH="${BNC_PEM_PATH:-/Users/namith/.ssh/akpa-lightsail-20260301183445-key.pem}"
CACHE_DISABLED_POLICY="4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
ALL_VIEWER_EXCEPT_HOST_POLICY="b689b0a8-53d0-40ab-baf2-68738e2966ac"

TEMP_DIR="$(mktemp -d)"
trap 'rm -r "${TEMP_DIR}"' EXIT

aws cloudfront get-distribution-config \
  --id "${DISTRIBUTION_ID}" \
  --output json > "${TEMP_DIR}/before.json"

scp -q -i "${PEM_PATH}" \
  "${TEMP_DIR}/before.json" \
  "${LIGHTSAIL_USER}@${LIGHTSAIL_HOST}:${DEPLOY_ROOT}/config/cloudfront-before-${DISTRIBUTION_ID}.json"

ORIGIN_TOKEN="$(
  ssh -o BatchMode=yes -i "${PEM_PATH}" \
    "${LIGHTSAIL_USER}@${LIGHTSAIL_HOST}" \
    "tr -d '\\r\\n' < '${DEPLOY_ROOT}/.origin-token'"
)"

export ORIGIN_TOKEN
export ORIGIN_DOMAIN
export ORIGIN_PORT
export CACHE_DISABLED_POLICY
export ALL_VIEWER_EXCEPT_HOST_POLICY
export CF_BEFORE_FILE="${TEMP_DIR}/before.json"
export CF_UPDATE_FILE="${TEMP_DIR}/update.json"

node <<'NODE'
const fs = require("node:fs");

const envelope = JSON.parse(
  fs.readFileSync(process.env.CF_BEFORE_FILE, "utf8"),
);
const config = envelope.DistributionConfig;
const existingOrigin = config.Origins.Items[0];

existingOrigin.Id = "bnc-lightsail-testing-origin";
existingOrigin.DomainName = process.env.ORIGIN_DOMAIN;
existingOrigin.OriginPath = "";
existingOrigin.CustomHeaders = {
  Quantity: 1,
  Items: [
    {
      HeaderName: "X-BNC-Origin-Token",
      HeaderValue: process.env.ORIGIN_TOKEN,
    },
  ],
};
delete existingOrigin.S3OriginConfig;
delete existingOrigin.VpcOriginConfig;
delete existingOrigin.OriginAccessControlId;
existingOrigin.CustomOriginConfig = {
  HTTPPort: Number(process.env.ORIGIN_PORT),
  HTTPSPort: 443,
  OriginProtocolPolicy: "http-only",
  OriginSslProtocols: {
    Quantity: 1,
    Items: ["TLSv1.2"],
  },
  OriginReadTimeout: 30,
  OriginKeepaliveTimeout: 5,
};
existingOrigin.ConnectionAttempts = 3;
existingOrigin.ConnectionTimeout = 10;
existingOrigin.OriginShield = { Enabled: false };

config.Origins = {
  Quantity: 1,
  Items: [existingOrigin],
};
config.DefaultRootObject = "";
config.DefaultCacheBehavior.TargetOriginId = existingOrigin.Id;
config.DefaultCacheBehavior.AllowedMethods = {
  Quantity: 7,
  Items: ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"],
  CachedMethods: {
    Quantity: 2,
    Items: ["HEAD", "GET"],
  },
};
config.DefaultCacheBehavior.CachePolicyId =
  process.env.CACHE_DISABLED_POLICY;
config.DefaultCacheBehavior.OriginRequestPolicyId =
  process.env.ALL_VIEWER_EXCEPT_HOST_POLICY;
config.DefaultCacheBehavior.Compress = true;
delete config.DefaultCacheBehavior.ForwardedValues;

fs.writeFileSync(process.env.CF_UPDATE_FILE, JSON.stringify(config));
fs.writeFileSync(
  `${process.env.CF_UPDATE_FILE}.etag`,
  envelope.ETag,
);
NODE

ETAG="$(cat "${TEMP_DIR}/update.json.etag")"

aws cloudfront update-distribution \
  --id "${DISTRIBUTION_ID}" \
  --if-match "${ETAG}" \
  --distribution-config "file://${TEMP_DIR}/update.json" \
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

printf 'Distribution %s deployed; invalidation %s completed.\n' \
  "${DISTRIBUTION_ID}" \
  "${INVALIDATION_ID}"
