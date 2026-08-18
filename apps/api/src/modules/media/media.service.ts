import {
  CopyObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomUUID } from "node:crypto";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import type { UserRole } from "../../generated/prisma/enums";
import type { CompleteMediaUploadDto } from "./dto/complete-media-upload.dto";
import type { CreateMediaDownloadDto } from "./dto/create-media-download.dto";
import type {
  CreateMediaUploadDto,
  MediaUploadPurpose,
} from "./dto/create-media-upload.dto";

export const OBJECT_STORAGE_CLIENT = Symbol("OBJECT_STORAGE_CLIENT");

const administrativeRoles = new Set<UserRole>([
  "SUPER_ADMIN",
  "STATE_ADMIN",
  "DISTRICT_ADMIN",
  "AREA_MANAGER",
  "VERIFICATION",
]);

const imageContentTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const documentContentTypes = new Map([
  ...imageContentTypes,
  ["application/pdf", "pdf"],
]);

const purposePrefix: Record<MediaUploadPurpose, string> = {
  business_image: "quarantine/business",
  product_image: "quarantine/product",
  service_image: "quarantine/service",
  review_image: "quarantine/review",
  verification_document: "private/verification",
  delivery_proof: "private/delivery",
  banner_image: "quarantine/banner",
  advertisement_image: "quarantine/advertisement",
};

const purposeCapability = {
  business_image: "business:profile:manage",
  product_image: "business:catalog:manage",
  service_image: "business:catalog:manage",
  verification_document: "business:profile:manage",
  delivery_proof: "business:catalog:manage",
} as const;

function checksumBase64(sha256: string) {
  return Buffer.from(sha256, "hex").toString("base64");
}

function ownerSegment(userId: string) {
  return createHash("sha256").update(userId).digest("hex").slice(0, 24);
}

function cleanFileName(fileName: string) {
  return fileName.replace(/[\r\n"]/g, "").slice(0, 120) || "download";
}

@Injectable()
export class MediaService {
  private readonly bucket: string;
  private readonly signedUrlTtlSeconds: number;
  private readonly maxImageBytes: number;
  private readonly maxDocumentBytes: number;
  private readonly encryptAtRest: boolean;

  constructor(
    @Inject(OBJECT_STORAGE_CLIENT) private readonly client: S3Client,
    private readonly config: ConfigService,
    private readonly businessAccess: BusinessAccessService,
  ) {
    this.bucket = config.getOrThrow<string>("OBJECT_STORAGE_BUCKET");
    this.signedUrlTtlSeconds = config.get<number>(
      "OBJECT_STORAGE_SIGNED_URL_TTL_SECONDS",
      300,
    );
    this.maxImageBytes = config.get<number>(
      "OBJECT_STORAGE_MAX_IMAGE_BYTES",
      10_000_000,
    );
    this.maxDocumentBytes = config.get<number>(
      "OBJECT_STORAGE_MAX_DOCUMENT_BYTES",
      5_000_000,
    );
    const endpoint = config.get<string>("OBJECT_STORAGE_ENDPOINT");
    this.encryptAtRest = !endpoint || !["127.0.0.1", "localhost"].includes(new URL(endpoint).hostname);
  }

  async createUpload(userId: string, input: CreateMediaUploadDto, role?: UserRole) {
    await this.authorisePurpose(userId, input.purpose, input.businessId, role);
    const extension = this.validateUpload(input);
    const owner = ownerSegment(userId);
    const scope = input.businessId ?? owner;
    const now = new Date();
    const objectKey = [
      purposePrefix[input.purpose],
      scope,
      owner,
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      `${randomUUID()}.${extension}`,
    ].join("/");
    const checksum = checksumBase64(input.sha256);
    const uploadHeaders = {
      "content-type": input.contentType,
      "x-amz-checksum-sha256": checksum,
      ...(this.encryptAtRest ? { "x-amz-server-side-encryption": "AES256" } : {}),
      "x-amz-meta-bnc-owner": owner,
      "x-amz-meta-bnc-purpose": input.purpose,
      ...(input.businessId
        ? { "x-amz-meta-bnc-business": input.businessId }
        : {}),
    };
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: undefined,
      ContentType: input.contentType,
      ContentLength: input.sizeBytes,
      ChecksumSHA256: checksum,
      ...(this.encryptAtRest ? { ServerSideEncryption: "AES256" as const } : {}),
      Metadata: {
        "bnc-owner": owner,
        "bnc-purpose": input.purpose,
        ...(input.businessId ? { "bnc-business": input.businessId } : {}),
      },
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.signedUrlTtlSeconds,
      unhoistableHeaders: new Set(
        Object.keys(uploadHeaders).filter((header) => header.startsWith("x-amz-")),
      ),
    });

    return {
      data: {
        objectKey,
        uploadUrl,
        method: "PUT",
        expiresAt: new Date(
          Date.now() + this.signedUrlTtlSeconds * 1_000,
        ).toISOString(),
        headers: uploadHeaders,
      },
    };
  }

  async completeUpload(userId: string, input: CompleteMediaUploadDto, role?: UserRole) {
    await this.authorisePurpose(userId, input.purpose, input.businessId, role);
    this.assertExpectedPrefix(userId, input.purpose, input.businessId, input.objectKey);
    let object;
    try {
      object = await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: input.objectKey,
        ChecksumMode: "ENABLED",
      }));
    } catch {
      throw new NotFoundException("Uploaded object was not found in private storage.");
    }

    const expectedChecksum = checksumBase64(input.sha256);
    const expectedOwner = ownerSegment(userId);
    if (
      object.ContentLength !== input.sizeBytes ||
      object.ContentType !== input.contentType ||
      object.ChecksumSHA256 !== expectedChecksum ||
      object.Metadata?.["bnc-owner"] !== expectedOwner ||
      object.Metadata?.["bnc-purpose"] !== input.purpose ||
      (input.businessId &&
        object.Metadata?.["bnc-business"] !== input.businessId)
    ) {
      throw new BadRequestException(
        "Uploaded object metadata or checksum does not match the signed request.",
      );
    }

    return {
      data: {
        objectKey: input.objectKey,
        mediaType: input.purpose === "verification_document" ? "document" : "image",
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        sha256: input.sha256,
        storageState: ["verification_document", "delivery_proof"].includes(input.purpose)
          ? "private"
          : "quarantined",
      },
    };
  }

  async createDownload(
    userId: string,
    role: UserRole,
    input: CreateMediaDownloadDto,
  ) {
    if (!administrativeRoles.has(role)) {
      await this.authorisePurpose(userId, input.purpose, input.businessId);
      this.assertExpectedPrefix(
        userId,
        input.purpose,
        input.businessId,
        input.objectKey,
      );
    }
    const fileName = cleanFileName(input.objectKey.split("/").at(-1) ?? "download");
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: input.objectKey,
      ResponseContentDisposition:
        `${input.disposition ?? "inline"}; filename="${fileName}"`,
    });
    try {
      const downloadUrl = await getSignedUrl(this.client, command, {
        expiresIn: this.signedUrlTtlSeconds,
      });
      return {
        data: {
          downloadUrl,
          expiresAt: new Date(
            Date.now() + this.signedUrlTtlSeconds * 1_000,
          ).toISOString(),
        },
      };
    } catch {
      throw new ServiceUnavailableException(
        "Private media access is temporarily unavailable.",
      );
    }
  }

  async requireOwnedObjects(
    userId: string,
    purpose: MediaUploadPurpose,
    businessId: string | undefined,
    objectKeys: string[],
  ) {
    const uniqueKeys = [...new Set(objectKeys)];
    if (uniqueKeys.length > 20) {
      throw new BadRequestException(
        "A maximum of 20 media objects can be attached at once.",
      );
    }
    const owner = ownerSegment(userId);
    await Promise.all(uniqueKeys.map(async (objectKey) => {
      this.assertExpectedPrefix(userId, purpose, businessId, objectKey);
      try {
        const object = await this.client.send(new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }));
        if (
          object.Metadata?.["bnc-owner"] !== owner ||
          object.Metadata?.["bnc-purpose"] !== purpose ||
          (businessId &&
            object.Metadata?.["bnc-business"] !== businessId)
        ) {
          throw new ForbiddenException(
            "The referenced media object does not match this upload scope.",
          );
        }
      } catch (error) {
        if (error instanceof ForbiddenException) throw error;
        throw new BadRequestException(
          "A referenced media object is unavailable in private storage.",
        );
      }
    }));
  }

  async promoteProductObjects(media: Array<{
    id: string;
    objectKey: string;
    publicUrl: string | null;
    scanStatus: string;
  }>) {
    return this.promoteCatalogObjects(media, "product");
  }

  async promoteBusinessObjects(media: Array<{
    id: string;
    objectKey: string;
    publicUrl: string | null;
    scanStatus: string;
  }>) {
    return this.promoteCatalogObjects(media, "business");
  }

  async promoteServiceObjects(media: Array<{
    id: string;
    objectKey: string;
    publicUrl: string | null;
    scanStatus: string;
  }>) {
    return this.promoteCatalogObjects(media, "service");
  }

  async promoteBannerObject(userId: string, objectKey: string) {
    const prefix = "quarantine/banner/";
    if (!objectKey.startsWith(prefix)) throw new BadRequestException("Banner image key is outside the CMS upload scope.");
    this.assertExpectedPrefix(userId, "banner_image", undefined, objectKey);
    const stored = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }));
    if (stored.Metadata?.["bnc-owner"] !== ownerSegment(userId) || stored.Metadata?.["bnc-purpose"] !== "banner_image") throw new ForbiddenException("Banner image does not belong to this administrator upload.");
    const publicBaseUrl = this.config.get<string>("OBJECT_STORAGE_PUBLIC_URL")?.replace(/\/$/, "");
    if (!publicBaseUrl) throw new ServiceUnavailableException("Banner publishing requires OBJECT_STORAGE_PUBLIC_URL.");
    const publicObjectKey = objectKey.replace(prefix, "public/banner/");
    await this.client.send(new CopyObjectCommand({
      Bucket: this.bucket,
      Key: publicObjectKey,
      CopySource: `${this.bucket}/${objectKey.split("/").map(encodeURIComponent).join("/")}`,
      ...(this.encryptAtRest ? { ServerSideEncryption: "AES256" as const } : {}),
      MetadataDirective: "COPY",
    }));
    return { objectKey: publicObjectKey, publicUrl: `${publicBaseUrl}/${publicObjectKey.split("/").map(encodeURIComponent).join("/")}` };
  }

  async promoteAdvertisementObject(userId: string, objectKey: string) {
    const prefix = "quarantine/advertisement/";
    if (!objectKey.startsWith(prefix)) throw new BadRequestException("Advertisement image key is outside the campaign upload scope.");
    this.assertExpectedPrefix(userId, "advertisement_image", undefined, objectKey);
    const stored = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }));
    if (stored.Metadata?.["bnc-owner"] !== ownerSegment(userId) || stored.Metadata?.["bnc-purpose"] !== "advertisement_image") throw new ForbiddenException("Advertisement image does not belong to this administrator upload.");
    const publicBaseUrl = this.config.get<string>("OBJECT_STORAGE_PUBLIC_URL")?.replace(/\/$/, "");
    if (!publicBaseUrl) throw new ServiceUnavailableException("Advertisement publishing requires OBJECT_STORAGE_PUBLIC_URL.");
    const publicObjectKey = objectKey.replace(prefix, "public/advertisement/");
    await this.client.send(new CopyObjectCommand({
      Bucket: this.bucket,
      Key: publicObjectKey,
      CopySource: `${this.bucket}/${objectKey.split("/").map(encodeURIComponent).join("/")}`,
      ...(this.encryptAtRest ? { ServerSideEncryption: "AES256" as const } : {}),
      MetadataDirective: "COPY",
    }));
    return { objectKey: publicObjectKey, publicUrl: `${publicBaseUrl}/${publicObjectKey.split("/").map(encodeURIComponent).join("/")}` };
  }

  private async promoteCatalogObjects(
    media: Array<{
      id: string;
      objectKey: string;
      publicUrl: string | null;
      scanStatus: string;
    }>,
    catalogueType: "business" | "product" | "service",
  ) {
    const quarantinePrefix = `quarantine/${catalogueType}/`;
    const pending = media.filter((item) =>
      item.objectKey.startsWith(quarantinePrefix) &&
      (item.scanStatus !== "approved" || !item.publicUrl),
    );
    if (!pending.length) return [];
    const publicBaseUrl = this.config.get<string>("OBJECT_STORAGE_PUBLIC_URL")?.replace(/\/$/, "");
    if (!publicBaseUrl) {
      throw new ServiceUnavailableException(
        "Catalogue photos cannot be published until OBJECT_STORAGE_PUBLIC_URL is configured.",
      );
    }
    return Promise.all(pending.map(async (item) => {
      const publicObjectKey = item.objectKey.replace(
        quarantinePrefix,
        `public/${catalogueType}/`,
      );
      const copySource = `${this.bucket}/${item.objectKey.split("/").map(encodeURIComponent).join("/")}`;
      await this.client.send(new CopyObjectCommand({
        Bucket: this.bucket,
        Key: publicObjectKey,
        CopySource: copySource,
        ...(this.encryptAtRest ? { ServerSideEncryption: "AES256" as const } : {}),
        MetadataDirective: "COPY",
      }));
      const publicPath = publicObjectKey.split("/").map(encodeURIComponent).join("/");
      return {
        id: item.id,
        objectKey: publicObjectKey,
        publicUrl: `${publicBaseUrl}/${publicPath}`,
        scanStatus: "approved",
      };
    }));
  }

  private async authorisePurpose(
    userId: string,
    purpose: MediaUploadPurpose,
    businessId?: string,
    role?: UserRole,
  ) {
    if (purpose === "review_image") return;
    if (purpose === "banner_image" || purpose === "advertisement_image") {
      const allowed = purpose === "advertisement_image"
        ? role === "SUPER_ADMIN" || role === "SALES"
        : Boolean(role && administrativeRoles.has(role));
      if (!allowed) throw new ForbiddenException(`${purpose === "banner_image" ? "Banner" : "Advertisement"} uploads require an authorised administrator role.`);
      return;
    }
    if (!businessId) {
      throw new BadRequestException(
        "businessId is required for business-managed media.",
      );
    }
    await this.businessAccess.require(
      userId,
      businessId,
      purposeCapability[purpose],
    );
  }

  private validateUpload(input: CreateMediaUploadDto) {
    const allowed = input.purpose === "verification_document"
      ? documentContentTypes
      : imageContentTypes;
    const extension = allowed.get(input.contentType);
    if (!extension) {
      throw new BadRequestException(
        input.purpose === "verification_document"
          ? "Verification proof must be PDF, JPEG, PNG or WebP."
          : "Media must be JPEG, PNG or WebP.",
      );
    }
    const maximum = input.purpose === "verification_document"
      ? this.maxDocumentBytes
      : this.maxImageBytes;
    if (input.sizeBytes > maximum) {
      throw new BadRequestException(
        `File exceeds the ${Math.floor(maximum / 1_000_000)} MB upload limit.`,
      );
    }
    return extension;
  }

  private assertExpectedPrefix(
    userId: string,
    purpose: MediaUploadPurpose,
    businessId: string | undefined,
    objectKey: string,
  ) {
    const owner = ownerSegment(userId);
    const scope = businessId ?? owner;
    const expected = `${purposePrefix[purpose]}/${scope}/${owner}/`;
    if (!objectKey.startsWith(expected)) {
      throw new ForbiddenException(
        "This object does not belong to the authenticated upload scope.",
      );
    }
  }
}
