import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  restoreOAuthSession: vi.fn(),
  deleteRecord: vi.fn(),
  redis: {
    srem: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  requireSession: mocks.requireSession,
}));

vi.mock("@/lib/oauth", () => ({
  restoreOAuthSession: mocks.restoreOAuthSession,
}));

vi.mock("@/lib/atproto", () => ({
  deleteRecord: mocks.deleteRecord,
}));

vi.mock("@/lib/redis", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/redis")>();
  return { ...actual, getRedis: () => mocks.redis };
});

const { DELETE } = await import("@/app/api/questions/[rkey]/route");

const SESSION = { did: "did:plc:owner111", handle: "owner.bsky.social" };
const RKEY = "testrkey123";

function makeRequest(rkey: string) {
  return new Request(`http://localhost/api/questions/${rkey}`, {
    method: "DELETE",
  }) as never;
}

const params = Promise.resolve({ rkey: RKEY });

describe("DELETE /api/questions/[rkey]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireSession.mockResolvedValue(SESSION);
    mocks.restoreOAuthSession.mockResolvedValue(() => {});
    mocks.deleteRecord.mockResolvedValue(true);
    mocks.redis.srem.mockResolvedValue(1);
  });

  it("401 — OAuth session missing or expired", async () => {
    mocks.restoreOAuthSession.mockResolvedValue(null);
    const res = await DELETE(makeRequest(RKEY), { params });
    expect(res.status).toBe(401);
    expect(mocks.deleteRecord).not.toHaveBeenCalled();
  });

  it("500 — deleteRecord returns false", async () => {
    mocks.deleteRecord.mockResolvedValue(false);
    const res = await DELETE(makeRequest(RKEY), { params });
    expect(res.status).toBe(500);
    expect(mocks.redis.srem).not.toHaveBeenCalled(); // read set not modified on failure
  });

  it("200 — deletes PDS record and removes rkey from read set", async () => {
    const res = await DELETE(makeRequest(RKEY), { params });
    expect(res.status).toBe(200);
    expect(mocks.deleteRecord).toHaveBeenCalledWith({
      sessionFetch: expect.any(Function),
      did: SESSION.did,
      collection: "blue.mado.koe",
      rkey: RKEY,
    });
    expect(mocks.redis.srem).toHaveBeenCalledWith(`read:${SESSION.did}`, RKEY);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
