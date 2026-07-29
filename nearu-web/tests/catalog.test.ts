import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { before, describe, test } from "node:test";

type CatalogModule = typeof import("../src/lib/catalog");

let catalog: CatalogModule;

before(async () => {
  const testDir = mkdtempSync(join(tmpdir(), "nearu-web-tests-"));
  process.env.NEARU_DB_PATH = join(testDir, "nearu-test.db");
  catalog = await import("../src/lib/catalog");
});

describe("catalog API data", () => {
  test("returns the stable catalog response shape", async () => {
    const data = await catalog.getCatalogData();

    assert.equal(data.ok, true);
    assert.ok(data.categories.length > 0);
    assert.ok(data.all.length > 0);
    assert.ok(Array.isArray(data.featured));
    assert.ok(Array.isArray(data.popular));
    assert.equal(data.filters.sort, "default");
    assert.equal(data.filters.query, "");
    assert.equal(data.meta.count, data.all.length);
    assert.equal(data.meta.total, data.stats.totalBusinesses);

    const firstBusiness = data.all[0];
    assert.ok(firstBusiness.slug);
    assert.ok(firstBusiness.category.slug);
    assert.ok(firstBusiness.rating.score >= 0);
    assert.ok(firstBusiness.location.city);
    assert.ok(firstBusiness.images.some((image) => image.role === "cover"));
    assert.ok(firstBusiness.images.some((image) => image.role === "thumbnail"));
    assert.ok(firstBusiness.images.some((image) => image.role === "logo"));
  });

  test("filters by category", async () => {
    const data = await catalog.getCatalogData({ category: "restaurants" });

    assert.ok(data.all.length > 0);
    assert.ok(data.all.every((business) => business.category.slug === "restaurants"));
    assert.equal(data.filters.category, "restaurants");
  });

  test("searches across business text fields and tags", async () => {
    const data = await catalog.getCatalogData({ query: "tailor" });

    assert.ok(data.all.length > 0);
    assert.ok(
      data.all.some(
        (business) =>
          business.name.toLowerCase().includes("tailor") ||
          business.subtitle.toLowerCase().includes("tailor") ||
          business.tags.includes("tailor") ||
          business.category.slug === "tailors",
      ),
    );
    assert.equal(data.filters.query, "tailor");
  });

  test("applies featured and popular filters", async () => {
    const featured = await catalog.getCatalogData({ featured: true });
    const popular = await catalog.getCatalogData({ popular: true });

    assert.ok(featured.all.length > 0);
    assert.ok(featured.all.every((business) => business.flags.featured));
    assert.ok(popular.all.length > 0);
    assert.ok(popular.all.every((business) => business.flags.popular));
  });

  test("sorts and limits results", async () => {
    const data = await catalog.getCatalogData({ sort: "rating", limit: 3 });

    assert.equal(data.all.length, 3);
    assert.equal(data.filters.sort, "rating");
    assert.equal(data.filters.limit, 3);
    assert.equal(data.meta.count, 3);
    assert.equal(data.meta.hasMore, data.meta.total > data.meta.count);

    for (let index = 1; index < data.all.length; index += 1) {
      assert.ok(data.all[index - 1].rating.score >= data.all[index].rating.score);
    }
  });

  test("loads a business detail by slug", async () => {
    const data = await catalog.getCatalogData({ limit: 1 });
    const business = await catalog.getBusinessBySlug(data.all[0].slug);

    assert.ok(business);
    assert.equal(business.slug, data.all[0].slug);
    assert.ok(business.contact);
    assert.ok(business.images.length >= 3);
  });
});

describe("admin catalog writes", () => {
  test("creates, updates, and deletes a category when empty", async () => {
    await catalog.addCategory({
      name: "Testing Services",
      slug: "testing-services",
      icon: "layout-grid",
      accent: "#123456",
      sortOrder: 88,
      isActive: true,
    });

    const created = (await catalog.getAdminData()).categories.find(
      (category) => category.slug === "testing-services",
    );
    assert.ok(created);
    assert.equal(created.name, "Testing Services");

    await catalog.updateCategory({
      id: created.id,
      name: "QA Services",
      slug: "qa-services",
      icon: "layout-grid",
      accent: "#654321",
      sortOrder: 89,
      isActive: false,
    });

    const updated = (await catalog.getAdminData()).categories.find(
      (category) => category.id === created.id,
    );
    assert.ok(updated);
    assert.equal(updated.slug, "qa-services");
    assert.equal(updated.isActive, false);

    const result = await catalog.removeCategoryIfEmpty(created.id);
    assert.equal(result.ok, true);
  });

  test("creates, updates, toggles, and deletes a business", async () => {
    const category = (await catalog.getAdminData()).categories[0];
    assert.ok(category);

    await catalog.addBusiness({
      name: "Spec Runner Cafe",
      slug: "spec-runner-cafe",
      subtitle: "Test Cafe",
      description: "A listing created by automated tests.",
      area: "Test Area",
      city: "Kozhikode",
      addressLine: "123 Test Street",
      landmark: "Near the test suite",
      latitude: null,
      longitude: null,
      phone: "+91 99999 00000",
      whatsapp: "+91 99999 00000",
      email: "tests@example.com",
      website: "https://example.com",
      categoryId: category.id,
      rating: 4.2,
      reviewCount: 12,
      distanceKm: 2.4,
      badgeText: "Tested",
      badgeColor: "#2469D6",
      coverVariant: "plate",
      imageUrl: null,
      logoUrl: "/uploads/businesses/spec-runner-cafe/logo/logo-1-test.png",
      upiId: "specrunner@upi",
      openingHours: "Mon - Sat, 9:00 AM - 7:00 PM",
      galleryUrls: ["/mockup/im-restaurant.jpg"],
      isVerified: true,
      tags: ["tests", "coffee"],
      isFeatured: false,
      isPopular: false,
    });

    const created = await catalog.getBusinessBySlug("spec-runner-cafe");
    assert.ok(created);
    assert.equal(created.name, "Spec Runner Cafe");
    assert.equal(created.flags.featured, false);
    assert.equal(created.payment.upiId, "specrunner@upi");
    assert.equal(created.trust.verified, true);
    assert.equal(
      created.images.find((image) => image.role === "logo")?.url,
      "/uploads/businesses/spec-runner-cafe/logo/logo-1-test.png",
    );

    await catalog.updateBusiness({
      id: created.id,
      name: "Spec Runner Bistro",
      slug: "spec-runner-bistro",
      subtitle: "Updated Test Cafe",
      description: "Updated by automated tests.",
      area: "Updated Area",
      city: "Kozhikode",
      addressLine: "456 Test Street",
      landmark: null,
      latitude: null,
      longitude: null,
      phone: null,
      whatsapp: null,
      email: null,
      website: null,
      categoryId: category.id,
      rating: 4.8,
      reviewCount: 20,
      distanceKm: 1.1,
      badgeText: null,
      badgeColor: null,
      coverVariant: "shelf",
      imageUrl: null,
      logoUrl: null,
      upiId: "bistro@upi",
      openingHours: "Daily, 10:00 AM - 8:00 PM",
      galleryUrls: ["/mockup/im-supermarket.jpg", "/mockup/im-grocery.jpg"],
      isVerified: false,
      tags: ["updated"],
      isFeatured: true,
      isPopular: true,
    });

    const updated = await catalog.getBusinessBySlug("spec-runner-bistro");
    assert.ok(updated);
    assert.equal(updated.name, "Spec Runner Bistro");
    assert.equal(updated.flags.featured, true);
    assert.equal(updated.flags.popular, true);
    assert.equal(updated.rating.score, 4.8);
    assert.equal(updated.payment.upiId, "bistro@upi");
    assert.equal(updated.trust.verified, false);
    assert.equal(updated.gallery.length, 2);

    await catalog.setBusinessFeaturedStatus(updated.id, false);
    await catalog.setBusinessPopularStatus(updated.id, false);
    const toggled = await catalog.getBusinessBySlug("spec-runner-bistro");
    assert.ok(toggled);
    assert.equal(toggled.flags.featured, false);
    assert.equal(toggled.flags.popular, false);

    await catalog.removeBusiness(updated.id);
    assert.equal(await catalog.getBusinessBySlug("spec-runner-bistro"), null);
  });

  test("does not delete a category while businesses still use it", async () => {
    const category = (await catalog.getAdminData()).categories.find(
      (item) => item._count.businesses > 0,
    );
    assert.ok(category);

    const result = await catalog.removeCategoryIfEmpty(category.id);
    assert.equal(result.ok, false);
    assert.match(result.message, /businesses/i);
  });

  test("creates, updates, and deletes a deal", async () => {
    const seeded = catalog.getDealsData();
    assert.ok(seeded.length > 0);

    await catalog.addDeal({
      slug: "spec-deal",
      title: "Spec Deal",
      text: "A deal created by tests.",
      shop: "Spec Runner Bistro",
      category: "Testing",
      badge: "10% OFF",
      badgeColor: "#2469D6",
      image: "/mockup/im-gifts.jpg",
      gradient: "linear-gradient(135deg,#eef5ff,#ffffff 58%,#e7f0ff)",
      validUntil: "Today",
      businessSlug: "spec-runner-bistro",
      isActive: true,
      sortOrder: 1,
      items: [{ name: "Spec item", text: "Test item", image: "/mockup/im-gifts.jpg", price: "10% off" }],
    });

    const created = catalog.getDealBySlugData("spec-deal");
    assert.ok(created);
    assert.equal(created.items.length, 1);

    await catalog.updateDeal({
      ...created,
      title: "Updated Spec Deal",
      items: [{ name: "Updated item", text: "Updated", image: "/mockup/im-bakery.jpg", price: "Save" }],
    });

    assert.equal(catalog.getDealBySlugData("spec-deal")?.title, "Updated Spec Deal");
    await catalog.removeDeal("spec-deal");
    assert.equal(catalog.getDealBySlugData("spec-deal"), null);
  });

  test("creates, updates, and deletes an offer", async () => {
    const seeded = catalog.getOffersData();
    assert.ok(seeded.length > 0);

    await catalog.addOffer({
      slug: "spec-offer",
      title: "Spec Offer",
      text: "An offer created by tests.",
      shop: "Spec Runner Bistro",
      category: "Testing",
      code: "SPEC10",
      image: "/mockup/im-gifts.jpg",
      gradient: "linear-gradient(135deg,#12459b,#092b70)",
      validUntil: "This week",
      businessSlug: "spec-runner-bistro",
      isActive: true,
      sortOrder: 1,
      items: [{ name: "Spec item", text: "Test item", image: "/mockup/im-gifts.jpg", label: "Offer" }],
    });

    const created = catalog.getOfferBySlugData("spec-offer");
    assert.ok(created);
    assert.equal(created.code, "SPEC10");

    await catalog.updateOffer({
      ...created,
      code: "SPEC20",
      items: [{ name: "Updated item", text: "Updated", image: "/mockup/im-bakery.jpg", label: "20%" }],
    });

    assert.equal(catalog.getOfferBySlugData("spec-offer")?.code, "SPEC20");
    await catalog.removeOffer("spec-offer");
    assert.equal(catalog.getOfferBySlugData("spec-offer"), null);
  });

  test("creates and moderates business reviews", async () => {
    const business = await catalog.getBusinessBySlug("spice-garden");
    assert.ok(business);

    const created = await catalog.addReview({
      businessSlug: business.slug,
      customerName: "Review Tester",
      customerEmail: "reviewer@example.com",
      customerPhone: "+91 90000 00000",
      rating: 5,
      text: "Excellent service and a very helpful local business.",
      status: "pending",
    });

    assert.equal(created.ok, true);
    assert.ok(created.id);
    assert.equal(catalog.getApprovedReviewsForBusiness(business.slug).length, 0);

    const pending = catalog.getAdminReviews({ status: "pending", query: "Review Tester" });
    assert.equal(pending.length, 1);
    assert.equal(pending[0].status, "pending");

    await catalog.setReviewStatus(created.id, "approved");
    const approved = catalog.getApprovedReviewsForBusiness(business.slug);
    assert.equal(approved.length, 1);
    assert.equal(approved[0].rating, 5);

    const summary = catalog.getReviewSummaryForBusinessSlug(business.slug);
    assert.ok(summary);
    assert.equal(summary.average, 5);
    assert.equal(summary.total, 1);
    assert.equal(summary.breakdown[5], 1);
    assert.equal(summary.breakdown[1], 0);

    const updatedBusiness = await catalog.getBusinessBySlug(business.slug);
    assert.ok(updatedBusiness);
    assert.equal(updatedBusiness.rating.score, 5);
    assert.equal(updatedBusiness.rating.reviewCount, 1);

    await catalog.setReviewStatus(created.id, "rejected");
    assert.equal(catalog.getApprovedReviewsForBusiness(business.slug).length, 0);

    await catalog.removeReview(created.id);
    assert.equal(catalog.getAdminReviews({ query: "Review Tester" }).length, 0);
  });

  test("records and aggregates marketplace analytics", async () => {
    const business = await catalog.getBusinessBySlug("spice-garden");
    assert.ok(business);

    const call = await catalog.recordAnalyticsEvent({
      businessSlug: business.slug,
      eventType: "call_click",
      source: "test_suite",
      metadata: { placement: "hero", unsafe: "x".repeat(300) },
      sessionId: "test-session-analytics",
    });
    const cardView = await catalog.recordAnalyticsEvent({
      businessSlug: business.slug,
      eventType: "business_card_view",
      source: "business_card_page",
      sessionId: "test-session-analytics",
    });

    assert.equal(call.ok, true);
    assert.equal(cardView.ok, true);

    const invalidType = await catalog.recordAnalyticsEvent({
      businessSlug: business.slug,
      eventType: "bad_event",
      source: "test_suite",
    });
    assert.equal(invalidType.ok, false);

    const unknownBusiness = await catalog.recordAnalyticsEvent({
      businessSlug: "unknown-business",
      eventType: "call_click",
      source: "test_suite",
    });
    assert.equal(unknownBusiness.ok, false);

    const events = catalog.getAnalyticsEvents({ businessSlug: business.slug, limit: 10 });
    assert.ok(events.some((event) => event.eventType === "call_click"));
    assert.ok(events.some((event) => event.eventType === "business_card_view"));

    const summary = catalog.getAnalyticsSummary();
    assert.ok(summary.total >= 2);
    assert.ok(summary.byType.call_click >= 1);
    assert.ok(summary.byType.business_card_view >= 1);
    assert.ok(summary.topBusinesses.some((item) => item.slug === business.slug));

    const counts = catalog.getBusinessAnalyticsCounts(business.slug);
    assert.ok(counts.calls >= 1);
    assert.ok(counts.cardViews >= 1);
  });
});
