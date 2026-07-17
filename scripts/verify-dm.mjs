// Local DM-delivery verification (no browser / no OAuth / no prod).
//
// Logs in the official account with its app password and sends a test DM to a
// target account, exercising the exact path notify.server.ts uses:
//   login → withProxy(bsky_chat) → getConvoForMembers → sendMessage
//
// Creds are read from .dev.vars (gitignored) so nothing lands in shell history:
//   MADO_OFFICIAL_IDENTIFIER=<official handle or did>
//   MADO_OFFICIAL_APP_PASSWORD=<app password WITH dm access>
//   MADO_OFFICIAL_PDS=<optional, defaults to https://bsky.social>
//
// Usage:  node scripts/verify-dm.mjs <target-handle-or-did>
//   - target that FOLLOWS the official account  → should deliver (SENT ✓)
//   - target that does NOT follow                → should be rejected (validates the gate)

import { AtpAgent } from "@atproto/api";
import { readFileSync } from "node:fs";

function loadDevVars() {
  const out = {};
  try {
    const txt = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .dev.vars — fall back to process.env below */
  }
  return out;
}

const vars = loadDevVars();
const identifier = vars.MADO_OFFICIAL_IDENTIFIER ?? process.env.MADO_OFFICIAL_IDENTIFIER;
const password = vars.MADO_OFFICIAL_APP_PASSWORD ?? process.env.MADO_OFFICIAL_APP_PASSWORD;
const service = vars.MADO_OFFICIAL_PDS ?? process.env.MADO_OFFICIAL_PDS ?? "https://bsky.social";
const target = process.argv[2] ?? vars.VERIFY_TARGET;

if (!identifier || !password) {
  console.error("✗ .dev.vars に MADO_OFFICIAL_IDENTIFIER / MADO_OFFICIAL_APP_PASSWORD がありません");
  process.exit(1);
}
if (!target) {
  console.error("✗ usage: node scripts/verify-dm.mjs <target-handle-or-did>");
  process.exit(1);
}

const agent = new AtpAgent({ service });

try {
  await agent.login({ identifier, password });
  console.log(`✓ login: @${agent.session?.handle} (${agent.session?.did})`);
} catch (err) {
  console.error("✗ login failed:", err?.message ?? err);
  process.exit(1);
}

let targetDid = target;
if (!target.startsWith("did:")) {
  try {
    const r = await agent.resolveHandle({ handle: target });
    targetDid = r.data.did;
  } catch (err) {
    console.error(`✗ handle resolve failed for ${target}:`, err?.message ?? err);
    process.exit(1);
  }
}
console.log(`→ target: ${targetDid}`);

try {
  const proxied = agent.withProxy("bsky_chat", "did:web:api.bsky.chat");
  const convo = await proxied.chat.bsky.convo.getConvoForMembers({ members: [targetDid] });
  console.log(`✓ convo: ${convo.data.convo.id}`);
  const res = await proxied.chat.bsky.convo.sendMessage({
    convoId: convo.data.convo.id,
    message: { text: "🪟 Mado通知の疎通テストです（これが届けばDM通知は動作します）" },
  });
  console.log(`\n✅ SENT — message id ${res.data.id}`);
  console.log("   → 宛先のBluesky DMを確認してください。");
} catch (err) {
  console.error(`\n❌ DM送信に失敗: ${err?.message ?? err}`);
  console.error("   フォローしていない相手 / DM閉じ / App PasswordのDMスコープ無し のいずれかが典型。");
  process.exit(1);
}
