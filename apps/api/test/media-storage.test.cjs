require("reflect-metadata");

const { createHash } = require("node:crypto");
const { S3Client } = require("@aws-sdk/client-s3");
const {
  MediaService,
} = require("../dist/modules/media/media.service.js");
const { CompleteMediaUploadDto } = require("../dist/modules/media/dto/complete-media-upload.dto.js");
const { validate } = require("class-validator");
const { plainToInstance } = require("class-transformer");

describe("MediaService private S3 flow", () => {
  const userId = "user-101";
  const businessId = "business-101";
  const sha256 = "a".repeat(64);
  const checksum = Buffer.from(sha256, "hex").toString("base64");
  const owner = createHash("sha256").update(userId).digest("hex").slice(0, 24);
  const config = {
    getOrThrow: jest.fn((name) => {
      if (name === "OBJECT_STORAGE_BUCKET") {
        return "bnc-media-015872246618-ap-south-1";
      }
      throw new Error(`Missing ${name}`);
    }),
    get: jest.fn((name, fallback) => fallback),
  };
  const businessAccess = {
    require: jest.fn().mockResolvedValue({
      businessId,
      role: "OWNER",
      capabilities: ["business:catalog:manage"],
    }),
  };

  it("creates a checksum-bound direct upload without accepting file bytes", async () => {
    const client = new S3Client({
      region: "ap-south-1",
      credentials: {
        accessKeyId: "AKIATESTONLY",
        secretAccessKey: "test-secret-not-used",
      },
    });
    const service = new MediaService(client, config, businessAccess);
    const result = await service.createUpload(userId, {
      purpose: "product_image",
      businessId,
      fileName: "chair.png",
      contentType: "image/png",
      sizeBytes: 1024,
      sha256,
    });

    expect(result.data.objectKey).toMatch(
      new RegExp(`^quarantine/product/${businessId}/${owner}/`),
    );
    expect(result.data.uploadUrl).toContain(
      "bnc-media-015872246618-ap-south-1.s3.ap-south-1.amazonaws.com",
    );
    expect(result.data.headers["x-amz-checksum-sha256"]).toBe(checksum);
    const signedHeaders = new URL(result.data.uploadUrl)
      .searchParams.get("X-Amz-SignedHeaders");
    expect(signedHeaders).toContain("x-amz-checksum-sha256");
    expect(signedHeaders).toContain("x-amz-meta-bnc-owner");
    expect(result.data.headers["x-amz-server-side-encryption"]).toBe("AES256");
    await client.destroy();
  });

  it("verifies S3 checksum, ownership metadata, type and size", async () => {
    const objectKey =
      `quarantine/product/${businessId}/${owner}/2026/08/test-object.png`;
    const client = {
      send: jest.fn().mockResolvedValue({
        ContentLength: 2048,
        ContentType: "image/png",
        ChecksumSHA256: checksum,
        Metadata: {
          "bnc-owner": owner,
          "bnc-purpose": "product_image",
          "bnc-business": businessId,
        },
      }),
    };
    const service = new MediaService(client, config, businessAccess);
    await expect(service.completeUpload(userId, {
      purpose: "product_image",
      businessId,
      objectKey,
      contentType: "image/png",
      sizeBytes: 2048,
      sha256,
    })).resolves.toEqual({
      data: expect.objectContaining({
        objectKey,
        storageState: "quarantined",
      }),
    });
  });

  it("rejects an object key outside the authenticated owner scope", async () => {
    const service = new MediaService(
      { send: jest.fn() },
      config,
      businessAccess,
    );
    await expect(service.completeUpload(userId, {
      purpose: "product_image",
      businessId,
      objectKey:
        `quarantine/product/${businessId}/someone-else/2026/08/file.png`,
      contentType: "image/png",
      sizeBytes: 2048,
      sha256,
    })).rejects.toThrow("does not belong");
  });

  it.each(["banner", "advertisement"])(
    "accepts a quarantined %s image key during upload completion validation",
    async (scope) => {
      const dto = plainToInstance(CompleteMediaUploadDto, {
        purpose: `${scope}_image`,
        objectKey: `quarantine/${scope}/${owner}/${owner}/2026/08/file.png`,
        contentType: "image/png",
        sizeBytes: 2048,
        sha256,
      });
      await expect(validate(dto)).resolves.toEqual([]);
    },
  );
});
