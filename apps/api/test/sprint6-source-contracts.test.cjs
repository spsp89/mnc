const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const nodeTest = require("node:test");
const describeContract = global.describe ?? nodeTest.describe;
const testContract = global.test ?? nodeTest.test;
const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

describeContract("Sprint 6 production contracts", () => {
  testContract("banner reads enforce activity and schedule windows", () => {
    const source = read("src/modules/content/content.service.ts");
    assert.match(source, /isActive: true/);
    assert.match(source, /startsAt: \{ lte: now \}/);
    assert.match(source, /endsAt: \{ gte: now \}/);
  });
  testContract("banner mutations are admin guarded and audited", () => {
    assert.match(read("src/modules/admin/admin.controller.ts"), /@Roles\("SUPER_ADMIN"\)/);
    const source = read("src/modules/admin/admin.service.ts");
    assert.match(source, /action: "BANNER_CREATED"/);
    assert.match(source, /action: "BANNER_UPDATED"/);
  });
  testContract("banner modal validates upload type, size and verified readiness", () => {
    const source = read("../../components/admin-banner-manager.tsx");
    assert.match(source, /image\/jpeg.*image\/png.*image\/webp/);
    assert.match(source, /maxBannerImageBytes = 10_000_000/);
    assert.match(source, /uploadState === "ready"/);
    assert.match(source, /Upload failed:/);
  });
  testContract("public offers require moderation approval", () => {
    const source = read("src/modules/offers/offers.service.ts");
    assert.match(source, /moderationStatus: "APPROVED"/);
    assert.match(source, /moderationStatus: "PENDING"/);
  });
  testContract("captured payment status is written by the webhook processor with history", () => {
    const source = read("src/modules/payments/payment-webhook.processor.ts");
    assert.match(source, /newStatus: "CAPTURED"/);
    assert.match(source, /source: "RAZORPAY_WEBHOOK"/);
  });
});
