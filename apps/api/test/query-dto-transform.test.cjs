require("reflect-metadata");

const { plainToInstance } = require("class-transformer");
const { validate } = require("class-validator");
const {
  SearchBusinessesDto,
} = require("../dist/modules/search/dto/search-businesses.dto.js");
const {
  ListBusinessesDto,
} = require("../dist/modules/businesses/dto/list-businesses.dto.js");
const {
  ListProductsDto,
} = require("../dist/modules/products/dto/list-products.dto.js");
const {
  ListServicesDto,
} = require("../dist/modules/services/dto/list-services.dto.js");
const {
  BusinessAnalyticsQueryDto,
} = require("../dist/modules/analytics/dto/analytics-range.dto.js");

describe("query DTO transformations", () => {
  it("accepts the numeric and boolean query strings sent by web and Flutter", async () => {
    const query = plainToInstance(SearchBusinessesDto, {
      latitude: "9.9681",
      longitude: "76.2999",
      radiusKm: "10",
      rating: "4",
      verified: "true",
      premium: "false",
      offers: "true",
      homeService: "true",
      delivery: "true",
      fastResponse: "true",
      priceRange: "2",
      payment: "UPI",
      language: "Malayalam",
      minYears: "5",
      sort: "price-low",
      page: "2",
      pageSize: "20",
    });

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query).toEqual(
      expect.objectContaining({
        latitude: 9.9681,
        longitude: 76.2999,
        radiusKm: 10,
        rating: 4,
        verified: true,
        premium: false,
        offers: true,
        homeService: true,
        delivery: true,
        fastResponse: true,
        priceRange: 2,
        payment: "UPI",
        language: "Malayalam",
        minYears: 5,
        sort: "price-low",
        page: 2,
        pageSize: 20,
      }),
    );
  });

  it("accepts pagination and verified filters on the public business list", async () => {
    const query = plainToInstance(ListBusinessesDto, {
      page: "1",
      pageSize: "50",
      verified: "true",
    });

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query).toEqual(
      expect.objectContaining({ page: 1, pageSize: 50, verified: true }),
    );
  });

  it.each([ListProductsDto, ListServicesDto])(
    "accepts GPS radius filters for separated product and service discovery",
    async (Dto) => {
      const query = plainToInstance(Dto, {
        latitude: "9.9681",
        longitude: "76.2999",
        radiusKm: "5",
        page: "1",
        pageSize: "20",
      });
      await expect(validate(query)).resolves.toHaveLength(0);
      expect(query).toEqual(expect.objectContaining({
        latitude: 9.9681,
        longitude: 76.2999,
        radiusKm: 5,
      }));
    },
  );

  it("accepts the website product category, location, status, and sort filters", async () => {
    const query = plainToInstance(ListProductsDto, {
      q: "chair",
      category: "furniture",
      city: "Kochi",
      stock: "MADE_TO_ORDER",
      sort: "price-low",
      page: "1",
      pageSize: "20",
    });

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query).toEqual(expect.objectContaining({
      q: "chair",
      category: "furniture",
      city: "Kochi",
      stock: "MADE_TO_ORDER",
      sort: "price-low",
    }));
  });

  it("accepts courier best-seller and top-rated service discovery filters", async () => {
    const products = plainToInstance(ListProductsDto, {
      courier: "true",
      sort: "best-selling",
    });
    const services = plainToInstance(ListServicesDto, {
      sort: "top-rated",
    });

    await expect(validate(products)).resolves.toHaveLength(0);
    await expect(validate(services)).resolves.toHaveLength(0);
    expect(products).toEqual(expect.objectContaining({
      courier: true,
      sort: "best-selling",
    }));
    expect(services).toEqual(expect.objectContaining({ sort: "top-rated" }));
  });

  it("accepts a business identifier together with the analytics date range", async () => {
    const query = plainToInstance(BusinessAnalyticsQueryDto, {
      businessId: "business-1",
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-08T23:59:59.000Z",
    });

    await expect(validate(query, { whitelist: true, forbidNonWhitelisted: true })).resolves.toHaveLength(0);
    expect(query).toEqual(expect.objectContaining({
      businessId: "business-1",
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-08T23:59:59.000Z",
    }));
  });
});
