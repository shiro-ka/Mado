/**
 * Step 1 smoke test — ECIES + Buffer on Cloudflare Workers.
 *
 * Pass criteria:
 *  - `new PrivateKey()` succeeds
 *  - A known hex private key can be rehydrated via `PrivateKey.fromHex()`
 *  - Round-trip encrypt/decrypt of a known plaintext matches
 *  - Buffer.from(...).toString("hex"|"base64") works under nodejs_compat
 *
 * Run via the spike worker: GET /spike/ecies
 */
import { PrivateKey, PublicKey, encrypt as eciesEncrypt, decrypt as eciesDecrypt } from "eciesjs";

export async function eciesSmoke(): Promise<{ ok: boolean; report: Record<string, unknown> }> {
  const report: Record<string, unknown> = {};

  try {
    const kp = new PrivateKey();
    const privHex = Buffer.from(kp.secret).toString("hex");
    const pubHex = kp.publicKey.toHex();
    report.generate = { privHexLen: privHex.length, pubHexLen: pubHex.length };

    const rehydrated = PrivateKey.fromHex(privHex);
    report.rehydrate = { ok: rehydrated.publicKey.toHex() === pubHex };

    const plaintext = "did:plc:smoke-test-sender";
    const ct = eciesEncrypt(PublicKey.fromHex(pubHex).toBytes(), Buffer.from(plaintext, "utf-8"));
    const ctB64 = Buffer.from(ct).toString("base64");
    const pt = eciesDecrypt(rehydrated.secret, Buffer.from(ctB64, "base64"));
    const recovered = Buffer.from(pt).toString("utf-8");
    report.roundtrip = { ok: recovered === plaintext, ctB64Len: ctB64.length };

    let loopOk = true;
    for (let i = 0; i < 10; i++) {
      const c = eciesEncrypt(PublicKey.fromHex(pubHex).toBytes(), Buffer.from(plaintext, "utf-8"));
      const p = eciesDecrypt(rehydrated.secret, c);
      if (Buffer.from(p).toString("utf-8") !== plaintext) {
        loopOk = false;
        break;
      }
    }
    report.loop10 = { ok: loopOk };

    const ok =
      (report.rehydrate as { ok: boolean }).ok &&
      (report.roundtrip as { ok: boolean }).ok &&
      loopOk;
    return { ok, report };
  } catch (e) {
    report.error = String(e);
    report.stack = e instanceof Error ? e.stack : undefined;
    return { ok: false, report };
  }
}
