import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted ensures these mocks are available when vi.mock factories run
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redis: {
    sadd: vi.fn(),
    srem: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/redis", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/redis")>();
  return {
    ...actual,
    getRedis: () => mocks.redis,
  };
});

// Route handlers are imported after mocks are registered
const { POST } = await import("@/app/api/blocks/create/route");
const { DELETE } = await import("@/app/api/blocks/remove/route");

const OWNER = { did: "did:plc:owner111", handle: "owner.bsky.social" };
const SENDER_DID = "did:plc:sender222";

function makeRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }) as never; // NextRequest is a superset of Request
}

describe("POST /api/blocks/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(OWNER);
    mocks.redis.sadd.mockResolvedValue(1);
  });

  it("401 — not authenticated", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await POST(makeRequest("http://localhost/api/blocks/create", "POST", { senderDid: SENDER_DID }));
    expect(res.status).toBe(401);
  });

  it("400 — missing senderDid", async () => {
    const res = await POST(makeRequest("http://localhost/api/blocks/create", "POST", {}));
    expect(res.status).toBe(400);
    expect(mocks.redis.sadd).not.toHaveBeenCalled();
  });

  it("400 — cannot self-block", async () => {
    const res = await POST(makeRequest("http://localhost/api/blocks/create", "POST", { senderDid: OWNER.did }));
    expect(res.status).toBe(400);
    expect(mocks.redis.sadd).not.toHaveBeenCalled();
  });

  it("200 — adds senderDid to owner's blocklist", async () => {
    const res = await POST(makeRequest("http://localhost/api/blocks/create", "POST", { senderDid: SENDER_DID }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mocks.redis.sadd).toHaveBeenCalledWith(
      `blocklist:${OWNER.did}`,
      SENDER_DID
    );
  });

  it("200 — different owner sessions keep separate blocklists", async () => {
    const owner2 = { did: "did:plc:owner999", handle: "other.bsky.social" };
    mocks.getSession.mockResolvedValue(owner2);

    await POST(makeRequest("http://localhost/api/blocks/create", "POST", { senderDid: SENDER_DID }));
    expect(mocks.redis.sadd).toHaveBeenCalledWith(
      `blocklist:${owner2.did}`,
      SENDER_DID
    );
  });
});

describe("DELETE /api/blocks/remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(OWNER);
    mocks.redis.srem.mockResolvedValue(1);
  });

  it("401 — not authenticated", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await DELETE(makeRequest("http://localhost/api/blocks/remove", "DELETE", { senderDid: SENDER_DID }));
    expect(res.status).toBe(401);
  });

  it("400 — missing senderDid", async () => {
    const res = await DELETE(makeRequest("http://localhost/api/blocks/remove", "DELETE", {}));
    expect(res.status).toBe(400);
    expect(mocks.redis.srem).not.toHaveBeenCalled();
  });

  it("200 — removes senderDid from owner's blocklist", async () => {
    const res = await DELETE(makeRequest("http://localhost/api/blocks/remove", "DELETE", { senderDid: SENDER_DID }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mocks.redis.srem).toHaveBeenCalledWith(
      `blocklist:${OWNER.did}`,
      SENDER_DID
    );
  });

  it("200 — removing a non-blocked user is a no-op (srem returns 0)", async () => {
    mocks.redis.srem.mockResolvedValue(0); // 0 = member was not in set
    const res = await DELETE(makeRequest("http://localhost/api/blocks/remove", "DELETE", { senderDid: SENDER_DID }));
    // Should still succeed — idempotent
    expect(res.status).toBe(200);
  });
});
