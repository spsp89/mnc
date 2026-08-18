require("reflect-metadata");

const {
  BusinessAccessService,
} = require("../dist/common/auth/business-access.service.js");

describe("BusinessAccessService", () => {
  function serviceFor(record) {
    return new BusinessAccessService({
      business: { findFirst: jest.fn().mockResolvedValue(record) },
    });
  }

  it("gives the owner every workspace capability", async () => {
    const service = serviceFor({
      id: "business-1",
      owner: { userId: "owner-1" },
      members: [],
    });
    await expect(
      service.require("owner-1", "business-1", "business:billing:manage"),
    ).resolves.toEqual(
      expect.objectContaining({ role: "OWNER" }),
    );
  });

  it("keeps catalogue editors out of billing controls", async () => {
    const service = serviceFor({
      id: "business-1",
      owner: { userId: "owner-1" },
      members: [{
        role: "CATALOG_EDITOR",
        permissions: [],
      }],
    });
    await expect(
      service.require("editor-1", "business-1", "business:billing:manage"),
    ).rejects.toThrow("workspace role");
  });

  it("honours a validated explicit capability override", async () => {
    const service = serviceFor({
      id: "business-1",
      owner: { userId: "owner-1" },
      members: [{
        role: "VIEWER",
        permissions: ["business:catalog:manage", "not:a:real:capability"],
      }],
    });
    await expect(
      service.require("viewer-1", "business-1", "business:catalog:manage"),
    ).resolves.toEqual(
      expect.objectContaining({
        role: "VIEWER",
        capabilities: expect.arrayContaining(["business:catalog:manage"]),
      }),
    );
  });

  it("allows publication only for active verified merchants", async () => {
    const approved = serviceFor({ status: "ACTIVE", verified: true });
    await expect(approved.requireApprovedForPublication("business-1")).resolves.toEqual({ status: "ACTIVE", verified: true });

    const pending = serviceFor({ status: "PENDING_VERIFICATION", verified: false });
    await expect(pending.requireApprovedForPublication("business-1")).rejects.toThrow("must be approved");

    const suspended = serviceFor({ status: "SUSPENDED", verified: true });
    await expect(suspended.requireApprovedForPublication("business-1")).rejects.toThrow("must be approved");
  });
});
