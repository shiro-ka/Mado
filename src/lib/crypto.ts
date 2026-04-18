import { PrivateKey, PublicKey, encrypt as eciesEncrypt, decrypt as eciesDecrypt } from "eciesjs";

/**
 * Generate a new ECIES key pair for a question box.
 * Returns hex-encoded public and private keys.
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const privateKey = new PrivateKey();
  const publicKey = privateKey.publicKey;

  return {
    privateKey: Buffer.from(privateKey.secret).toString("hex"),
    publicKey: publicKey.toHex(),
  };
}

/**
 * Encrypt a sender DID using the box owner's public key.
 * ECIES generates a random ephemeral key each time, so the same DID
 * produces a different ciphertext on every call — sender tracking is impossible.
 * Returns base64-encoded ciphertext.
 */
export function encryptDid(publicKeyHex: string, senderDid: string): string {
  const publicKey = PublicKey.fromHex(publicKeyHex);
  const plaintext = Buffer.from(senderDid, "utf-8");
  const encrypted = eciesEncrypt(publicKey.toBytes(), plaintext);
  return Buffer.from(encrypted).toString("base64");
}

/**
 * Decrypt an encrypted sender DID using the box owner's private key.
 * Returns the sender's DID string.
 */
export function decryptDid(privateKeyHex: string, encryptedFrom: string): string {
  const privateKey = PrivateKey.fromHex(privateKeyHex);
  const ciphertext = Buffer.from(encryptedFrom, "base64");
  const decrypted = eciesDecrypt(privateKey.secret, ciphertext);
  return Buffer.from(decrypted).toString("utf-8");
}
