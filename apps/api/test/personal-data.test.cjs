require("reflect-metadata");

const { ConfigService } = require("@nestjs/config");
const { PersonalDataService } = require("../dist/common/crypto/personal-data.service.js");

describe("PersonalDataService", () => {
  const service = new PersonalDataService(new ConfigService({
    ENQUIRY_DATA_KEY: "unit-test-enquiry-key-with-sufficient-entropy",
    OTP_HASH_SECRET: "unit-test-fingerprint-key",
  }));

  it("round-trips sensitive customer contact data using authenticated encryption", () => {
    const encrypted = service.encrypt("+919876543210");
    expect(encrypted).not.toContain("9876543210");
    expect(service.decrypt(encrypted)).toBe("+919876543210");
  });

  it("uses a random nonce for every encryption", () => {
    expect(service.encrypt("same-value")).not.toBe(service.encrypt("same-value"));
  });

  it("rejects a modified ciphertext", () => {
    const encrypted = service.encrypt("private");
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith("A") ? "B" : "A"}`;
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it("creates stable, non-reversible contact fingerprints", () => {
    const first = service.fingerprint("+919876543210");
    expect(first).toBe(service.fingerprint("+919876543210"));
    expect(first).not.toContain("9876543210");
    expect(first).toHaveLength(64);
  });
});
