import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  restoreOAuthSession: vi.fn(),
  writeAnswer: vi.fn(),
  createBskyPost: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/oauth", () => ({
  restoreOAuthSession: mocks.restoreOAuthSession,
}));

vi.mock("@/lib/atproto", () => ({
  writeAnswer: mocks.writeAnswer,
  createBskyPost: mocks.createBskyPost,
  NSID: { KOE: "blue.mado.koe" },
}));

const { POST } = await import("@/app/api/answers/create/route");

const SESSION = { did: "did:plc:owner111", handle: "owner.bsky.social" };
const KOE_URI = `at://${SESSION.did}/blue.mado.koe/abc123`;

function makeRequest(body?: unknown) {
  return new Request("http://localhost/api/answers/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }) as never;
}

describe("POST /api/answers/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(SESSION);
    mocks.restoreOAuthSession.mockResolvedValue(() => {});
    mocks.writeAnswer.mockResolvedValue({ uri: "at://result/..." });
    mocks.createBskyPost.mockResolvedValue(undefined);
  });

  it("401 — not authenticated", async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ koeUri: KOE_URI, body: "answer" }));
    expect(res.status).toBe(401);
    expect(mocks.writeAnswer).not.toHaveBeenCalled();
  });

  it("400 — missing body field", async () => {
    const res = await POST(makeRequest({ koeUri: KOE_URI })); // body field is missing
    expect(res.status).toBe(400);
    expect(mocks.writeAnswer).not.toHaveBeenCalled();
  });

  it("403 — koeUri belongs to another user's repo", async () => {
    const foreignUri = "at://did:plc:other999/blue.mado.koe/abc123";
    const res = await POST(makeRequest({ koeUri: foreignUri, body: "answer" }));
    expect(res.status).toBe(403);
    expect(mocks.writeAnswer).not.toHaveBeenCalled();
  });

  it("401 — OAuth session expired or missing", async () => {
    mocks.restoreOAuthSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ koeUri: KOE_URI, body: "answer" }));
    expect(res.status).toBe(401);
    expect(mocks.writeAnswer).not.toHaveBeenCalled();
  });

  it("500 — writeAnswer returns null", async () => {
    mocks.writeAnswer.mockResolvedValue(null);
    const res = await POST(makeRequest({ koeUri: KOE_URI, body: "answer" }));
    expect(res.status).toBe(500);
  });

  it("200 — success without crosspost (default)", async () => {
    const res = await POST(makeRequest({ koeUri: KOE_URI, body: "my answer" }));
    expect(res.status).toBe(200);
    expect(mocks.writeAnswer).toHaveBeenCalledWith({
      sessionFetch: expect.any(Function),
      ownerDid: SESSION.did,
      koeUri: KOE_URI,
      body: "my answer",
    });
    expect(mocks.createBskyPost).not.toHaveBeenCalled();
    const resBody = await res.json();
    expect(resBody.success).toBe(true);
  });

  it("200 — crosspost: true triggers createBskyPost", async () => {
    const res = await POST(makeRequest({ koeUri: KOE_URI, body: "my answer", crosspost: true }));
    expect(res.status).toBe(200);
    expect(mocks.createBskyPost).toHaveBeenCalledWith({
      sessionFetch: expect.any(Function),
      ownerDid: SESSION.did,
      text: "my answer",
    });
  });
});
