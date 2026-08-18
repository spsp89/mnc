require("reflect-metadata");

const { JobsService } = require("../dist/modules/jobs/jobs.service.js");

describe("JobsService workflow", () => {
  it("creates a private draft for an authorised business", async () => {
    const create = jest.fn().mockResolvedValue({ id: "job-1", status: "DRAFT" });
    const access = { require: jest.fn().mockResolvedValue({}) };
    const service = new JobsService({ job: { create } }, access);
    const input = {
      businessId: "business-1",
      title: "Store manager",
      slug: "store-manager",
      description: "Manage the daily shop floor and customer service operations.",
      employmentType: "FULL_TIME",
      skills: ["Customer service"],
      salaryMin: 20000,
      salaryMax: 30000,
      city: "Kochi",
      district: "Ernakulam",
      state: "Kerala",
    };

    await expect(service.create("owner-1", input)).resolves.toEqual({
      data: { id: "job-1", status: "DRAFT" },
    });
    expect(access.require).toHaveBeenCalledWith("owner-1", "business-1", "business:catalog:manage");
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        businessId: "business-1",
        workplaceType: "ON_SITE",
      }),
    });
  });

  it("rejects an application after a vacancy closes", async () => {
    const service = new JobsService({
      job: { findFirst: jest.fn().mockResolvedValue(null) },
    }, {});
    await expect(service.apply("job-closed", {
      name: "Applicant",
      email: "applicant@example.com",
    })).rejects.toThrow("no longer accepting applications");
  });

  it("blocks vacancy publication for a pending merchant", async () => {
    const update = jest.fn();
    const access = {
      require: jest.fn().mockResolvedValue({}),
      requireApprovedForPublication: jest.fn().mockRejectedValue(new Error("merchant must be approved")),
    };
    const service = new JobsService({
      job: { findUnique: jest.fn().mockResolvedValue({ id: "job-1", businessId: "business-1", closesAt: null }), update },
    }, access);
    await expect(service.publish("owner-1", "job-1")).rejects.toThrow("must be approved");
    expect(update).not.toHaveBeenCalled();
  });
});
