const STORE_RULES = {
  android: {
    host: "play.google.com",
    path: "/store/apps/details",
    validIdentifier: (url) => /^[a-z][a-z0-9._]+$/i.test(url.searchParams.get("id") ?? ""),
  },
  ios: {
    host: "apps.apple.com",
    validIdentifier: (url) => /\/app\/(?:[^/]+\/)?id\d+\/?$/i.test(url.pathname),
  },
};

/**
 * Accept only canonical HTTPS store pages. A configured but invalid value is
 * distinguishable from an omitted value so deployment mistakes never become
 * clickable download links.
 *
 * @param {string | undefined} rawValue
 * @param {"android" | "ios"} platform
 */
export function mobileStoreDestination(rawValue, platform) {
  const configured = Boolean(rawValue?.trim());
  if (!configured) return { configured: false, valid: false, url: null };

  try {
    const url = new URL(rawValue.trim());
    const rule = STORE_RULES[platform];
    const valid = url.protocol === "https:"
      && url.hostname.toLowerCase() === rule.host
      && !url.username
      && !url.password
      && !url.port
      && (!rule.path || url.pathname === rule.path)
      && rule.validIdentifier(url);
    if (valid) {
      url.username = "";
      url.password = "";
      url.port = "";
      url.hash = "";
      if (platform === "android") {
        const appId = url.searchParams.get("id");
        url.search = "";
        url.searchParams.set("id", appId);
      } else {
        url.search = "";
      }
    }
    return {
      configured: true,
      valid,
      url: valid ? url.toString() : null,
    };
  } catch {
    return { configured: true, valid: false, url: null };
  }
}

/** @param {string} siteOrigin */
export function mobileAppLandingUrl(siteOrigin) {
  const trimmed = siteOrigin.trim().replace(/\/+$/, "");
  const parsed = new URL(trimmed);
  if (!new Set(["http:", "https:"]).has(parsed.protocol)) {
    throw new TypeError("The BNC site origin must use HTTP or HTTPS.");
  }
  return `${trimmed}/app`;
}

/**
 * Fail-closed release readiness shared by the page and CI/release command.
 * @param {Record<string, string | undefined>} environment
 */
export function mobileReleaseReadiness(environment) {
  const enabled = environment.NEXT_PUBLIC_MOBILE_APP_RELEASE_ENABLED === "true";
  const android = mobileStoreDestination(environment.NEXT_PUBLIC_ANDROID_APP_URL, "android");
  const ios = mobileStoreDestination(environment.NEXT_PUBLIC_IOS_APP_URL, "ios");
  let landingUrl = null;
  let landingValid = false;
  try {
    landingUrl = mobileAppLandingUrl(environment.NEXT_PUBLIC_SITE_URL ?? "");
    const parsed = new URL(landingUrl);
    landingValid = parsed.protocol === "https:"
      && !new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]).has(parsed.hostname.toLowerCase());
  } catch {
    landingValid = false;
  }
  const issues = [];
  if (!enabled) issues.push("Mobile release publishing is disabled.");
  if (!landingValid) issues.push("The public site URL must be a non-local HTTPS origin.");
  if (!android.valid) issues.push("A canonical Google Play listing is required.");
  if (!ios.valid) issues.push("A canonical Apple App Store listing is required.");
  return { enabled, ready: enabled && landingValid && android.valid && ios.valid, landingUrl, landingValid, android, ios, issues };
}
