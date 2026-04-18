import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { generateKeyPair, encryptDid, decryptDid } from "$lib/crypto.js";

export const GET: RequestHandler = async ({ platform }) => {
  const env = platform!.env;
  const store = new CloudflareStore(env);
  const report: Record<string, unknown> = {};
  let ok = false;

  try {
    // ── KV: OAuth state (TTL) ────────────────────────────────────────────────
    await store.setOAuthState("smoke-key", { nonce: "abc123" });
    const state = await store.getOAuthState("smoke-key");
    await store.delOAuthState("smoke-key");
    const afterDel = await store.getOAuthState("smoke-key");
    report.kv_state = {
      ok: state?.nonce === "abc123" && afterDel === undefined,
    };

    // ── KV: App session (TTL + metadata) ────────────────────────────────────
    const testSession = { did: "did:plc:smoke", handle: "smoke.test", displayName: "Smoke" };
    await store.setSession("sess-smoke", testSession, 60);
    const gotSession = await store.getSession("sess-smoke");
    const ttl = await store.sessionTtl("sess-smoke");
    await store.delSession("sess-smoke");
    report.kv_session = {
      ok: gotSession?.did === testSession.did && ttl > 0 && ttl <= 60,
      ttl,
    };

    // ── D1: User registry ────────────────────────────────────────────────────
    const testDid = "did:plc:smoketest9999";
    await store.addUser(testDid);
    const users = await store.listUsers();
    await store.removeUser(testDid);
    const usersAfter = await store.listUsers();
    report.d1_users = {
      ok: users.includes(testDid) && !usersAfter.includes(testDid),
    };

    // ── D1: ECIES keypair (generate + store + fetch + delete) ───────────────
    const { publicKey, privateKey } = generateKeyPair();
    await store.setKeyPair("did:plc:smoke", "smokeBox", privateKey);
    const fetched = await store.getKeyPair("did:plc:smoke", "smokeBox");
    await store.delKeyPair("did:plc:smoke", "smokeBox");
    const missing = await store.getKeyPair("did:plc:smoke", "smokeBox");

    // Verify the stored key still works for ECIES
    const ciphertext = encryptDid(publicKey, "did:plc:senderSmoke");
    const decrypted = fetched ? decryptDid(fetched, ciphertext) : null;
    report.d1_keypair = {
      ok: fetched === privateKey && missing === undefined && decrypted === "did:plc:senderSmoke",
    };

    // ── D1: Blocklist ────────────────────────────────────────────────────────
    await store.addBlock("did:plc:owner", "did:plc:spammer");
    const blocked = await store.isBlocked("did:plc:owner", "did:plc:spammer");
    await store.removeBlock("did:plc:owner", "did:plc:spammer");
    const unblocked = await store.isBlocked("did:plc:owner", "did:plc:spammer");
    report.d1_blocks = { ok: blocked && !unblocked };

    // ── D1: Read state ───────────────────────────────────────────────────────
    await store.markRead("did:plc:owner", "rkey111");
    const reads = await store.listRead("did:plc:owner");
    report.d1_reads = { ok: reads.includes("rkey111") };
    await store.unmarkRead("did:plc:owner", "rkey111");

    // ── D1: Sent history (push + trim + list) ────────────────────────────────
    const ref = {
      ownerDid: "did:plc:owner",
      koeRkey: "rkey999",
      sentAt: new Date().toISOString(),
      body: "smoke test question",
    };
    await store.pushSent("did:plc:sender", ref, 200);
    const sent = await store.listSent("did:plc:sender", 10);
    report.d1_sent = { ok: sent.length > 0 && sent[0].koeRkey === "rkey999" };

    // ── D1: Sent-read state ──────────────────────────────────────────────────
    await store.markSentRead("did:plc:sender", "token-abc");
    const isRead = await store.isSentRead("did:plc:sender", "token-abc");
    const notRead = await store.isSentRead("did:plc:sender", "token-xyz");
    report.d1_sent_reads = { ok: isRead && !notRead };

    // ── KV: Rate limiting ────────────────────────────────────────────────────
    const c1 = await store.incrRate("rate:smoke", 60);
    const c2 = await store.incrRate("rate:smoke", 60);
    report.kv_rate = { ok: c1 === 1 && c2 === 2 };

    ok = Object.values(report).every((v) => (v as { ok: boolean }).ok === true);
  } catch (e) {
    report.error = String(e);
  }

  return Response.json({ ok, report }, { status: ok ? 200 : 500 });
};
