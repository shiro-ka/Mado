import { AtpAgent, type AtpSessionData } from "@atproto/api";
import type { CloudflareStore } from "./store.js";
import { resolveHandle } from "./atproto/index.js";

/**
 * Official-account DM notifications.
 *
 * When a koe lands, the box owner can opt in (notification_prefs.dm_enabled) to
 * receive a DM from the official Mado account. This is a *supplement* to the
 * /receive inbox — the inbox always has every koe, so every step here is
 * best-effort and non-fatal:
 *
 *   - Not configured (no official creds in env)     → skip silently
 *   - Owner opted out                               → skip silently
 *   - Owner doesn't follow official / DMs closed     → sendMessage throws, swallowed
 *
 * Bluesky only delivers DMs from accounts the recipient follows (default DM
 * setting), so the opt-in flow must also get the owner to follow the official
 * account — otherwise sendMessage fails and the koe is only visible in /receive.
 */

const CHAT_PROXY_DID = "did:web:api.bsky.chat";
const CHAT_SERVICE_TYPE = "bsky_chat";
// Cached official-account atproto session (app-password login). Reused across
// requests so we don't hit createSession rate limits; refreshed tokens are
// persisted back via the persistSession callback.
const OFFICIAL_SESSION_KEY = "official:chat-session";
const DEFAULT_OFFICIAL_PDS = "https://bsky.social";

type Env = App.Platform["env"];

/**
 * The official Mado account the opt-in flow points users at. Returns null when
 * MADO_OFFICIAL_HANDLE isn't configured (notifications not set up) or the
 * handle can't be resolved. `handle` drives the UI/profile link; `did` is used
 * as the follow-record subject and for viewer-follow detection.
 */
export async function getOfficialAccount(
  env: Env
): Promise<{ handle: string; did: string } | null> {
  const handle = env.MADO_OFFICIAL_HANDLE;
  if (!handle) return null;
  const did = await resolveHandle(handle);
  if (!did) return null;
  return { handle, did };
}

/**
 * Restore (or freshly log in) the official account's agent. Returns null when
 * the feature isn't configured or login fails — callers treat null as "skip".
 */
async function officialAgent(env: Env): Promise<AtpAgent | null> {
  const identifier = env.MADO_OFFICIAL_IDENTIFIER;
  const password = env.MADO_OFFICIAL_APP_PASSWORD;
  if (!identifier || !password) return null; // notifications not configured

  const agent = new AtpAgent({
    service: env.MADO_OFFICIAL_PDS ?? DEFAULT_OFFICIAL_PDS,
    persistSession: (_evt, session) => {
      // Best-effort cache refresh; keeps rotating access/refresh tokens warm.
      if (session) {
        void env.MADO_SESSION.put(
          OFFICIAL_SESSION_KEY,
          JSON.stringify(session)
        ).catch(() => {});
      }
    },
  });

  const cachedRaw = await env.MADO_SESSION.get(OFFICIAL_SESSION_KEY);
  if (cachedRaw) {
    try {
      await agent.resumeSession(JSON.parse(cachedRaw) as AtpSessionData);
      return agent;
    } catch {
      // Stale / revoked cache — fall through to a fresh login.
    }
  }

  try {
    await agent.login({ identifier, password });
    return agent;
  } catch (err) {
    console.warn("[notify] official login failed", err);
    return null;
  }
}

/**
 * Send a DM from the official account to `recipientDid`. Returns whether it
 * was delivered. Never throws.
 */
export async function sendOfficialDm(
  env: Env,
  recipientDid: string,
  text: string
): Promise<boolean> {
  const agent = await officialAgent(env);
  if (!agent) return false;

  try {
    // DMs live on the dedicated chat service, reached via the service proxy
    // header (`did:web:api.bsky.chat#bsky_chat`). The app password must have
    // DM access enabled, else this errors with "Bad token scope".
    const proxied = agent.withProxy(CHAT_SERVICE_TYPE, CHAT_PROXY_DID);
    const convo = await proxied.chat.bsky.convo.getConvoForMembers({
      members: [recipientDid],
    });
    await proxied.chat.bsky.convo.sendMessage({
      convoId: convo.data.convo.id,
      message: { text },
    });
    return true;
  } catch (err) {
    // Most commonly: recipient doesn't follow the official account or has DMs
    // closed. Non-fatal — the koe is still in their /receive inbox.
    console.warn("[notify] sendOfficialDm failed", err);
    return false;
  }
}

/**
 * Notify a box owner that a new koe arrived, if they've opted into DM
 * notifications. Fire-and-forget: intended to run under `ctx.waitUntil`.
 */
export async function notifyNewKoe(
  env: Env,
  store: CloudflareStore,
  params: { ownerDid: string; boxTitle?: string; body: string }
): Promise<void> {
  try {
    if (!(await store.isDmNotifyEnabled(params.ownerDid))) return;

    const appUrl = env.APP_URL ?? "https://mado.blue";
    const preview =
      params.body.length > 60 ? params.body.slice(0, 60) + "…" : params.body;
    const where = params.boxTitle ? `「${params.boxTitle}」` : "あなたのMado";
    const text = `🪟 ${where}に新しい声が届きました。\n\n${preview}\n\n受信トレイで確認 → ${appUrl}/receive`;

    await sendOfficialDm(env, params.ownerDid, text);
  } catch (err) {
    console.warn("[notify] notifyNewKoe error", err);
  }
}
