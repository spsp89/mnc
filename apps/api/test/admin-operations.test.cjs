require("reflect-metadata");

const { AdminService } = require("../dist/modules/admin/admin.service.js");
const { CreateAutomaticRefundDto, CreateManualPaymentDto, CreateManualRefundDto } = require("../dist/modules/admin/dto/admin-payment.dto.js");
const { CreateManualOrderDto } = require("../dist/modules/admin/dto/admin-order.dto.js");
const { ValidationPipe } = require("@nestjs/common");
const { plainToInstance } = require("class-transformer");
const { validate } = require("class-validator");

describe("AdminService operational controls", () => {
  const auditTransaction = (models = {}) => ({
    ...models,
    auditLog: {
      findFirst: jest.fn().mockResolvedValue({ entryHash: "previous-hash" }),
      create: jest.fn().mockResolvedValue({}),
    },
  });

  it("returns administrator, old value, new value and timestamp while redacting credentials", async () => {
    const createdAt = new Date("2026-08-16T06:00:00.000Z");
    const prisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue([{
          id: "audit-1", actorId: "admin-1", action: "MERCHANT_APPROVE", entityType: "Business", entityId: "business-1",
          reason: "Merchant evidence was verified.",
          before: { status: "PENDING", owner: { passwordHash: "do-not-expose", tokenHash: "secret-token" } },
          after: { status: "ACTIVE", accessToken: "secret-access" }, requestId: "request-1", previousHash: null,
          entryHash: "entry-hash", createdAt, actor: { id: "admin-1", email: "admin@bnc.test", role: "SUPER_ADMIN" },
        }]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const service = new AdminService(prisma);

    await expect(service.auditLog(1)).resolves.toEqual({
      data: [expect.objectContaining({
        actor: { id: "admin-1", email: "admin@bnc.test", role: "SUPER_ADMIN" },
        reason: "Merchant evidence was verified.", createdAt,
        before: { status: "PENDING", owner: { passwordHash: "[REDACTED]", tokenHash: "[REDACTED]" } },
        after: { status: "ACTIVE", accessToken: "[REDACTED]" },
      })],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ before: true, after: true, actor: expect.any(Object) }),
    }));
  });

  it("creates an active scheduled banner and records the audit reason", async () => {
    const created = { id: "banner-1", title: "Kochi summer", placement: "HOME_HERO", isActive: true };
    const bannerCreate = jest.fn().mockResolvedValue(created);
    const transaction = auditTransaction({ banner: { create: bannerCreate } });
    const media = { promoteBannerObject: jest.fn().mockResolvedValue({ objectKey: "public/banner/admin/hero.webp", publicUrl: "https://cdn.example/hero.webp" }) };
    const service = new AdminService({ $transaction: jest.fn(async (callback) => callback(transaction)) }, media);

    await expect(service.createBanner({
      title: "Kochi summer", subtitle: "Discover local businesses", placement: "HOME_HERO",
      ctaText: "Explore", ctaUrl: "/businesses", imageKey: "quarantine/banner/admin/hero.webp",
      startsAt: "2026-08-16T00:00:00.000Z", endsAt: "2027-08-23T00:00:00.000Z",
      displayOrder: 2, isActive: true, reason: "Approved homepage campaign artwork.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: created });

    expect(media.promoteBannerObject).toHaveBeenCalledWith("admin-1", "quarantine/banner/admin/hero.webp");
    expect(bannerCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      title: "Kochi summer", placement: "HOME_HERO", displayOrder: 2, isActive: true,
      imageKey: "public/banner/admin/hero.webp", createdById: "admin-1", updatedById: "admin-1",
    }) });
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      action: "BANNER_CREATED", entityType: "Banner", entityId: "banner-1", reason: "Approved homepage campaign artwork.",
    }) }));
  });

  it("rejects an invalid banner schedule before promoting its image", async () => {
    const media = { promoteBannerObject: jest.fn() };
    const service = new AdminService({}, media);
    await expect(service.createBanner({
      title: "Invalid schedule", placement: "HOME_HERO", imageKey: "quarantine/banner/admin/hero.webp",
      startsAt: "2026-08-20T00:00:00.000Z", endsAt: "2026-08-19T00:00:00.000Z",
      displayOrder: 0, isActive: true, reason: "Schedule validation regression check.",
    }, "admin-1", "request-1")).rejects.toThrow("end date must be after its start date");
    expect(media.promoteBannerObject).not.toHaveBeenCalled();
  });

  it.each([
    ["PUBLISH", "PUBLISHED", "PRODUCT_PUBLISHED", true],
    ["REJECT", "REJECTED", "PRODUCT_REJECTED", false],
  ])("audits a product %s decision with its reason", async (action, status, auditAction, isActive) => {
    const before = {
      id: "product-1",
      status: "SUBMITTED",
      deletedAt: null,
      media: [],
    };
    const updated = { ...before, status, isActive };
    const transaction = auditTransaction({
      product: {
        findFirst: jest.fn().mockResolvedValue({ id: "product-1" }),
        update: jest.fn().mockResolvedValue(updated),
      },
      productMedia: { update: jest.fn() },
    });
    const prisma = {
      product: { findFirst: jest.fn().mockResolvedValue(before) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    };
    const service = new AdminService(prisma);

    await expect(service.moderateProduct("product-1", {
      action,
      reason: "QA moderation decision.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: updated });

    expect(transaction.product.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status, isActive, moderationReason: "QA moderation decision." }),
    }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: auditAction,
        entityType: "Product",
        entityId: "product-1",
        reason: "QA moderation decision.",
      }),
    }));
  });

  it("rejects product moderation without an audit reason", async () => {
    const service = new AdminService({ product: { findFirst: jest.fn() } });
    await expect(service.moderateProduct("product-1", {
      action: "PUBLISH",
      reason: "",
    }, "admin-1", "request-1")).rejects.toThrow("An audit reason is required");
  });

  it.each([
    ["PUBLISH", "PUBLISHED", "REVIEW_PUBLISHED", null],
    ["REMOVE", "REMOVED", "REVIEW_REMOVED", expect.any(Date)],
  ])("audits and resolves reports for a review %s decision", async (action, status, auditAction, deletedAt) => {
    const before = { id: "review-1", businessId: "business-1", status: "PENDING", deletedAt: null };
    const updated = { ...before, status, deletedAt };
    const transaction = auditTransaction({
      review: {
        findFirst: jest.fn().mockResolvedValue(before),
        update: jest.fn().mockResolvedValue(updated),
        aggregate: jest.fn().mockResolvedValue({ _avg: { overallRating: 4.5 }, _count: 2 }),
      },
      reviewReport: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      business: { update: jest.fn().mockResolvedValue({}) },
    });
    const service = new AdminService({ $transaction: jest.fn(async (callback) => callback(transaction)) });

    await expect(service.moderateReview("review-1", {
      action,
      reason: "  Genuine customer submission reviewed.  ",
    }, "admin-1", "request-1")).resolves.toEqual({ data: updated });

    expect(transaction.review.findFirst).toHaveBeenCalledWith({
      where: { id: "review-1", status: { in: ["PENDING", "FLAGGED"] }, deletedAt: null },
    });
    expect(transaction.review.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status, moderationReason: "Genuine customer submission reviewed.", deletedAt }),
    }));
    expect(transaction.reviewReport.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { reviewId: "review-1", status: "OPEN" },
      data: expect.objectContaining({ status: "RESOLVED", resolvedAt: expect.any(Date) }),
    }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      action: auditAction, entityType: "Review", entityId: "review-1",
      reason: "Genuine customer submission reviewed.",
    }) }));
  });

  it("loads only genuine submitted reviews awaiting moderation", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const service = new AdminService({
      review: { findMany, count },
      $transaction: jest.fn(async (queries) => Promise.all(queries)),
    });

    await expect(service.reviewModeration(1, 25)).resolves.toEqual({
      data: [], meta: { page: 1, pageSize: 25, total: 0 },
    });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: { in: ["PENDING", "FLAGGED"] }, deletedAt: null },
      include: expect.objectContaining({
        business: expect.any(Object), customer: expect.any(Object), reports: expect.any(Object),
      }),
    }));
    expect(count).toHaveBeenCalledWith({
      where: { status: { in: ["PENDING", "FLAGGED"] }, deletedAt: null },
    });
  });

  it("rejects blank reasons and already-decided reviews", async () => {
    const serviceWithoutReason = new AdminService({ $transaction: jest.fn() });
    await expect(serviceWithoutReason.moderateReview("review-1", {
      action: "PUBLISH", reason: "        ",
    }, "admin-1", "request-1")).rejects.toThrow("at least 8 characters");

    const transaction = auditTransaction({
      review: { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() },
      reviewReport: { updateMany: jest.fn() },
    });
    const service = new AdminService({ $transaction: jest.fn(async (callback) => callback(transaction)) });
    await expect(service.moderateReview("review-published", {
      action: "REMOVE", reason: "Attempt to decide an old review.",
    }, "admin-1", "request-2")).rejects.toThrow("Pending or flagged review not found");
    expect(transaction.review.update).not.toHaveBeenCalled();
  });

  it("normalizes percentage ranking weights before storing them", async () => {
    const create = jest.fn().mockResolvedValue({ id: "ranking-3", weights: { relevance: 0.6, distance: 0.4 } });
    const transaction = {
      rankingConfiguration: {
        findFirst: jest.fn().mockResolvedValue({ version: 2 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create,
      },
      auditLog: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new AdminService({
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await service.createRankingConfiguration({
      name: "Balanced ranking",
      weights: { relevance: 60, distance: 40 },
      reason: "Improve local marketplace relevance.",
      activate: true,
    }, "admin-1", "request-1");

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ weights: { relevance: 0.6, distance: 0.4 } }),
    }));
  });

  it("audits support assignment and notifies the ticket owner", async () => {
    const updated = {
      id: "ticket-1",
      ticketNumber: "BNC-1",
      userId: "customer-1",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignedToId: "admin-1",
      resolvedAt: null,
      user: { id: "customer-1", email: "customer@example.com", phone: null },
    };
    const transaction = {
      supportTicket: { update: jest.fn().mockResolvedValue(updated) },
      auditLog: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      notification: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      supportTicket: {
        findUnique: jest.fn().mockResolvedValue({
          id: "ticket-1",
          ticketNumber: "BNC-1",
          userId: "customer-1",
          status: "OPEN",
          priority: "LOW",
          assignedToId: null,
          resolvedAt: null,
          user: { id: "customer-1", email: "customer@example.com", phone: null },
        }),
      },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    };
    const service = new AdminService(prisma);

    await expect(service.updateSupportTicket("ticket-1", {
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignToMe: true,
      note: "Assigned for an urgent customer follow-up.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: updated });

    expect(transaction.supportTicket.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ assignedToId: "admin-1", status: "IN_PROGRESS", priority: "HIGH" }),
    }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "SUPPORT_TICKET_UPDATED", reason: "Assigned for an urgent customer follow-up." }),
    }));
    expect(transaction.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "customer-1", type: "SUPPORT_UPDATE" }),
    }));
  });

  it.each([
    ["users", "user", "SET_STATUS", "SUSPENDED", "status"],
    ["leads", "lead", "SET_STATUS", "SPAM", "status"],
    ["enquiries", "enquiry", "SET_STATUS", "CLOSED", "status"],
    ["orders", "order", "SET_STATUS", "DELIVERED", "status"],
    ["advertisements", "advertisement", "SET_STATUS", "PAUSED", "status"],
  ])("applies and audits allowlisted %s lifecycle changes", async (section, model, action, value, field) => {
    const before = { id: "record-1", status: "ACTIVE", deletedAt: null };
    const updated = { ...before, [field]: value };
    const lookupName = model === "user" ? "findFirst" : "findUnique";
    const prisma = {
      [model]: { [lookupName]: jest.fn().mockResolvedValue(before) },
      $transaction: jest.fn(async (callback) => callback(auditTransaction({
        [model]: { update: jest.fn().mockResolvedValue(updated) },
      }))),
    };
    const service = new AdminService(prisma);

    await expect(service.applyOperationalAction(section, "record-1", {
      action,
      value,
      reason: "Required operational correction.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: updated });
  });

  it("keeps business verification, premium, and status actions explicitly separated", async () => {
    const before = { id: "business-1", status: "ACTIVE", verified: false, premium: false, deletedAt: null };
    const update = jest.fn().mockResolvedValue({ ...before, premium: true });
    const transaction = auditTransaction({ business: { update } });
    const service = new AdminService({
      business: { findFirst: jest.fn().mockResolvedValue(before) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await service.applyOperationalAction("businesses", "business-1", {
      action: "SET_PREMIUM",
      reason: "Approved commercial entitlement.",
    }, "admin-1", "request-1");

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { premium: true } }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "ADMIN_BUSINESSES_SET_PREMIUM", entityType: "Business" }),
    }));
  });

  it("approves a pending merchant, closes the verification request, notifies the owner, and audits the decision", async () => {
    const before = {
      id: "business-1", status: "PENDING_VERIFICATION", verified: false,
      publishedAt: null, deletedAt: null, owner: { userId: "owner-1" },
    };
    const updated = { ...before, status: "ACTIVE", verified: true };
    const transaction = auditTransaction({
      verificationRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      business: { update: jest.fn().mockResolvedValue(updated) },
      notification: { create: jest.fn().mockResolvedValue({}) },
    });
    const service = new AdminService({
      business: { findFirst: jest.fn().mockResolvedValue(before) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await expect(service.updateMerchantStatus("business-1", {
      action: "APPROVE", reason: "Identity and address evidence verified.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: updated });
    expect(transaction.business.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "ACTIVE", verified: true }) }));
    expect(transaction.verificationRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED", reviewerId: "admin-1" }) }));
    expect(transaction.notification.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "owner-1" }) }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "MERCHANT_APPROVE" }) }));
  });

  it("does not reactivate an unverified suspended merchant", async () => {
    const service = new AdminService({
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", status: "SUSPENDED", verified: false, deletedAt: null, owner: { userId: "owner-1" } }) },
    });
    await expect(service.updateMerchantStatus("business-1", {
      action: "REACTIVATE", reason: "Requested reactivation review.",
    }, "admin-1", "request-1")).rejects.toThrow("previously approved");
  });

  it("deletes only an unused category", async () => {
    const remove = jest.fn().mockResolvedValue({});
    const service = new AdminService({ category: { findUnique: jest.fn().mockResolvedValue({ id: "category-1", _count: { children: 0, businessLinks: 0, products: 0, services: 0 } }), delete: remove } });
    await expect(service.deleteCategory("category-1")).resolves.toEqual({ data: { id: "category-1", deleted: true } });
    expect(remove).toHaveBeenCalledWith({ where: { id: "category-1" } });
  });

  it("refuses to delete a location linked to a listing", async () => {
    const service = new AdminService({ managedLocation: { findUnique: jest.fn().mockResolvedValue({ id: "location-1", _count: { children: 0, businesses: 2 } }), delete: jest.fn() } });
    await expect(service.deleteManagedLocation("location-1")).rejects.toThrow("can only be deactivated");
  });

  it.each([
    ["categories", "category", "DEACTIVATE", { isActive: false }],
    ["services", "service", "ACTIVATE", { isActive: true }],
    ["plans", "subscriptionPlan", "DEACTIVATE", { isActive: false }],
    ["offers", "offer", "FEATURE", { isFeatured: true }],
    ["reports", "reviewReport", "RESOLVE", { status: "RESOLVED" }],
    ["content", "businessMedia", "QUARANTINE", { scanStatus: "quarantined" }],
    ["settings", "globalRoleAssignment", "REVOKE", { active: false }],
  ])("supports audited %s controls", async (section, model, action, expectedData) => {
    const before = {
      id: "record-1",
      parentId: section === "categories" ? null : undefined,
      deletedAt: null,
      isActive: true,
      active: true,
    };
    const lookupName = model === "service" ? "findFirst" : "findUnique";
    const update = jest.fn().mockResolvedValue({ ...before, ...expectedData });
    const service = new AdminService({
      [model]: { [lookupName]: jest.fn().mockResolvedValue(before) },
      $transaction: jest.fn(async (callback) => callback(auditTransaction({ [model]: { update } }))),
    });

    await service.applyOperationalAction(section, "record-1", {
      action,
      reason: "Reviewed and approved by operations.",
    }, "admin-1", "request-1");

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining(expectedData) }));
  });

  it("makes one business location primary in a single audited transaction", async () => {
    const before = { id: "location-1", businessId: "business-1", isPrimary: false, isActive: false };
    const updateMany = jest.fn().mockResolvedValue({ count: 2 });
    const update = jest.fn().mockResolvedValue({ ...before, isPrimary: true, isActive: true });
    const transaction = auditTransaction({ businessLocation: { updateMany, update } });
    const service = new AdminService({
      businessLocation: { findUnique: jest.fn().mockResolvedValue(before) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await service.applyOperationalAction("locations", "location-1", {
      action: "MAKE_PRIMARY",
      reason: "Confirmed main customer-facing branch.",
    }, "admin-1", "request-1");

    expect(updateMany).toHaveBeenCalledWith({
      where: { businessId: "business-1", id: { not: "location-1" } },
      data: { isPrimary: false },
    });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { isPrimary: true, isActive: true } }));
  });

  it("stores an attributed manual translation correction", async () => {
    const before = { id: "translation-1", translatedText: "Old copy", status: "AUTOMATIC" };
    const update = jest.fn().mockResolvedValue({ ...before, translatedText: "Corrected copy", status: "MANUALLY_CORRECTED" });
    const service = new AdminService({
      translation: { findUnique: jest.fn().mockResolvedValue(before) },
      $transaction: jest.fn(async (callback) => callback(auditTransaction({ translation: { update } }))),
    });

    await service.applyOperationalAction("translations", "translation-1", {
      action: "CORRECT",
      value: "Corrected copy",
      reason: "Native-language editor approved the correction.",
    }, "admin-1", "request-1");

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        translatedText: "Corrected copy",
        status: "MANUALLY_CORRECTED",
        correctedById: "admin-1",
      }),
    }));
  });

  it("creates a parent-linked category and writes its audit entry", async () => {
    const created = { id: "subcategory-1", name: "AC repair", slug: "ac-repair", parentId: "category-1", level: 1, isActive: true };
    const create = jest.fn().mockResolvedValue(created);
    const transaction = auditTransaction({ category: { create } });
    const service = new AdminService({
      category: {
        findUnique: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: "category-1", level: 0 }),
      },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await expect(service.createOperationalRecord("subcategories", {
      data: { name: "AC repair", slug: "ac-repair", parentId: "category-1", description: "Cooling system repair services." },
      reason: "Requested by taxonomy operations.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: created });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ parentId: "category-1", level: 1, isActive: true }),
    }));
  });

  it("creates only a targeted in-app notification for a known user", async () => {
    const created = { id: "notification-1", userId: "user-1", title: "Account update", sentAt: new Date() };
    const create = jest.fn().mockResolvedValue(created);
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue({ id: "user-1", email: "user@example.com" }) },
      $transaction: jest.fn(async (callback) => callback(auditTransaction({ notification: { create } }))),
    });

    await service.createOperationalRecord("notifications", {
      data: { recipientEmail: "user@example.com", title: "Account update", body: "Your account review is complete." },
      reason: "Customer requested a status update.",
    }, "admin-1", "request-1");

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "user-1", channel: "IN_APP", type: "SUPPORT_UPDATE" }),
    }));
  });

  it("records a captured manual subscription payment with status history and audit evidence", async () => {
    const created = { id: "payment-1", subscriptionId: "subscription-1", provider: "MANUAL", status: "CAPTURED", amount: 1250 };
    const create = jest.fn().mockResolvedValue(created);
    const transaction = auditTransaction({ payment: { create } });
    const service = new AdminService({
      businessSubscription: { findUnique: jest.fn().mockResolvedValue({
        id: "subscription-1", business: { id: "business-1", name: "Demo Merchant" }, plan: { id: "plan-1", name: "Gold" },
      }) },
      payment: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await expect(service.createManualPayment({
      subscriptionId: "subscription-1", amount: 1250, method: "UPI", reference: "upi-12345",
      receivedAt: "2026-08-15T10:00:00.000Z", evidence: "Verified in bank statement.",
      confirmedReceived: true, reason: "Offline receipt reconciled by finance.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: created });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      subscriptionId: "subscription-1", provider: "MANUAL", providerPaymentId: "MANUAL-UPI-UPI-12345",
      amount: 1250, currency: "INR", status: "CAPTURED",
      metadata: expect.objectContaining({ evidence: "Verified in bank statement." }),
      statusHistory: { create: expect.objectContaining({ newStatus: "CAPTURED", source: "ADMIN_MANUAL", actorId: "admin-1", metadata: expect.objectContaining({ evidence: "Verified in bank statement." }) }) },
    }) }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "PAYMENT_MANUAL_CAPTURED", entityType: "Payment" }),
    }));
  });

  it("rejects a duplicate manual payment reference", async () => {
    const service = new AdminService({
      businessSubscription: { findUnique: jest.fn().mockResolvedValue({
        id: "subscription-1", business: { id: "business-1", name: "Demo Merchant" }, plan: { id: "plan-1", name: "Gold" },
      }) },
      payment: { findUnique: jest.fn().mockResolvedValue({ id: "existing-payment" }) },
    });

    await expect(service.createManualPayment({
      subscriptionId: "subscription-1", amount: 1250, method: "UPI", reference: "upi-12345",
      receivedAt: "2026-08-15T10:00:00.000Z", evidence: "Verified in bank statement.", confirmedReceived: true,
      reason: "Offline receipt reconciled by finance.",
    }, "admin-1", "request-1")).rejects.toThrow("already been recorded");
  });

  it("validates all required manual-payment evidence and receipt fields", async () => {
    const invalid = plainToInstance(CreateManualPaymentDto, {
      subscriptionId: "",
      amount: 0,
      method: "CARD",
      reference: "x",
      receivedAt: "not-a-date",
      evidence: "short",
      confirmedReceived: false,
      reason: "short",
    });
    const properties = (await validate(invalid)).map((error) => error.property);

    expect(properties).toEqual(expect.arrayContaining([
      "subscriptionId", "amount", "method", "reference", "receivedAt",
      "evidence", "confirmedReceived", "reason",
    ]));
  });

  it.each(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE"])("accepts the supported %s offline payment method", async (method) => {
    const valid = plainToInstance(CreateManualPaymentDto, {
      subscriptionId: "subscription-1",
      amount: 1250,
      method,
      reference: `receipt-${method}`,
      receivedAt: "2026-08-15T10:00:00.000Z",
      evidence: "Receipt matched to the reconciliation ledger.",
      confirmedReceived: true,
      reason: "Offline receipt reconciled by finance.",
    });

    await expect(validate(valid)).resolves.toHaveLength(0);
  });

  it("rejects a manual payment dated in the future", async () => {
    const service = new AdminService({});
    await expect(service.createManualPayment({
      subscriptionId: "subscription-1", amount: 1250, method: "CASH", reference: "receipt-123",
      receivedAt: new Date(Date.now() + 600_000).toISOString(), evidence: "Signed cash receipt 123.",
      confirmedReceived: true, reason: "Offline cash receipt reconciled.",
    }, "admin-1", "request-1")).rejects.toThrow("cannot be in the future");
  });

  it("rejects a manual payment for an unknown subscription", async () => {
    const service = new AdminService({
      businessSubscription: { findUnique: jest.fn().mockResolvedValue(null) },
      payment: { findUnique: jest.fn().mockResolvedValue(null) },
    });
    await expect(service.createManualPayment({
      subscriptionId: "missing-subscription", amount: 1250, method: "CHEQUE", reference: "cheque-123",
      receivedAt: "2026-08-15T10:00:00.000Z", evidence: "Cheque deposit slip 123.",
      confirmedReceived: true, reason: "Cheque receipt reconciled by finance.",
    }, "admin-1", "request-1")).rejects.toThrow("Subscription not found");
  });

  it("records a completed manual refund and updates the payment to partially refunded", async () => {
    const created = { id: "refund-1", paymentId: "payment-1", amount: 250, status: "COMPLETED", source: "MANUAL" };
    const refundCreate = jest.fn().mockResolvedValue(created);
    const paymentUpdate = jest.fn().mockResolvedValue({ id: "payment-1", status: "PARTIALLY_REFUNDED" });
    const transaction = auditTransaction({ refund: { create: refundCreate }, payment: {
      findUnique: jest.fn().mockResolvedValue({ id: "payment-1", orderId: null, amount: 1000, currency: "INR", status: "CAPTURED", refunds: [] }),
      update: paymentUpdate,
    } });
    const service = new AdminService({
      payment: { findUnique: jest.fn().mockResolvedValue({ id: "payment-1", orderId: null, amount: 1000, currency: "INR", status: "CAPTURED", refunds: [] }) },
      refund: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await expect(service.createManualRefund({
      paymentId: "payment-1", amount: 250, method: "UPI", reference: "refund-123",
      completedAt: "2026-08-15T10:00:00.000Z", evidence: "Matched to bank statement.",
      confirmedReturned: true, reason: "Customer cancellation refund completed.", auditReason: "Finance verified the approved return.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: created });

    expect(refundCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      paymentId: "payment-1", orderId: null, amount: 250, status: "COMPLETED", source: "MANUAL",
      providerRefundId: "MANUAL-UPI-REFUND-123", requestedById: "admin-1", notes: "Matched to bank statement.",
      metadata: expect.objectContaining({ evidence: "Matched to bank statement.", auditReason: "Finance verified the approved return." }),
    }) }));
    expect(paymentUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      status: "PARTIALLY_REFUNDED",
      statusHistory: { create: expect.objectContaining({ source: "ADMIN_MANUAL_REFUND", newStatus: "PARTIALLY_REFUNDED", reason: "Finance verified the approved return.", metadata: expect.objectContaining({ refundReason: "Customer cancellation refund completed.", evidence: "Matched to bank statement." }) }) },
    }) }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "REFUND_MANUAL_COMPLETED", reason: "Finance verified the approved return." }) }));
  });

  it("rejects a refund larger than the unreserved payment balance", async () => {
    const service = new AdminService({
      payment: { findUnique: jest.fn().mockResolvedValue({ id: "payment-1", amount: 1000, currency: "INR", status: "PARTIALLY_REFUNDED", refunds: [{ amount: 800 }] }) },
    });
    await expect(service.createManualRefund({
      paymentId: "payment-1", amount: 250, method: "UPI", reference: "refund-124",
      completedAt: "2026-08-15T10:00:00.000Z", evidence: "Matched to bank statement.", confirmedReturned: true,
      reason: "Customer cancellation refund completed.", auditReason: "Finance verified the approved return.",
    }, "admin-1", "request-1")).rejects.toThrow("available balance of 200.00 INR");
  });

  it("initiates a Razorpay refund but leaves completion to the signed webhook", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ id: "rfnd_provider_1", payment_id: "pay_provider_1", amount: 50000, status: "pending" }) });
    const created = { id: "refund-automatic-1", paymentId: "payment-1", amount: 500, status: "REQUESTED" };
    const transaction = auditTransaction({
      refund: { create: jest.fn().mockResolvedValue(created) },
      payment: { findUnique: jest.fn().mockResolvedValue({ id: "payment-1", orderId: "order-1", amount: 1000, currency: "INR", status: "CAPTURED", provider: "razorpay", providerPaymentId: "pay_provider_1", refunds: [] }) },
    });
    const update = jest.fn().mockResolvedValue({ ...created, status: "PROCESSING", providerRefundId: "rfnd_provider_1" });
    const prisma = {
      payment: { findUnique: jest.fn().mockResolvedValue({ id: "payment-1", orderId: "order-1", amount: 1000, currency: "INR", status: "CAPTURED", provider: "razorpay", providerPaymentId: "pay_provider_1", refunds: [] }) },
      refund: { update },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    };
    const config = { get: jest.fn((key) => key === "RAZORPAY_KEY_ID" ? "rzp_test" : key === "RAZORPAY_KEY_SECRET" ? "secret" : undefined) };
    const service = new AdminService(prisma, undefined, config);
    try {
      await expect(service.createAutomaticRefund({ paymentId: "payment-1", amount: 500, reason: "Customer cancellation approved for refund.", auditReason: "Finance authorised the provider refund request." }, "admin-1", "request-1"))
        .resolves.toEqual({ data: expect.objectContaining({ status: "PROCESSING" }), confirmationPending: true });
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PROCESSING", providerRefundId: "rfnd_provider_1" }) }));
      expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETED" }) }));
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("requires manual refund evidence and a separate audit reason", async () => {
    const invalid = plainToInstance(CreateManualRefundDto, {
      paymentId: "payment-1", amount: 250, method: "UPI", reference: "refund-125",
      completedAt: "2026-08-15T10:00:00.000Z", evidence: "short", confirmedReturned: true,
      reason: "Customer cancellation refund completed.", auditReason: "short",
    });
    const properties = (await validate(invalid)).map((error) => error.property);
    expect(properties).toEqual(expect.arrayContaining(["evidence", "auditReason"]));
  });

  it.each([
    [CreateManualRefundDto, { paymentId: "payment-1", amount: 250, method: "UPI", reference: "refund-126", completedAt: "2026-08-15T10:00:00.000Z", evidence: "Matched to bank statement.", confirmedReturned: true, reason: "Customer cancellation refund completed.", auditReason: "Finance verified the approved return.", status: "COMPLETED" }],
    [CreateAutomaticRefundDto, { paymentId: "payment-1", amount: 250, reason: "Customer cancellation refund completed.", auditReason: "Finance authorised the provider refund request.", status: "COMPLETED" }],
  ])("rejects browser-supplied refund status fields", async (metatype, payload) => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
    const error = await pipe.transform(payload, { type: "body", metatype }).then(() => null, (caught) => caught);
    expect(error?.getResponse()).toEqual(expect.objectContaining({
      message: expect.arrayContaining([expect.stringMatching(/status should not exist/i)]),
    }));
  });

  it("creates an audited pending manual order from catalogue prices without creating a payment", async () => {
    const created = { id: "order-1", orderNumber: "BNC-260815-ABC123", status: "PENDING", source: "ADMIN_MANUAL", total: 950, items: [{ productId: "product-1", quantity: 2, unitPrice: 500, total: 1000 }] };
    const orderCreate = jest.fn().mockResolvedValue(created);
    const transaction = auditTransaction({
      order: { findUnique: jest.fn().mockResolvedValue(null), create: orderCreate },
      productVariant: { updateMany: jest.fn() },
      notification: { create: jest.fn().mockResolvedValue({}) },
    });
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue({ id: "customer-1", email: "customer@example.com", phone: null }) },
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Demo Store" }) },
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      product: { findMany: jest.fn().mockResolvedValue([{ id: "product-1", name: "Demo product", price: 500, discountPrice: null, minimumOrderQty: 1, variants: [] }]) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await expect(service.createManualOrder({
      customerId: "customer-1", businessId: "business-1", externalReference: "pos-1001", fulfilmentType: "pickup",
      discount: 100, tax: 50, deliveryFee: 0, notes: "Counter order", items: [{ productId: "product-1", quantity: 2 }],
      reason: "Entered from the verified counter invoice.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: created });

    expect(orderCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      customerId: "customer-1", businessId: "business-1", source: "ADMIN_MANUAL", externalReference: "POS-1001",
      status: "PENDING", subtotal: 1000, discount: 100, tax: 50, deliveryFee: 0, total: 950,
      items: { create: [expect.objectContaining({ productId: "product-1", quantity: 2, unitPrice: 500, total: 1000 })] },
    }) }));
    expect(transaction.notification.create).toHaveBeenCalled();
    expect(transaction.payment).toBeUndefined();
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "ORDER_MANUAL_CREATED" }) }));
  });

  it("rejects a manual order discount above the catalogue subtotal", async () => {
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue({ id: "customer-1" }) },
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Demo Store" }) },
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      product: { findMany: jest.fn().mockResolvedValue([{ id: "product-1", name: "Demo product", price: 500, discountPrice: null, minimumOrderQty: 1, variants: [] }]) },
    });
    await expect(service.createManualOrder({
      customerId: "customer-1", businessId: "business-1", externalReference: "pos-1002", fulfilmentType: "pickup",
      discount: 600, items: [{ productId: "product-1", quantity: 1 }], reason: "Entered from a verified counter invoice.",
    }, "admin-1", "request-1")).rejects.toThrow("Discount cannot exceed");
  });

  it("rejects browser attempts to override catalogue pricing", async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
    const payload = {
      customerId: "customer-1", businessId: "business-1", externalReference: "pos-1003", fulfilmentType: "pickup",
      subtotal: 1, total: 1, items: [{ productId: "product-1", quantity: 1, unitPrice: 1 }],
      reason: "Entered from a verified counter invoice.",
    };
    const error = await pipe.transform(payload, { type: "body", metatype: CreateManualOrderDto }).then(() => null, (caught) => caught);
    const response = error?.getResponse();
    expect(response?.message.join(" ")).toMatch(/subtotal should not exist/i);
    expect(response?.message.join(" ")).toMatch(/total should not exist/i);
    expect(response?.message.join(" ")).toMatch(/unitPrice should not exist/i);
  });

  it("rejects a manual order when variant stock is insufficient", async () => {
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue({ id: "customer-1" }) },
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Demo Store" }) },
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      product: { findMany: jest.fn().mockResolvedValue([{ id: "product-1", name: "Demo product", price: 500, discountPrice: null, minimumOrderQty: 1, variants: [{ id: "variant-1", name: "Small", sku: "SMALL", price: 550, stock: 1 }] }]) },
    });
    await expect(service.createManualOrder({
      customerId: "customer-1", businessId: "business-1", externalReference: "pos-1004", fulfilmentType: "pickup",
      items: [{ productId: "product-1", variantId: "variant-1", quantity: 2 }], reason: "Entered from a verified counter invoice.",
    }, "admin-1", "request-1")).rejects.toThrow("Insufficient stock");
  });

  it("rejects inactive, unpublished, or cross-business products", async () => {
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue({ id: "customer-1" }) },
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Demo Store" }) },
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      product: { findMany: jest.fn().mockResolvedValue([]) },
    });
    await expect(service.createManualOrder({
      customerId: "customer-1", businessId: "business-1", externalReference: "pos-1005", fulfilmentType: "pickup",
      items: [{ productId: "inactive-product", quantity: 1 }], reason: "Entered from a verified counter invoice.",
    }, "admin-1", "request-1")).rejects.toThrow("products are unavailable");
  });

  it("rejects an invalid or inactive manual-order customer", async () => {
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Demo Store" }) },
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      product: { findMany: jest.fn().mockResolvedValue([{ id: "product-1", name: "Demo product", price: 500, discountPrice: null, minimumOrderQty: 1, variants: [] }]) },
    });
    await expect(service.createManualOrder({
      customerId: "missing-customer", businessId: "business-1", externalReference: "pos-1006", fulfilmentType: "pickup",
      items: [{ productId: "product-1", quantity: 1 }], reason: "Entered from a verified counter invoice.",
    }, "admin-1", "request-1")).rejects.toThrow("Active customer not found");
  });

  it("rejects a duplicate external order reference for the business", async () => {
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue({ id: "customer-1" }) },
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Demo Store" }) },
      order: { findUnique: jest.fn().mockResolvedValue({ id: "existing-order" }) },
      product: { findMany: jest.fn().mockResolvedValue([{ id: "product-1", name: "Demo product", price: 500, discountPrice: null, minimumOrderQty: 1, variants: [] }]) },
    });
    await expect(service.createManualOrder({
      customerId: "customer-1", businessId: "business-1", externalReference: "pos-1001", fulfilmentType: "pickup",
      items: [{ productId: "product-1", quantity: 1 }], reason: "Entered from a verified counter invoice.",
    }, "admin-1", "request-1")).rejects.toThrow("external order reference has already been recorded");
  });

  it("creates, audits and notifies one customer about a private admin offer", async () => {
    const created = { id: "offer-private-1", title: "Private saving", business: { name: "Demo Store" }, targetCustomer: { id: "customer-1" } };
    const offerCreate = jest.fn().mockResolvedValue(created);
    const notificationCreate = jest.fn().mockResolvedValue({});
    const transaction = auditTransaction({
      offer: { findFirst: jest.fn().mockResolvedValue(null), create: offerCreate },
      notification: { create: notificationCreate },
    });
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue({ id: "customer-1", email: "customer@example.com", phone: null, customerProfile: { displayName: "Customer" } }) },
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Demo Store" }) },
      product: { count: jest.fn().mockResolvedValue(1) },
      service: { count: jest.fn().mockResolvedValue(0) },
      offer: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await expect(service.createTargetedOffer({
      customerId: "customer-1", businessId: "business-1", title: "Private saving",
      description: "A private discount for a selected customer.", type: "PERCENTAGE", discountValue: 20,
      couponCode: "private20", startsAt: "2026-08-15T12:00:00.000Z", endsAt: "2027-08-22T12:00:00.000Z",
      maxRedemptions: 1, productIds: ["product-1"], reason: "Customer retention offer approved by operations.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: created });

    expect(offerCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      targetCustomerId: "customer-1", businessId: "business-1", source: "ADMIN_TARGETED",
      couponCode: "PRIVATE20", moderationStatus: "APPROVED", isActive: true, isFeatured: false,
    }) }));
    expect(notificationCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      userId: "customer-1", data: expect.objectContaining({ offerId: "offer-private-1", private: true }),
    }) }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "OFFER_TARGETED_CREATED" }) }));
  });

  it("rejects private offer catalogue items owned by another business", async () => {
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue({ id: "customer-1" }) },
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Demo Store" }) },
      product: { count: jest.fn().mockResolvedValue(0) }, service: { count: jest.fn().mockResolvedValue(0) },
      offer: { findFirst: jest.fn().mockResolvedValue(null) }, $transaction: jest.fn(),
    });
    await expect(service.createTargetedOffer({
      customerId: "customer-1", businessId: "business-1", title: "Private saving",
      description: "A private discount for a selected customer.", type: "FLAT", discountValue: 100,
      couponCode: "private100", startsAt: "2026-08-15T12:00:00.000Z", endsAt: "2027-08-22T12:00:00.000Z",
      productIds: ["foreign-product"], reason: "Customer retention offer approved by operations.",
    }, "admin-1", "request-1")).rejects.toThrow("owned by the selected business");
  });

  it("creates an audited scheduled advertisement with zero recorded performance", async () => {
    const created = { id: "advertisement-1", title: "Kochi campaign", status: "SCHEDULED", spent: 0, impressions: 0, clicks: 0 };
    const advertisementCreate = jest.fn().mockResolvedValue(created);
    const transaction = auditTransaction({ advertisement: { create: advertisementCreate } });
    const media = { promoteAdvertisementObject: jest.fn().mockResolvedValue({ objectKey: "public/advertisement/admin/campaign.webp", publicUrl: "https://cdn.example/campaign.webp" }) };
    const service = new AdminService({
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Demo Store", status: "ACTIVE" }) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    }, media);

    await expect(service.createAdvertisement({
      businessId: "business-1", title: "Kochi campaign", placement: "SEARCH_RESULTS", audience: "CITY", location: "Kochi",
      creativeKey: "quarantine/advertisement/admin/campaign.webp", destination: "/offers", budget: 25000, status: "SCHEDULED",
      startsAt: "2026-08-16T08:00:00.000Z", endsAt: "2027-08-31T18:00:00.000Z", reason: "Approved regional acquisition campaign.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: created });

    expect(media.promoteAdvertisementObject).toHaveBeenCalledWith("admin-1", "quarantine/advertisement/admin/campaign.webp");
    expect(advertisementCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      businessId: "business-1", placement: "SEARCH_RESULTS", target: { audience: "CITY", location: "Kochi" },
      creativeKey: "public/advertisement/admin/campaign.webp", destination: "/offers", budget: 25000,
      status: "SCHEDULED", spent: 0, impressions: 0, clicks: 0,
    }) }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "ADVERTISEMENT_ADMIN_CREATED" }) }));
  });

  it("prevents a non-active business from sponsoring a scheduled advertisement", async () => {
    const service = new AdminService({
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1", name: "Draft Store", status: "PENDING_VERIFICATION" }) },
      $transaction: jest.fn(),
    });
    await expect(service.createAdvertisement({
      businessId: "business-1", title: "Draft campaign", placement: "LISTINGS", audience: "ALL",
      destination: "/businesses", budget: 5000, status: "SCHEDULED",
      startsAt: "2026-08-16T08:00:00.000Z", endsAt: "2027-08-31T18:00:00.000Z", reason: "Prepared before merchant approval.",
    }, "admin-1", "request-1")).rejects.toThrow("Save it as draft");
  });

  it("creates an audited service only in a category linked to its business", async () => {
    const created = {
      id: "service-1", businessId: "business-1", categoryId: "category-1",
      name: "AC repair", slug: "ac-repair", isActive: true,
      business: { id: "business-1", name: "Demo Merchant" },
      category: { id: "category-1", name: "Home services" },
    };
    const create = jest.fn().mockResolvedValue(created);
    const linkCategory = jest.fn().mockResolvedValue({ businessId: "business-1", categoryId: "category-1" });
    const transaction = auditTransaction({ service: { create }, businessCategory: { upsert: linkCategory } });
    const service = new AdminService({
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1" }) },
      category: { findUnique: jest.fn().mockResolvedValue({ id: "category-1", isActive: true }) },
      service: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await expect(service.createOperationalRecord("services", {
      data: {
        businessId: "business-1", categoryId: "category-1", name: "AC repair",
        slug: "ac-repair", description: "On-site air conditioning repair.",
        pricingType: "STARTING_AT", startingPrice: "500", durationMinutes: "60",
        homeService: "true", isActive: "true",
      },
      reason: "Added after merchant support verification.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: created });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        businessId: "business-1", categoryId: "category-1", startingPrice: 500,
        durationMinutes: 60, homeService: true, isActive: true,
      }),
      include: expect.objectContaining({ business: expect.any(Object), category: expect.any(Object) }),
    }));
    expect(linkCategory).toHaveBeenCalledWith(expect.objectContaining({
      where: { businessId_categoryId: { businessId: "business-1", categoryId: "category-1" } },
    }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "ADMIN_SERVICE_CREATED", entityType: "Service" }),
    }));
  });

  it("rejects service creation when the category is inactive or missing", async () => {
    const service = new AdminService({
      business: { findFirst: jest.fn().mockResolvedValue({ id: "business-1" }) },
      category: { findUnique: jest.fn().mockResolvedValue(null) },
      service: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(),
    });

    await expect(service.createOperationalRecord("services", {
      data: {
        businessId: "business-1", categoryId: "category-2", name: "AC repair",
        slug: "ac-repair", description: "On-site air conditioning repair.",
        pricingType: "QUOTE",
      },
      reason: "Requested by the operations team.",
    }, "admin-1", "request-1")).rejects.toThrow("active category");
  });

  it.each([
    [{ startingPrice: "-1", durationMinutes: "60" }, "non-negative amount"],
    [{ startingPrice: "500", durationMinutes: "0" }, "whole number between 1 and 10080"],
    [{ startingPrice: "500", durationMinutes: "12.5" }, "whole number between 1 and 10080"],
  ])("rejects invalid service price or duration values", async (invalid, message) => {
    const service = new AdminService({});
    await expect(service.createOperationalRecord("services", {
      data: {
        businessId: "business-1", categoryId: "category-1", name: "AC repair",
        slug: "ac-repair", description: "On-site air conditioning repair.",
        pricingType: "STARTING_AT", ...invalid,
      },
      reason: "QA validation for service creation.",
    }, "admin-1", "request-1")).rejects.toThrow(message);
  });

  it("rejects service creation when the selected business does not exist", async () => {
    const service = new AdminService({
      business: { findFirst: jest.fn().mockResolvedValue(null) },
      category: { findUnique: jest.fn().mockResolvedValue({ id: "category-1", isActive: true }) },
      service: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(),
    });
    await expect(service.createOperationalRecord("services", {
      data: {
        businessId: "missing-business", categoryId: "category-1", name: "AC repair",
        slug: "ac-repair", description: "On-site air conditioning repair.",
        pricingType: "STARTING_AT", startingPrice: "500", durationMinutes: "60",
      },
      reason: "QA validation for missing business.",
    }, "admin-1", "request-1")).rejects.toThrow("Business not found");
  });

  it("creates an audited, attributed manual translation", async () => {
    const created = {
      id: "translation-1", entityType: "WEBSITE", entityId: "homepage.hero", field: "title",
      sourceLanguage: "en", targetLanguage: "ml", originalText: "Find local businesses",
      translatedText: "പ്രാദേശിക ബിസിനസുകൾ കണ്ടെത്തുക", provider: "ADMIN", status: "MANUALLY_CORRECTED",
    };
    const create = jest.fn().mockResolvedValue(created);
    const transaction = auditTransaction({ translation: { create } });
    const service = new AdminService({
      translation: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });

    await expect(service.createOperationalRecord("translations", {
      data: {
        entityType: "WEBSITE", entityId: "homepage.hero", field: "title",
        sourceLanguage: "en", targetLanguage: "ml", originalText: "Find local businesses",
        translatedText: "പ്രാദേശിക ബിസിനസുകൾ കണ്ടെത്തുക",
      },
      reason: "Approved Malayalam homepage copy.",
    }, "admin-1", "request-1")).resolves.toEqual({ data: created });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      entityType: "WEBSITE", entityId: "homepage.hero", field: "title", provider: "ADMIN",
      status: "MANUALLY_CORRECTED", correctedById: "admin-1",
    }) }));
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      action: "ADMIN_TRANSLATION_CREATED", entityType: "Translation",
    }) }));
  });

  it("rejects duplicate localization keys", async () => {
    const service = new AdminService({
      translation: { findUnique: jest.fn().mockResolvedValue({ id: "translation-existing" }) },
      $transaction: jest.fn(),
    });
    await expect(service.createOperationalRecord("translations", {
      data: {
        entityType: "WEBSITE", entityId: "homepage.hero", field: "title",
        sourceLanguage: "en", targetLanguage: "ml", originalText: "Find local businesses",
        translatedText: "പ്രാദേശിക ബിസിനസുകൾ കണ്ടെത്തുക",
      },
      reason: "Attempted duplicate translation.",
    }, "admin-1", "request-1")).rejects.toThrow("already exists");
  });

  it("rejects unsupported section actions before any mutation", async () => {
    const service = new AdminService({ $transaction: jest.fn() });
    await expect(service.applyOperationalAction("audit-log", "entry-1", {
      action: "DELETE",
      reason: "This must never be allowed.",
    }, "admin-1", "request-1")).rejects.toThrow("read-only");
  });

  it("prevents an administrator from suspending their own account", async () => {
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue({ id: "admin-1", status: "ACTIVE", deletedAt: null }) },
      $transaction: jest.fn(),
    });
    await expect(service.applyOperationalAction("users", "admin-1", {
      action: "SET_STATUS",
      value: "SUSPENDED",
      reason: "Attempted self suspension.",
    }, "admin-1", "request-1")).rejects.toThrow("cannot suspend your own");
  });

  it("trims user search and enforces bounded pagination", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const service = new AdminService({
      user: { findMany, count },
      $transaction: jest.fn(async (queries) => Promise.all(queries)),
    });
    await expect(service.users(0, 500, "  customer@example.com  ")).resolves.toEqual({
      data: [], meta: { page: 1, pageSize: 100, total: 0 },
    });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 0, take: 100,
      where: expect.objectContaining({ OR: expect.arrayContaining([
        { email: { contains: "customer@example.com", mode: "insensitive" } },
      ]) }),
    }));
  });

  it.each([
    ["ACTIVE", "SUSPENDED"],
    ["SUSPENDED", "ACTIVE"],
  ])("changes a user from %s to %s with a trimmed audited reason", async (currentStatus, nextStatus) => {
    const before = { id: "customer-1", role: "CUSTOMER", status: currentStatus, deletedAt: null };
    const transaction = auditTransaction({
      user: { update: jest.fn().mockResolvedValue({ ...before, status: nextStatus }) },
    });
    const service = new AdminService({
      user: { findFirst: jest.fn().mockResolvedValue(before) },
      $transaction: jest.fn(async (callback) => callback(transaction)),
    });
    await service.updateUserStatus("customer-1", {
      status: nextStatus, reason: "  Reviewed account policy compliance.  ",
    }, "admin-1", "request-1");
    expect(transaction.user.update).toHaveBeenCalledWith({ where: { id: "customer-1" }, data: { status: nextStatus } });
    expect(transaction.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      action: "USER_STATUS_UPDATED", entityType: "User", entityId: "customer-1",
      reason: "Reviewed account policy compliance.",
    }) }));
  });

  it("rejects blank reasons and unchanged user statuses", async () => {
    const before = { id: "customer-1", role: "CUSTOMER", status: "ACTIVE", deletedAt: null };
    const service = new AdminService({ user: { findFirst: jest.fn().mockResolvedValue(before) }, $transaction: jest.fn() });
    await expect(service.updateUserStatus("customer-1", {
      status: "SUSPENDED", reason: "        ",
    }, "admin-1", "request-1")).rejects.toThrow("at least 8 characters");
    await expect(service.updateUserStatus("customer-1", {
      status: "ACTIVE", reason: "Reviewed current account status.",
    }, "admin-1", "request-2")).rejects.toThrow("already active");
  });

  it("preserves an active primary location", async () => {
    const service = new AdminService({
      businessLocation: { findUnique: jest.fn().mockResolvedValue({ id: "location-1", businessId: "business-1", isPrimary: true, isActive: true }) },
      $transaction: jest.fn(),
    });
    await expect(service.applyOperationalAction("locations", "location-1", {
      action: "DEACTIVATE",
      reason: "Attempted primary deactivation.",
    }, "admin-1", "request-1")).rejects.toThrow("Make another active location primary");
  });
});
