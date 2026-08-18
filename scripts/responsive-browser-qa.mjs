import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const baseUrl = (process.env.BNC_RESPONSIVE_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const outputDirectory = resolve(process.env.BNC_RESPONSIVE_OUTPUT ?? "artifacts/responsive-qa/automated");
const adminEmail = process.env.BNC_RESPONSIVE_ADMIN_EMAIL ?? "a@bnc.in";
const merchantEmail = process.env.BNC_RESPONSIVE_MERCHANT_EMAIL ?? "m@bnc.in";
const demoPassword = process.env.BNC_RESPONSIVE_DEMO_PASSWORD ?? "Demo@12345";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];

const surfaces = [
  { name: "public", path: "/", role: null },
  { name: "admin", path: "/admin/dashboard", role: "admin" },
  { name: "merchant", path: "/merchant/dashboard", role: "business" },
];

function chromeExecutable() {
  const configured = process.env.BNC_CHROME_PATH;
  const candidates = [
    configured,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

async function waitForFile(path, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (existsSync(path)) return readFile(path, "utf8");
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error(`Chrome did not expose its DevTools endpoint within ${timeoutMs}ms.`);
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.sequence = 0;
    this.pending = new Map();
  }

  async open() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolvePromise, reject) => {
      this.socket.addEventListener("open", resolvePromise, { once: true });
      this.socket.addEventListener("error", () => reject(new Error("Unable to connect to Chrome DevTools.")), { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

async function waitForPage(client, expectedPath, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await evaluate(client, "({ path: location.pathname, ready: document.readyState })");
    if (state.path === expectedPath && state.ready === "complete") return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
  }
  throw new Error(`Timed out loading ${expectedPath}.`);
}

async function navigate(client, path) {
  await client.send("Page.navigate", { url: `${baseUrl}${path}` });
  await waitForPage(client, path);
}

async function waitForRenderedSurface(client, surface, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await evaluate(client, `(() => ({
      loadingSkeleton: Boolean(document.querySelector(".bnc-home-skeleton")),
      publicReady: Boolean(document.querySelector(".bnc-home")),
      dashboardReady: Boolean(document.querySelector(".dashboard-shell")),
    }))()`);
    const ready = surface.role ? state.dashboardReady : state.publicReady;
    if (ready && !state.loadingSkeleton) {
      // Let short entrance transitions settle so screenshots represent the usable UI,
      // not a partially transparent animation frame.
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 700));
      return;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
  }
  throw new Error(`Timed out waiting for rendered ${surface.name} content at ${surface.path}.`);
}

async function login(client, role) {
  const email = role === "admin" ? adminEmail : merchantEmail;
  const returnTo = role === "admin" ? "/admin/dashboard" : "/merchant/dashboard";
  await navigate(client, role === "admin" ? "/admin/login" : "/merchant/login");
  const response = await evaluate(client, `fetch("/api/session/email/login", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(${JSON.stringify({ email, password: demoPassword, portal: role, returnTo })})
  }).then(async (response) => ({ ok: response.ok, status: response.status, body: await response.text() }))`);
  if (!response.ok) throw new Error(`${role} demo login failed (${response.status}): ${response.body}`);
}

const layoutProbe = `(() => {
  const viewportWidth = innerWidth;
  const root = document.documentElement;
  const escaped = [];
  const isIntentionallyClipped = (element) => {
    for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (["auto", "scroll", "hidden", "clip"].includes(style.overflowX)) return true;
    }
    return false;
  };
  for (const element of document.querySelectorAll("body *")) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.right <= 0 || isIntentionallyClipped(element)) continue;
    if (rect.left < -2 || rect.right > viewportWidth + 2) {
      escaped.push({
        tag: element.tagName,
        className: String(element.className || "").slice(0, 100),
        text: String(element.textContent || "").trim().slice(0, 70),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      });
      if (escaped.length === 12) break;
    }
  }
  const shell = document.querySelector(".dashboard-shell");
  const sidebar = document.querySelector(".dashboard-sidebar");
  const menu = document.querySelector(".dashboard-menu");
  const heading = document.querySelector(".dashboard-page-heading");
  const headingContent = heading?.querySelector(":scope > div:first-child");
  const sidebarRect = sidebar?.getBoundingClientRect();
  const headingRect = heading?.getBoundingClientRect();
  const publicHero = document.querySelector(".bnc-clean-hero");
  const publicHeading = publicHero?.querySelector("h1");
  const publicBackdrop = publicHero?.querySelector(".bnc-hero-backdrop");
  const publicHeroRect = publicHero?.getBoundingClientRect();
  const publicHeadingRect = publicHeading?.getBoundingClientRect();
  const publicBackdropRect = publicBackdrop?.getBoundingClientRect();
  return {
    path: location.pathname,
    title: document.title,
    viewport: { width: innerWidth, height: innerHeight },
    documentWidth: root.scrollWidth,
    horizontalOverflow: root.scrollWidth > viewportWidth + 1,
    loadingSkeleton: Boolean(document.querySelector(".bnc-home-skeleton")),
    surfaceReady: Boolean(document.querySelector(".bnc-home, .dashboard-shell")),
    escaped,
    publicHero: publicHero ? {
      present: true,
      headingVisible: publicHeadingRect ? publicHeadingRect.width > 0 && publicHeadingRect.height > 0 : false,
      headingColor: publicHeading ? getComputedStyle(publicHeading).color : null,
      headingOpacity: publicHeading ? Number(getComputedStyle(publicHeading.closest(".bnc-hero-copy") ?? publicHeading).opacity) : null,
      heroColor: getComputedStyle(publicHero).color,
      heroRect: publicHeroRect ? { top: Math.round(publicHeroRect.top), width: Math.round(publicHeroRect.width), height: Math.round(publicHeroRect.height) } : null,
      backdropPosition: publicBackdrop ? getComputedStyle(publicBackdrop).position : null,
      backdropRect: publicBackdropRect ? { top: Math.round(publicBackdropRect.top), width: Math.round(publicBackdropRect.width), height: Math.round(publicBackdropRect.height) } : null,
    } : { present: false },
    dashboard: shell ? {
      present: true,
      sidebarOffCanvas: sidebarRect ? sidebarRect.right <= 1 || sidebarRect.left < 0 : null,
      menuVisible: menu ? getComputedStyle(menu).display !== "none" : false,
      headingHeight: headingRect ? Math.round(headingRect.height) : null,
      headingContentDisplay: headingContent ? getComputedStyle(headingContent).display : null,
    } : { present: false },
  };
})()`;

async function main() {
  const executable = chromeExecutable();
  if (!executable) throw new Error("Chrome or Edge was not found. Set BNC_CHROME_PATH to a Chromium executable.");

  const health = await fetch(baseUrl, { redirect: "manual" }).catch(() => null);
  if (!health) throw new Error(`BNC web server is not reachable at ${baseUrl}. Start it before running this check.`);

  const profileDirectory = await mkdtemp(join(tmpdir(), "bnc-responsive-"));
  await mkdir(outputDirectory, { recursive: true });
  const chrome = spawn(executable, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--remote-debugging-address=127.0.0.1",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDirectory}`,
    "about:blank",
  ], { stdio: "ignore" });

  let client;
  try {
    const endpoint = (await waitForFile(join(profileDirectory, "DevToolsActivePort"))).trim().split(/\r?\n/);
    const port = endpoint[0];
    const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" }).then((response) => response.json());
    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.open();
    await client.send("Page.enable");
    await client.send("Runtime.enable");

    const results = [];
    for (const surface of surfaces) {
      if (surface.role) await login(client, surface.role);
      for (const viewport of viewports) {
        await client.send("Emulation.setDeviceMetricsOverride", {
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1,
          mobile: viewport.name === "mobile",
          screenWidth: viewport.width,
          screenHeight: viewport.height,
        });
        await navigate(client, surface.path);
        await waitForRenderedSurface(client, surface);
        const measurement = await evaluate(client, layoutProbe);
        const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        const screenshotName = `${surface.name}-${viewport.name}.png`;
        await writeFile(join(outputDirectory, screenshotName), Buffer.from(screenshot.data, "base64"));

        const failures = [];
        if (measurement.viewport.width !== viewport.width) failures.push(`viewport width is ${measurement.viewport.width}`);
        if (measurement.loadingSkeleton) failures.push("loading skeleton is still visible");
        if (!measurement.surfaceReady) failures.push("expected surface content is not rendered");
        if (measurement.horizontalOverflow) failures.push(`document width is ${measurement.documentWidth}px`);
        if (measurement.escaped.length) failures.push(`${measurement.escaped.length} visible elements escape the viewport`);
        if (!surface.role) {
          if (!measurement.publicHero.present || !measurement.publicHero.headingVisible) failures.push("public hero heading is not visible");
          if (measurement.publicHero.headingColor !== "rgb(255, 255, 255)") failures.push(`public hero heading color is ${measurement.publicHero.headingColor}`);
          if (measurement.publicHero.headingOpacity !== 1) failures.push(`public hero heading opacity is ${measurement.publicHero.headingOpacity}`);
          if (measurement.publicHero.backdropPosition !== "absolute") failures.push(`public hero backdrop position is ${measurement.publicHero.backdropPosition}`);
          if (measurement.publicHero.backdropRect && measurement.publicHero.heroRect && measurement.publicHero.backdropRect.width < measurement.publicHero.heroRect.width - 2) {
            failures.push(`public hero backdrop is ${measurement.publicHero.backdropRect.width}px wide for a ${measurement.publicHero.heroRect.width}px hero`);
          }
        }
        if (surface.role && viewport.name === "mobile") {
          if (!measurement.dashboard.sidebarOffCanvas) failures.push("dashboard sidebar is not off-canvas");
          if (!measurement.dashboard.menuVisible) failures.push("dashboard menu button is not visible");
          if (measurement.dashboard.headingContentDisplay === "flex") failures.push("dashboard heading copy is laid out as an action row");
          if (measurement.dashboard.headingHeight > 480) failures.push(`dashboard heading is ${measurement.dashboard.headingHeight}px tall`);
        }
        results.push({ surface: surface.name, viewport: viewport.name, screenshot: screenshotName, measurement, failures });
      }
      if (surface.role) {
        await evaluate(client, "fetch('/api/session/logout', { method: 'POST', credentials: 'include' }).catch(() => null)");
      }
    }

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      passed: results.every((result) => result.failures.length === 0),
      results,
    };
    await writeFile(join(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
    for (const result of results) {
      console.log(`${result.failures.length ? "FAIL" : "PASS"} ${result.surface.padEnd(8)} ${result.viewport.padEnd(7)} ${result.measurement.viewport.width}x${result.measurement.viewport.height}`);
      for (const failure of result.failures) console.log(`  - ${failure}`);
    }
    if (!report.passed) process.exitCode = 1;
  } finally {
    client?.close();
    const exited = new Promise((resolvePromise) => chrome.once("exit", resolvePromise));
    chrome.kill();
    await Promise.race([exited, new Promise((resolvePromise) => setTimeout(resolvePromise, 3_000))]);
    await rm(profileDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 }).catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
