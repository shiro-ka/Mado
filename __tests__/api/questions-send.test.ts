import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  encryptDid: vi.fn(),
  writeQuestion: vi.fn(),
  getBoxRecord: vi.fn(),
  getProfile: vi.fn(),
  restoreOAuthSession: vi.fn(),
  redis: {
    sismember: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/crypto", () => ({ encryptDid: mocks.encryptDid }));
vi.mock("@/lib/atproto", () => ({
  writeQuestion: mocks.writeQuestion,
  getBoxRecord: mocks.getBoxRecord,
  getProfile: mocks.getProfile,
}));
vi.mock("@/lib/oauth", () => ({ restoreOAuthSession: mocks.restoreOAuthSession }));
vi.mock("@/lib/redis", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/redis")>();
  return { ...actual, getRedis: () => mocks.redis };
});

const { POST } = await import("@/app/api/questions/send/route");

const SENDER = { did: "did:plc:sender222", handle: "sender.bsky.social" };
const BOX = {
  publicKeyHex: "aabbccddeeff",
  isOpen: true,
  uri: "at://did:plc:owner/blue.mado.box/rkey123",
};
/** Established account — should never be flagged as spam */
const PROFILE_OK = { followersCount: 100, postsCount: 50, createdAt: "2020-01-01T00:00:00Z" };

const VALID_BODY = {
  body: "質問です",
  boxOwnerDid: "did:plc:owner",
  boxRkey: "rkey123",
};

function makeRequest(body?: unknown) {
  return new Request("http://localhost/api/questions/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }) as never;
}

describe("POST /api/questions/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(SENDER);
    mocks.getBoxRecord.mockResolvedValue(BOX);
    mocks.redis.sismember.mockResolvedValue(0);   // not blocked
    mocks.redis.incr.mockResolvedValue(1);         // first request — within limits
    mocks.redis.expire.mockResolvedValue(1);
    mocks.getProfile.mockResolvedValue(PROFILE_OK);
    mocks.encryptDid.mockReturnValue("encrypted-sender-did");
    mocks.restoreOAuthSession.mockResolvedValue(() => {});
    mocks.writeQuestion.mockResolvedValue({ uri: "at://result/..." });
  });

  it("401 — not authenticated", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
    expect(mocks.getBoxRecord).not.toHaveBeenCalled();
  });

  it("400 — invalid body (missing required fields)", async () => {
    const res = await POST(makeRequest({ body: "" })); // empty body + no owner fields
    expect(res.status).toBe(400);
  });

  it("404 — box not found", async () => {
    mocks.getBoxRecord.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
  });

  it("403 — box is closed", async () => {
    mocks.getBoxRecord.mockResolvedValue({ ...BOX, isOpen: false });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect(mocks.redis.incr).not.toHaveBeenCalled(); // blocked before rate check
  });

  it("403 — sender is blocked by the box owner", async () => {
    mocks.redis.sismember.mockResolvedValue(1);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect(mocks.redis.incr).not.toHaveBeenCalled();
  });

  it("429 — per-box rate limit exceeded (boxCount > 1)", async () => {
    mocks.redis.incr
      .mockResolvedValueOnce(2)  // boxCount — exceeded
      .mockResolvedValueOnce(1); // globalCount
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
    expect(mocks.writeQuestion).not.toHaveBeenCalled();
  });

  it("429 — global rate limit exceeded (globalCount > 5)", async () => {
    mocks.redis.incr
      .mockResolvedValueOnce(1)  // boxCount — ok
      .mockResolvedValueOnce(6); // globalCount — exceeded
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
    expect(mocks.writeQuestion).not.toHaveBeenCalled();
  });

  it("expire is always called regardless of incr value (TOCTOU guard)", async () => {
    await POST(makeRequest(VALID_BODY));
    // expire must be called for both keys unconditionally
    expect(mocks.redis.expire).toHaveBeenCalledTimes(2);
  });

  it("403 — spam: brand-new account + few followers + few posts", async () => {
    mocks.getProfile.mockResolvedValue({
      followersCount: 2,
      postsCount: 4,
      createdAt: new Date().toISOString(), // created right now
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect(mocks.writeQuestion).not.toHaveBeenCalled();
  });

  it("200 — passes spam check if any one condition is NOT met (old account)", async () => {
    mocks.getProfile.mockResolvedValue({
      followersCount: 2,
      postsCount: 4,
      createdAt: "2020-01-01T00:00:00Z", // old account → not spam
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
  });

  it("503 — owner OAuth session missing or expired", async () => {
    mocks.restoreOAuthSession.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect(mocks.writeQuestion).not.toHaveBeenCalled();
  });

  it("200 — encrypts sender DID and writes question to owner's PDS", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mocks.encryptDid).toHaveBeenCalledWith(BOX.publicKeyHex, SENDER.did);
    expect(mocks.writeQuestion).toHaveBeenCalledWith({
      sessionFetch: expect.any(Function),
      ownerDid: VALID_BODY.boxOwnerDid,
      boxUri: BOX.uri,
      encryptedFrom: "encrypted-sender-did",
      body: VALID_BODY.body,
    });
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
