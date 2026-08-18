import { mobileReleaseReadiness } from "../lib/mobile-app-release.mjs";

const result = mobileReleaseReadiness(process.env);
const report = {
  ready: result.ready,
  landingUrl: result.landingUrl,
  android: { configured: result.android.configured, valid: result.android.valid, url: result.android.url },
  ios: { configured: result.ios.configured, valid: result.ios.valid, url: result.ios.url },
  issues: result.issues,
};

if (!result.ready) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
