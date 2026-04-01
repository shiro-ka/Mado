import { PrivateKey, PublicKey, encrypt as eciesEncrypt, decrypt as eciesDecrypt } from "eciesjs";
import type { QuestionPayload } from "@/types";

/**
 * Generate a new ECIES key pair for a question box.
 * Returns hex-encoded public and private keys.
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const privateKey = new PrivateKey();
  const publicKey = privateKey.publicKey;

  return {
    privateKey: privateKey.secret.toString("hex"),
    publicKey: publicKey.toHex(),
  };
}

/**
 * Encrypt a question payload using the box owner's public key.
 * Returns a Buffer containing the encrypted bytes.
 */
export function encrypt(
  publicKeyHex: string,
  data: QuestionPayload
): Buffer {
  const publicKey = PublicKey.fromHex(publicKeyHex);
  const plaintext = Buffer.from(JSON.stringify(data), "utf-8");
  const encrypted = eciesEncrypt(publicKey.toBytes(), plaintext);
  return Buffer.from(encrypted);
}

/**
 * Decrypt a question payload using the box owner's private key.
 * Returns the decrypted QuestionPayload.
 */
export function decrypt(
  privateKeyHex: string,
  payload: Buffer
): QuestionPayload {
  const privateKey = PrivateKey.fromHex(privateKeyHex);
  const decrypted = eciesDecrypt(privateKey.secret, payload);
  const parsed = JSON.parse(decrypted.toString("utf-8")) as QuestionPayload;
  return parsed;
}

/**
 * Encrypt and encode to base64 for storage.
 */
export function encryptToBase64(
  publicKeyHex: string,
  data: QuestionPayload
): string {
  const encrypted = encrypt(publicKeyHex, data);
  return encrypted.toString("base64");
}

/**
 * Decode from base64 and decrypt.
 */
export function decryptFromBase64(
  privateKeyHex: string,
  base64Payload: string
): QuestionPayload {
  const buffer = Buffer.from(base64Payload, "base64");
  return decrypt(privateKeyHex, buffer);
}
