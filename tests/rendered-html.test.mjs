import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { mobileAppLandingUrl, mobileReleaseReadiness, mobileStoreDestination } from "../lib/mobile-app-release.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = 43_000 + (process.pid % 1_000);
const origin = `http://127.0.0.1:${port}`;
let server;
let serverLogs = "";

before(async () => {
  const wranglerExecutable = fileURLToPath(
    new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url),
  );
  server = spawn(
    process.execPath,
    [wranglerExecutable, "dev", "--config", "dist/server/wrangler.json", "--port", String(port), "--ip", "127.0.0.1"],
    {
      cwd: root,
      env: {
        ...process.env,
        // Render contracts must not depend on whichever developer API happens
        // to be running on port 4000 or mutate its throttling state.
        BNC_INTERNAL_API_URL: "http://127.0.0.1:9/api/v1",
        NEXT_PUBLIC_BNC_API_URL: "http://127.0.0.1:9/api/v1",
        NEXT_PUBLIC_SITE_URL: origin,
        WRANGLER_LOG_PATH: ".wrangler/test.log",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stdout.on("data", (chunk) => { serverLogs += chunk.toString(); });
  server.stderr.on("data", (chunk) => { serverLogs += chunk.toString(); });

  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Wrangler exited before tests started.\n${serverLogs}`);
    try {
      const response = await fetch(origin);
      if (response.status > 0) return;
    } catch {
      // Continue while the local Worker is booting.
    }
    await delay(100);
  }
  throw new Error(`Timed out starting production Worker.\n${serverLogs}`);
});

after(async () => {
  if (!server || server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    delay(2_000),
  ]);
});

async function render(path = "/", headers = {}) {
  try {
    const response = await fetch(`${origin}${path}`, {
      headers: { accept: "text/html", connection: "close", ...headers },
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    // Buffer every response before returning it so redirect/no-body assertions
    // cannot leave a streaming Worker connection checked out for later tests.
    const body = await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    throw new Error(`Timed out or failed while rendering ${path}.`, { cause: error });
  }
}

test("keeps the homepage interface within the blue, white, and neutral ink palette", async () => {
  const css = await readFile(new URL("../app/home.css", import.meta.url), "utf8");
  const literalColours = [
    ...css.matchAll(/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b/gi),
    ...css.matchAll(/rgba?\(\s*(\d+)(?:\s*,\s*|\s+)(\d+)(?:\s*,\s*|\s+)(\d+)/gi),
  ];

  const outsidePalette = literalColours.filter((match) => {
    let red;
    let green;
    let blue;
    if (match[0].startsWith("#")) {
      let hex = match[1].slice(0, 6);
      if (hex.length === 3) hex = [...hex].map((part) => `${part}${part}`).join("");
      [red, green, blue] = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
    } else {
      [red, green, blue] = match.slice(1, 4).map(Number);
    }

    const normalized = [red, green, blue].map((channel) => channel / 255);
    const maximum = Math.max(...normalized);
    const minimum = Math.min(...normalized);
    const delta = maximum - minimum;
    const lightness = (maximum + minimum) / 2;
    const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
    let hue = 0;
    if (delta !== 0) {
      if (maximum === normalized[0]) hue = 60 * (((normalized[1] - normalized[2]) / delta) % 6);
      if (maximum === normalized[1]) hue = 60 * ((normalized[2] - normalized[0]) / delta + 2);
      if (maximum === normalized[2]) hue = 60 * ((normalized[0] - normalized[1]) / delta + 4);
      if (hue < 0) hue += 360;
    }

    const isNeutralInk = saturation < 0.16;
    const isBlue = hue >= 195 && hue <= 250;
    const isWhite = lightness > 0.94;
    return !(isNeutralInk || isBlue || isWhite);
  });

  assert.deepEqual(
    outsidePalette.map((match) => match[0]),
    [],
    "Homepage CSS introduced a colour outside the blue, white, and neutral ink palette.",
  );
});

test("keeps shared website sections free of yellow heading and accent colours", async () => {
  const sourceFiles = ["app/globals.css", "app/home.css", "lib/catalog-data.ts"];
  const yellowLiterals = [];

  for (const sourceFile of sourceFiles) {
    const source = await readFile(new URL(`../${sourceFile}`, import.meta.url), "utf8");
    const literalColours = [
      ...source.matchAll(/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b/gi),
      ...source.matchAll(/rgba?\(\s*(\d+)(?:\s*,\s*|\s+)(\d+)(?:\s*,\s*|\s+)(\d+)/gi),
    ];

    for (const match of literalColours) {
      let red;
      let green;
      let blue;
      if (match[0].startsWith("#")) {
        let hex = match[1].slice(0, 6);
        if (hex.length === 3) hex = [...hex].map((part) => `${part}${part}`).join("");
        [red, green, blue] = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
      } else {
        [red, green, blue] = match.slice(1, 4).map(Number);
      }

      const maximum = Math.max(red, green, blue);
      const minimum = Math.min(red, green, blue);
      const delta = maximum - minimum;
      const lightness = (maximum + minimum) / 510;
      const saturation = delta === 0 ? 0 : delta / (255 - Math.abs(maximum + minimum - 255));
      let hue = 0;
      if (delta !== 0) {
        if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
        if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
        if (maximum === blue) hue = 60 * ((red - green) / delta + 4);
        if (hue < 0) hue += 360;
      }

      if (hue >= 42 && hue <= 68 && saturation > 0.35 && lightness > 0.25) {
        yellowLiterals.push(`${sourceFile}: ${match[0]}`);
      }
    }
  }

  assert.deepEqual(
    yellowLiterals,
    [],
    "A shared website section reintroduced a yellow heading or accent colour.",
  );
});

test("renders the public subscription-plan entry surface", async () => {
  const response = await render("/pricing");
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Choose the reach and tools your business needs/);
});

test("server-renders the complete BNC discovery homepage", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");

  const html = await response.text();
  assert.match(html, /<title>BNC — Business Network Community<\/title>/i);
  assert.match(html, /Everything local/);
  assert.match(html, /Browse by category/);
  assert.match(html, /href="\/products\?category=grocery"/);
  assert.match(html, /href="\/products\?category=insurance"/);
  assert.match(html, /class="bnc-category-background"/);
  assert.match(html, /(?:Find )?Businesses near you/i);
  assert.match(html, /No exact matches in these filters|published businesses/);
  assert.doesNotMatch(html, /Find shops and products/);
  assert.doesNotMatch(html, /Find services and experts/);
  assert.match(html, /Deals around you/);
  assert.match(html, /Top BNC Star Businesses/);
  assert.match(html, /Book appointments instantly/);
  assert.match(html, /Popular products near you/);
  assert.match(html, /Best sellers that courier to you/);
  assert.match(html, /outside your selected nearby radius/i);
  assert.match(html, /Top-rated services/);
  assert.match(html, /confirm remote or travel coverage/i);
  assert.match(html, /Latest jobs near you/);
  assert.match(html, /No active reward draw right now|BNC Friday Local Shopping Reward/);
  assert.match(html, /Grow through the BNC Business Club/);
  assert.match(html, /Grow your business with BNC/);
  assert.match(html, /Your neighbourhood, one tap away/);
  assert.match(html, /Explore popular locations/);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|vinext-starter/i);
});

test("renders public discovery, marketplace, and policy routes", async () => {
  const cases = [
    ["/search?q=laptop&location=Kochi&radius=5", /laptop near Kochi/i],
    ["/kochi", /Local businesses in Kochi/],
    ["/offers/kochi", /Offers near/],
    ["/refunds", /Refunds without guesswork/],
    ["/offline", /Your neighbourhood will be back shortly/],
  ];

  for (const [path, expected] of cases) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), expected, path);
  }
});

test("validates official mobile-store destinations and a canonical app QR landing URL", () => {
  assert.deepEqual(
    mobileStoreDestination("https://play.google.com/store/apps/details?id=in.bnc.customer", "android"),
    { configured: true, valid: true, url: "https://play.google.com/store/apps/details?id=in.bnc.customer" },
  );
  assert.equal(
    mobileStoreDestination("https://example.com/fake.apk", "android").valid,
    false,
  );
  assert.equal(
    mobileStoreDestination("http://apps.apple.com/in/app/bnc/id123456789", "ios").valid,
    false,
  );
  assert.equal(
    mobileStoreDestination("https://apps.apple.com/in/app/bnc/id123456789", "ios").valid,
    true,
  );
  assert.equal(mobileAppLandingUrl("https://bnc.example/platform/"), "https://bnc.example/platform/app");
  assert.equal(
    mobileStoreDestination("https://play.google.com:444/store/apps/details?id=in.bnc.customer", "android").valid,
    false,
  );
  assert.equal(
    mobileStoreDestination("https://user@play.google.com/store/apps/details?id=in.bnc.customer", "android").valid,
    false,
  );
  assert.deepEqual(
    mobileStoreDestination("https://play.google.com/store/apps/details?id=in.bnc.customer&utm_source=test#install", "android"),
    { configured: true, valid: true, url: "https://play.google.com/store/apps/details?id=in.bnc.customer" },
  );
});

test("requires an explicit release switch, HTTPS public origin, and both live stores", () => {
  const published = mobileReleaseReadiness({
    NEXT_PUBLIC_MOBILE_APP_RELEASE_ENABLED: "true",
    NEXT_PUBLIC_SITE_URL: "https://bnc.example",
    NEXT_PUBLIC_ANDROID_APP_URL: "https://play.google.com/store/apps/details?id=in.bnc.customer",
    NEXT_PUBLIC_IOS_APP_URL: "https://apps.apple.com/in/app/bnc/id123456789",
  });
  assert.equal(published.ready, true);
  assert.deepEqual(published.issues, []);

  const local = mobileReleaseReadiness({
    NEXT_PUBLIC_MOBILE_APP_RELEASE_ENABLED: "true",
    NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3001",
    NEXT_PUBLIC_ANDROID_APP_URL: "https://play.google.com/store/apps/details?id=in.bnc.customer",
    NEXT_PUBLIC_IOS_APP_URL: "https://apps.apple.com/in/app/bnc/id123456789",
  });
  assert.equal(local.ready, false);
  assert.match(local.issues.join(" "), /non-local HTTPS origin/);
});

test("renders a safe mobile-app release landing page", async () => {
  const response = await render("/app");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Your neighbourhood, ready when you are/);
  assert.match(html, /QR code for the BNC mobile app install page/);
  assert.match(html, /Release URL pending|Get the BNC app/);
  assert.match(html, /App Store release pending|View on the App Store/);
  assert.doesNotMatch(html, /href="https:\/\/example\.com\/fake\.apk"/);
});

test("renders server-backed product category, location, status, and sort controls", async () => {
  const response = await render("/products?q=chair&category=furniture&location=Kochi&status=MADE_TO_ORDER&sort=price-low");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Advanced discovery/);
  assert.match(html, /Availability \/ completion/);
  assert.match(html, /Made to order/);
  assert.match(html, /Price: low to high/);
  assert.match(html, /No products match these filters/);
});

test("only advertises home delivery for products that explicitly support it", async () => {
  const [deliveryOptions, productMapper, homeCards, productListing, productDetail] = await Promise.all([
    readFile(new URL("../lib/delivery-options.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/public-api.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/home/home-cards.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/products-view.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/products/[id]/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(deliveryOptions, /local_delivery/);
  assert.match(productMapper, /hasHomeDelivery\(source\.deliveryOptions\)/);
  assert.doesNotMatch(productMapper, /Ask the seller/);
  assert.doesNotMatch(productMapper, /deliveryLabel/);
  assert.match(homeCards, /product\.homeDeliveryAvailable &&/);
  assert.match(productListing, /product\.homeDeliveryAvailable &&/);
  assert.match(productDetail, /product\.homeDeliveryAvailable &&/);
});

test("provides direct, prefilled WhatsApp enquiries on every public detail type", async () => {
  const whatsappSource = await readFile(new URL("../components/whatsapp-inquiry-button.tsx", import.meta.url), "utf8");
  assert.match(whatsappSource, /https:\/\/wa\.me\//);
  assert.match(whatsappSource, /encodeURIComponent\(message\)/);
  assert.match(whatsappSource, /noopener noreferrer/);

  for (const sourceFile of [
    "app/products/[id]/page.tsx",
    "app/services/[id]/page.tsx",
    "components/business-profile-view.tsx",
  ]) {
    const source = await readFile(new URL(`../${sourceFile}`, import.meta.url), "utf8");
    assert.match(source, /WhatsAppInquiryButton/, sourceFile);
  }
});

test("returns not found for catalogue detail identifiers that are not supplied by the backend", async () => {
  for (const path of ["/business/fixora-tech-care-kakkanad", "/products/prod-2", "/services/svc-fx-1"]) {
    const response = await render(path);
    assert.equal(response.status, 404, path);
  }
});

test("retires the Malayalam website mode", async () => {
  const response = await render("/ml");
  assert.equal(response.status, 308);
  assert.equal(new URL(response.headers.get("location"), origin).pathname, "/");

  const headerSource = await readFile(new URL("../components/site-header.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(headerSource, /language-button|hrefLang|\/ml|malayalam/i);
});

test("publishes genuine catalogue records or intentional empty states without bundled fixtures", async () => {
  const cases = [
    ["/", /Popular products near you|No products published yet/],
    ["/businesses", /\d+(?:<!-- -->)? businesses across Kerala|No businesses published yet/],
    ["/categories", /Everything local|No categories published yet/],
    ["/products", /BNC marketplace|No products published yet/],
    ["/services", /Trusted local services|No services published yet/],
    ["/offers", /Local offers|No offers published yet/],
  ];

  const renderedPages = [];
  for (const [path, expected] of cases) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, expected, path);
    renderedPages.push(html);
  }

  assert.doesNotMatch(
    renderedPages.join("\n"),
    /Fixora Tech Care|Harbour &amp; Hearth|Malabar Lens Studio|Aayush Family Clinic/,
  );
});

test("publishes crawl controls and redirects private account pages to secure sign-in", async () => {
  const [sitemap, robots, manifest, account] = await Promise.all([
    render("/sitemap.xml"),
    render("/robots.txt"),
    render("/manifest.webmanifest"),
    render("/account"),
  ]);
  assert.equal(sitemap.status, 200);
  const sitemapText = await sitemap.text();
  assert.doesNotMatch(sitemapText, /business\/fixora-tech-care-kakkanad/);
  assert.doesNotMatch(sitemapText, /products\/prod-/);
  assert.doesNotMatch(sitemapText, /\/ml(?:<|$)/);
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap:/);
  assert.equal(manifest.status, 200);
  assert.match(await manifest.text(), /"name"\s*:\s*"BNC — Trusted local discovery"/);
  assert.equal(account.status, 307);
  assert.match(account.headers.get("location") ?? "", /\/login\?portal=customer&returnTo=/);
});

test("returns a branded, useful 404 response", async () => {
  const response = await render("/this-route-does-not-exist-anywhere");
  assert.equal(response.status, 404);
  const html = await response.text();
  assert.match(html, /This place isn’t on the map/);
  assert.match(html, /Search BNC/);
});

test("renders the business, administration, onboarding, and account entry surfaces", async () => {
  const publicCases = [
    ["/compare", /Compare local businesses/],
    ["/enquiry", /Tell us what you need/],
    ["/login", /Sign in to your BNC account/i],
    ["/merchant/login", /Manage your BNC business/i],
    ["/admin/login", /Administrator access/i],
    ["/help", /Answers for local decisions/],
    ["/contact", /Contact BNC/],
  ];

  for (const [path, expected] of publicCases) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), expected, path);
  }

  const protectedCases = [
    ["/business/dashboard", "business"],
    ["/business/leads", "business"],
    ["/business/orders", "business"],
    ["/business/messages", "business"],
    ["/business/add", "customer"],
    ["/business/claim", "customer"],
    ["/merchant/dashboard", "merchant"],
    ["/merchant/profile", "merchant"],
    ["/merchant/listings", "merchant"],
    ["/admin", "admin-entry"],
    ["/admin/dashboard", "admin-entry"],
    ["/admin/merchants", "admin-entry"],
    ["/admin/listings", "admin-entry"],
    ["/admin/categories", "admin-entry"],
    ["/admin/locations", "admin-entry"],
    ["/admin/reviews", "admin-entry"],
    ["/admin/ranking", "admin-entry"],
  ];

  for (const [path, portal] of protectedCases) {
    const response = await render(path);
    assert.equal(response.status, 307, path);
    const location = response.headers.get("location") ?? "";
    if (portal === "merchant") assert.match(location, /\/merchant\/login\?returnTo=/, path);
    else if (portal === "admin-entry") assert.match(location, /\/admin\/login\?returnTo=/, path);
    else assert.match(location, new RegExp(`/login\\?portal=${portal}&returnTo=`), path);
  }
});

test("rejects cross-site mutations before accessing storage", async () => {
  const response = await fetch(`${origin}/api/contact`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://malicious.invalid",
      "sec-fetch-site": "cross-site",
      connection: "close",
    },
    body: JSON.stringify({
      name: "Security test",
      email: "security@example.com",
      topic: "support",
      message: "This request must be rejected before storage access.",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(response.status, 403);
  assert.match(
    JSON.stringify(await response.json()),
    /Cross-(?:origin|site).*(?:blocked|not accepted)/i,
  );
});
