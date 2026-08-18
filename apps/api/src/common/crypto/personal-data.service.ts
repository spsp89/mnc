import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

@Injectable()
export class PersonalDataService {
  private readonly encryptionKey: Buffer;
  private readonly fingerprintKey: string;

  constructor(config: ConfigService) {
    const secret = config.getOrThrow<string>("ENQUIRY_DATA_KEY");
    this.encryptionKey = createHash("sha256").update(secret).digest();
    this.fingerprintKey = config.getOrThrow<string>("OTP_HASH_SECRET");
  }

  encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("base64url");
  }

  decrypt(payload: string) {
    const value = Buffer.from(payload, "base64url");
    if (!/^[A-Za-z0-9_-]+$/.test(payload) || value.length < 29 || value.toString("base64url") !== payload) {
      throw new Error("Encrypted personal data is malformed.");
    }
    const iv = value.subarray(0, 12);
    const tag = value.subarray(12, 28);
    const encrypted = value.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }

  fingerprint(value: string) {
    return createHmac("sha256", this.fingerprintKey).update(value).digest("hex");
  }
}
