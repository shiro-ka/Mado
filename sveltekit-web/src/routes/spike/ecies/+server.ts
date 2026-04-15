import type { RequestHandler } from "./$types";
import { PrivateKey, PublicKey, encrypt as eciesEncrypt, decrypt as eciesDecrypt } from "eciesjs";

export const GET: RequestHandler = async () => {
  const report: Record<string, unknown> = {};
  let ok = false;

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
    report.roundtrip = { ok: recovered === plaintext };

    let loopOk = true;
    for (let i = 0; i < 10; i++) {
      const c = eciesEncrypt(PublicKey.fromHex(pubHex).toBytes(), Buffer.from(plaintext, "utf-8"));
      const p = eciesDecrypt(rehydrated.secret, c);
      if (Buffer.from(p).toString("utf-8") !== plaintext) { loopOk = false; break; }
    }
    report.loop10 = { ok: loopOk };

    ok = (report.rehydrate as { ok: boolean }).ok &&
         (report.roundtrip as { ok: boolean }).ok &&
         loopOk;
  } catch (e) {
    report.error = String(e);
  }

  return Response.json({ ok, report }, { status: ok ? 200 : 500 });
};
