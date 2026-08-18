require("reflect-metadata");

const {
  AdminService,
} = require("../dist/modules/admin/admin.service.js");

describe("AdminService inventory", () => {
  it("returns a safe flattened lead inventory", async () => {
    const findMany = jest.fn().mockResolvedValue([{
      id: "lead-1",
      requirement: "Demo catering requirement",
      productQuery: "Lunch for 20",
      source: "WEB",
      urgency: "THIS_WEEK",
      status: "DELIVERED",
      expiresAt: new Date("2026-08-10T00:00:00.000Z"),
      createdAt: new Date("2026-08-07T00:00:00.000Z"),
      category: { name: "Restaurants" },
      assignments: [{ business: { name: "Demo Kitchen" } }],
    }]);
    const service = new AdminService({ lead: { findMany } });

    await expect(service.inventory("leads")).resolves.toEqual({
      data: [expect.objectContaining({
        id: "lead-1",
        category: "Restaurants",
        business: { name: "Demo Kitchen" },
        description: "Lunch for 20",
      })],
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });

  it("rejects non-allowlisted inventory names", async () => {
    const service = new AdminService({});
    await expect(service.inventory("password-hashes")).rejects.toThrow(
      "Unsupported admin inventory section",
    );
  });
});
