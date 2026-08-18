const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const nodeTest = require("node:test");

const describeContract = global.describe ?? nodeTest.describe;
const testContract = global.test ?? nodeTest.test;
const root = path.resolve(__dirname, "..");
const workspace = path.resolve(root, "..", "..");
const readApi = (name) => fs.readFileSync(path.join(root, name), "utf8");
const readWorkspace = (name) => fs.readFileSync(path.join(workspace, name), "utf8");

describeContract("Final audit P0/P1 contracts", () => {
  testContract("merchant status changes use a valid notification enum", () => {
    const schema = readApi("prisma/schema.prisma");
    const service = readApi("src/modules/admin/admin.service.ts");
    assert.match(schema, /enum NotificationType[\s\S]*VERIFICATION_UPDATE/);
    assert.match(service, /type: "VERIFICATION_UPDATE"/);
    assert.doesNotMatch(service, /MERCHANT_STATUS_UPDATE/);
  });

  testContract("pending offers cannot notify and merchants cannot self-feature", () => {
    const source = readApi("src/modules/offers/offers.service.ts");
    const migration = readApi("prisma/migrations/20260816010000_final_audit_integrity/migration.sql");
    const createBody = source.slice(source.indexOf("async create("), source.indexOf("async update("));
    assert.match(createBody, /isFeatured: false/);
    assert.match(createBody, /featuredRequested: input\.isFeatured/);
    assert.doesNotMatch(createBody, /notifyCustomers|scheduleNotification/);
    assert.match(source, /moderationStatus: "APPROVED"[\s\S]*notifyCustomers/);
    assert.match(migration, /ADD COLUMN "featuredRequested" BOOLEAN NOT NULL DEFAULT false/);
  });

  testContract("dashboard offer KPIs count approved offers only", () => {
    assert.match(readApi("src/modules/analytics/analytics.service.ts"), /moderationStatus: "APPROVED"/);
    const admin = readApi("src/modules/admin/admin.service.ts");
    assert.match(admin, /activeOffers[\s\S]*moderationStatus: "APPROVED"/);
  });

  testContract("manual payment actions cannot create successful payments", () => {
    const dto = readApi("src/modules/admin/dto/admin-payment.dto.ts");
    const service = readApi("src/modules/admin/admin.service.ts");
    const actionDto = dto.slice(dto.indexOf("export class AdminPaymentActionDto"));
    assert.match(actionDto, /MARK_FAILED/);
    assert.match(actionDto, /CANCEL/);
    assert.doesNotMatch(actionDto, /CAPTURED|PAID|MARK_PAID/);
    assert.match(service, /\["CREATED", "AUTHORIZED"\]/);
    assert.match(service, /statusHistory: \{ create:/);
    const controller = readApi("src/modules/admin/admin.controller.ts");
    assert.match(controller, /@Get\("payments"\)[\s\S]*@Roles\("SUPER_ADMIN", "FINANCE"\)/);
    assert.match(controller, /@Patch\("payments\/:id\/status"\)[\s\S]*@Roles\("SUPER_ADMIN", "FINANCE"\)/);
  });

  testContract("taxonomy updates reject ancestor cycles", () => {
    const source = readApi("src/modules/admin/admin.service.ts");
    assert.match(source, /assertCategoryParentIsAcyclic/);
    assert.match(source, /assertLocationParentIsAcyclic/);
    assert.match(source, /while \(cursor\)/);
  });

  testContract("subcategory creation receives root category options", () => {
    const dataSource = readWorkspace("lib/portal-data.ts");
    const sectionView = readWorkspace("components/admin-section-view.tsx");
    const manager = readWorkspace("components/admin-records-manager.tsx");
    assert.match(dataSource, /parentCategories = categoryTree/);
    assert.match(sectionView, /parentCategories=\{data\.parentCategories\}/);
    assert.match(manager, /parentCategories\.length \? parentCategories : records/);
  });

  testContract("public banners are consumed by the homepage", () => {
    assert.match(readWorkspace("components/home/homepage.tsx"), /<CmsBanners placement="HOME_HERO"/);
    assert.match(readWorkspace("components/home/cms-banners.tsx"), /\/api\/content\/banners\?placement=/);
    assert.match(readWorkspace("app/api/content/banners/route.ts"), /apiRequest\(`\/content\/banners/);
  });

  testContract("enquiries validate active targets and catalogue ownership", () => {
    const source = readApi("src/modules/enquiries/enquiries.service.ts");
    assert.match(source, /await this\.validateTarget\(input\)/);
    assert.match(source, /listingStatus: "PUBLISHED"/);
    assert.match(source, /Each enquiry item must reference exactly one product or service/);
  });

  testContract("open business hours require an ordered time range", () => {
    const source = readApi("src/modules/businesses/businesses.service.ts");
    assert.match(source, /!hour\.closed[\s\S]*hour\.opensAt >= hour\.closesAt/);
  });
});
