import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  redis: {
    exists: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock("@/lib/redis", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/redis")>();
  return { ...actual, getRedis: () => mocks.redis };
});

// Prevent the OAuth client singleton from trying to initialise during import
vi.mock("@atproto/oauth-client-node", () => ({
  NodeOAuthClient: vi.fn(),
  WebcryptoKey: { generate: vi.fn() },
}));

const { hasOAuthSession, clearOAuthSession } = await import("@/lib/oauth");

const SESSION_KEY = (did: string) => `oauth:session:${did}`;

describe("hasOAuthSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when the session key exists in Redis", async () => {
    mocks.redis.exists.mockResolvedValue(1);
    expect(await hasOAuthSession("did:plc:abc")).toBe(true);
    expect(mocks.redis.exists).toHaveBeenCalledWith(SESSION_KEY("did:plc:abc"));
  });

  it("returns false when the session key does not exist", async () => {
    mocks.redis.exists.mockResolvedValue(0);
    expect(await hasOAuthSession("did:plc:abc")).toBe(false);
  });
});

describe("clearOAuthSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the session key from Redis", async () => {
    mocks.redis.del.mockResolvedValue(1);
    await clearOAuthSession("did:plc:abc");
    expect(mocks.redis.del).toHaveBeenCalledWith(SESSION_KEY("did:plc:abc"));
  });

  it("is idempotent — does not throw when key does not exist", async () => {
    mocks.redis.del.mockResolvedValue(0); // 0 = key was not present
    await expect(clearOAuthSession("did:plc:abc")).resolves.toBeUndefined();
  });
});
