import { describe, it, expect } from "vitest";
import { Keys, TTL } from "@/lib/redis";

describe("Redis key schema", () => {
  describe("Keys", () => {
    it("keyPair", () => {
      expect(Keys.keyPair("did:plc:abc", "rkey123")).toBe("keypair:did:plc:abc:rkey123");
    });

    it("blocklist", () => {
      expect(Keys.blocklist("did:plc:abc")).toBe("blocklist:did:plc:abc");
    });

    it("read", () => {
      expect(Keys.read("did:plc:abc")).toBe("read:did:plc:abc");
    });

    it("rateBox", () => {
      expect(Keys.rateBox("did:plc:sender", "boxRkey")).toBe(
        "rate:box:did:plc:sender:boxRkey"
      );
    });

    it("rateGlobal", () => {
      expect(Keys.rateGlobal("did:plc:sender")).toBe("rate:global:did:plc:sender");
    });

    it("session", () => {
      expect(Keys.session("sessionId123")).toBe("session:sessionId123");
    });

    it("oauthState", () => {
      expect(Keys.oauthState("state456")).toBe("oauth_state:state456");
    });

    it("users is a fixed string", () => {
      expect(typeof Keys.users).toBe("string");
      expect(Keys.users.length).toBeGreaterThan(0);
    });

    it("keys with different DIDs produce different values", () => {
      expect(Keys.blocklist("did:plc:aaa")).not.toBe(Keys.blocklist("did:plc:bbb"));
    });

    it("keyPair keys with same DID but different rkey differ", () => {
      expect(Keys.keyPair("did:plc:abc", "rkey1")).not.toBe(
        Keys.keyPair("did:plc:abc", "rkey2")
      );
    });
  });

  describe("TTL", () => {
    it("all TTL values are positive integers", () => {
      for (const [name, val] of Object.entries(TTL)) {
        expect(val, `TTL.${name}`).toBeGreaterThan(0);
        expect(Number.isInteger(val), `TTL.${name} is integer`).toBe(true);
      }
    });

    it("SESSION is the longest TTL", () => {
      expect(TTL.SESSION).toBeGreaterThan(TTL.OAUTH_STATE);
      expect(TTL.SESSION).toBeGreaterThan(TTL.RATE_BOX);
      expect(TTL.SESSION).toBeGreaterThan(TTL.RATE_GLOBAL);
    });

    it("RATE_GLOBAL > RATE_BOX (global window is wider than per-box)", () => {
      expect(TTL.RATE_GLOBAL).toBeGreaterThan(TTL.RATE_BOX);
    });

    it("SESSION is at least 7 days", () => {
      expect(TTL.SESSION).toBeGreaterThanOrEqual(7 * 24 * 60 * 60);
    });
  });
});
