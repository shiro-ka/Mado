import { describe, it, expect } from "vitest";
import { generateKeyPair, encryptDid, decryptDid } from "@/lib/crypto";

describe("generateKeyPair", () => {
  it("returns non-empty hex strings", () => {
    const { publicKey, privateKey } = generateKeyPair();
    expect(publicKey).toMatch(/^[0-9a-f]+$/i);
    expect(privateKey).toMatch(/^[0-9a-f]+$/i);
  });

  it("each call produces a different key pair", () => {
    const kp1 = generateKeyPair();
    const kp2 = generateKeyPair();
    expect(kp1.privateKey).not.toBe(kp2.privateKey);
    expect(kp1.publicKey).not.toBe(kp2.publicKey);
  });
});

describe("encryptDid / decryptDid", () => {
  it("roundtrip: encrypted DID can be decrypted back", () => {
    const { publicKey, privateKey } = generateKeyPair();
    const did = "did:plc:abc123exampletest";
    const encrypted = encryptDid(publicKey, did);
    const decrypted = decryptDid(privateKey, encrypted);
    expect(decrypted).toBe(did);
  });

  it("roundtrip works for long DID strings", () => {
    const { publicKey, privateKey } = generateKeyPair();
    const did = "did:plc:" + "a".repeat(32);
    expect(decryptDid(privateKey, encryptDid(publicKey, did))).toBe(did);
  });

  it("same DID produces different ciphertexts (IND-CPA / ephemeral key)", () => {
    const { publicKey } = generateKeyPair();
    const did = "did:plc:samevalue";
    const enc1 = encryptDid(publicKey, did);
    const enc2 = encryptDid(publicKey, did);
    // ECIES uses a random ephemeral key each time — outputs must differ
    expect(enc1).not.toBe(enc2);
  });

  it("encrypted value is valid base64", () => {
    const { publicKey } = generateKeyPair();
    const encrypted = encryptDid(publicKey, "did:plc:test");
    expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
    // Re-encoding should be idempotent
    expect(Buffer.from(encrypted, "base64").toString("base64")).toBe(encrypted);
  });

  it("decrypting with the wrong private key throws", () => {
    const { publicKey } = generateKeyPair();
    const { privateKey: wrongKey } = generateKeyPair();
    const encrypted = encryptDid(publicKey, "did:plc:test");
    expect(() => decryptDid(wrongKey, encrypted)).toThrow();
  });

  it("decrypting corrupted ciphertext throws", () => {
    const { privateKey } = generateKeyPair();
    expect(() => decryptDid(privateKey, "notvalidbase64!!!")).toThrow();
  });
});
