require("reflect-metadata");

const { plainToInstance } = require("class-transformer");
const { validate } = require("class-validator");
const {
  RecordSearchHistoryDto,
} = require("../dist/modules/users/dto/record-search-history.dto.js");
const {
  UsersService,
} = require("../dist/modules/users/users.service.js");

describe("customer search history", () => {
  it("validates and normalizes a completed customer search", async () => {
    const input = plainToInstance(RecordSearchHistoryDto, {
      query: "  laptop   repair  ",
      language: "ml",
      location: { label: "Kochi", latitude: 9.93, longitude: 76.26 },
      filters: { radiusKm: 10, verified: true },
      resultCount: "14",
    });

    await expect(validate(input)).resolves.toHaveLength(0);
    expect(input).toEqual(expect.objectContaining({
      query: "laptop repair",
      language: "ml",
      resultCount: 14,
    }));
  });

  it("creates a history entry for a new explicit search", async () => {
    const searchHistory = {
      findFirst: jest.fn(async () => null),
      create: jest.fn(async ({ data }) => ({ id: "history-1", ...data })),
      update: jest.fn(),
    };
    const service = new UsersService({ searchHistory });

    const result = await service.recordSearchHistory("customer-1", {
      query: "  doctor  ",
      language: "en",
      location: { label: "Kozhikode" },
      filters: { radiusKm: 5 },
      resultCount: 8,
    });

    expect(searchHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "customer-1",
        query: "doctor",
        resultCount: 8,
      }),
    });
    expect(result.data.id).toBe("history-1");
  });

  it("updates a recent matching query instead of filling history with duplicates", async () => {
    const searchHistory = {
      findFirst: jest.fn(async () => ({ id: "history-existing" })),
      create: jest.fn(),
      update: jest.fn(async ({ data }) => ({
        id: "history-existing",
        query: "doctor",
        ...data,
      })),
    };
    const service = new UsersService({ searchHistory });

    await service.recordSearchHistory("customer-1", {
      query: "doctor",
      resultCount: 11,
      filters: { openNow: true },
    });

    expect(searchHistory.create).not.toHaveBeenCalled();
    expect(searchHistory.update).toHaveBeenCalledWith({
      where: { id: "history-existing" },
      data: expect.objectContaining({
        resultCount: 11,
        filters: { openNow: true },
        createdAt: expect.any(Date),
      }),
    });
  });
});
