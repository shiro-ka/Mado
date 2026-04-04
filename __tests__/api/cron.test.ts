import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  restoreOAuthSession: vi.fn(),
  clearOAuthSession: vi.fn(),
  redis: {
    smembers: vi.fn(),
  },
}));

vi.mock("@/lib/oauth", () => ({
  restoreOAuthSession: mocks.restoreOAuthSession,
  clearOAuthSession: mocks.clearOAuthSession,
}));

vi.mock("@/lib/redis", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/redis")>();
  return {
    ...actual,
    getRedis: () => mocks.redis,
  };
});

const { GET } = await import("@/app/api/cron/check-sessions/route");

const ORIGINAL_ENV = { ...process.env };

function makeRequest(headers?: Record<string, string>) {
  return new Request("http://localhost/api/cron/check-sessions", {
    headers: headers ?? {},
  }) as never;
}

describe("GET /api/cron/check-sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.CRON_SECRET;
    mocks.redis.smembers.mockResolvedValue([]);
  });

  describe("auth guard", () => {
    it("proceeds without auth when CRON_SECRET is not set", async () => {
      const res = await GET(makeRequest());
      expect(res.status).toBe(200);
    });

    it("401 — request without token when CRON_SECRET is set", async () => {
      process.env.CRON_SECRET = "secret123";
      const res = await GET(makeRequest());
      expect(res.status).toBe(401);
    });

    it("401 — wrong token", async () => {
      process.env.CRON_SECRET = "secret123";
      const res = await GET(makeRequest({ Authorization: "Bearer wrongtoken" }));
      expect(res.status).toBe(401);
    });

    it("200 — correct Bearer token", async () => {
      process.env.CRON_SECRET = "secret123";
      const res = await GET(makeRequest({ Authorization: "Bearer secret123" }));
      expect(res.status).toBe(200);
    });
  });

  describe("session checking", () => {
    it("returns zero counts when no users are registered", async () => {
      mocks.redis.smembers.mockResolvedValue([]);
      const res = await GET(makeRequest());
      const body = await res.json();
      expect(body).toEqual({ checked: 0, valid: 0, revoked: 0 });
    });

    it("counts valid sessions correctly", async () => {
      mocks.redis.smembers.mockResolvedValue(["did:plc:a", "did:plc:b"]);
      mocks.restoreOAuthSession.mockResolvedValue(() => {}); // non-null = valid
      const res = await GET(makeRequest());
      const body = await res.json();
      expect(body.checked).toBe(2);
      expect(body.valid).toBe(2);
      expect(body.revoked).toBe(0);
      expect(mocks.clearOAuthSession).not.toHaveBeenCalled();
    });

    it("clears and counts revoked sessions", async () => {
      mocks.redis.smembers.mockResolvedValue(["did:plc:good", "did:plc:bad"]);
      mocks.restoreOAuthSession
        .mockResolvedValueOnce(() => {}) // did:plc:good → valid
        .mockResolvedValueOnce(null);    // did:plc:bad → revoked
      mocks.clearOAuthSession.mockResolvedValue(undefined);

      const res = await GET(makeRequest());
      const body = await res.json();

      expect(body).toEqual({ checked: 2, valid: 1, revoked: 1 });
      expect(mocks.clearOAuthSession).toHaveBeenCalledTimes(1);
      expect(mocks.clearOAuthSession).toHaveBeenCalledWith("did:plc:bad");
      expect(mocks.clearOAuthSession).not.toHaveBeenCalledWith("did:plc:good");
    });

    it("processes users in parallel (allSettled)", async () => {
      // Verify that all sessions are checked even if one throws
      mocks.redis.smembers.mockResolvedValue(["did:plc:a", "did:plc:b", "did:plc:c"]);
      mocks.restoreOAuthSession
        .mockRejectedValueOnce(new Error("network error")) // throws
        .mockResolvedValueOnce(() => {})                   // valid
        .mockResolvedValueOnce(null);                      // revoked
      mocks.clearOAuthSession.mockResolvedValue(undefined);

      const res = await GET(makeRequest());
      const body = await res.json();

      // The thrown error is swallowed by allSettled; only fulfilled results count
      expect(body.checked).toBe(3);
      expect(body.valid).toBe(1);
      expect(body.revoked).toBe(1);
    });

    it("does not clear session for valid users", async () => {
      mocks.redis.smembers.mockResolvedValue(["did:plc:alive"]);
      mocks.restoreOAuthSession.mockResolvedValue(() => {}); // valid
      await GET(makeRequest());
      expect(mocks.clearOAuthSession).not.toHaveBeenCalled();
    });
  });
});
