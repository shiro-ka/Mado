import type { CloudflareStore, AppSession } from "./store.js";
import type { SessionFetch } from "./oauth.server.js";
import { restoreAnyOAuthSession } from "./oauth.server.js";
import {
  writeQuestion,
  writeAnswer,
  getBoxRecord,
  getKoeRecord,
  getProfile,
  deleteRecord,
  invalidateRecords,
  createBskyPost,
  NSID,
} from "./atproto/index.js";
import { notifyNewKoe } from "./notify.server.js";
import { appOrigin } from "./api.server.js";
import { koePath, koeUri as koeUriOf, rkeyOfUri } from "./urls.js";

export type Outcome<T> = { ok: true; value: T } | { ok: false; status: number; message: string };

const refuse = (status: number, message: string) => ({ ok: false, status, message }) as const;

const RATE_BOX_TTL = 60;
const RATE_GLOBAL_TTL = 300;
const SPAM_SCORE_THRESHOLD = 6;

type Env = App.Platform["env"];

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function spamScore(profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>): number {
  const day = 24 * 60 * 60 * 1000;
  const createdAt = profile.createdAt ? new Date(profile.createdAt).getTime() : null;
  const ageDays = createdAt !== null ? (Date.now() - createdAt) / day : Infinity;
  const followers = profile.followersCount ?? 0;
  const follows = profile.followsCount ?? 0;
  const posts = profile.postsCount ?? 0;

  let score = 0;
  if (ageDays < 7) score += 2;
  else if (ageDays < 30) score += 1;
  if (followers === 0) score += 2;
  else if (followers < 3) score += 1;
  if (posts === 0) score += 2;
  else if (posts < 5) score += 1;
  if (!profile.avatar) score += 1;
  if (!profile.displayName) score += 1;
  if (follows > 50 && follows > followers * 10) score += 1;
  return score;
}

export async function sendKoe(
  env: Env,
  store: CloudflareStore,
  ctx: App.Platform["ctx"],
  senderDid: string,
  input: { body: string; ownerDid: string; boxRkey: string },
): Promise<Outcome<{ uri: string }>> {
  const { body, ownerDid, boxRkey } = input;

  const [box, blocked] = await Promise.all([getBoxRecord(ownerDid, boxRkey), store.isBlocked(ownerDid, senderDid)]);
  if (!box) return refuse(404, "窓が見つかりません");
  if (!box.isOpen) return refuse(403, "この窓は現在受け付けていません");
  if (blocked) return refuse(403, "この窓への送信が制限されています");

  const profilePromise = getProfile(senderDid);
  const ownerSessionPromise = restoreAnyOAuthSession(env, store, ownerDid);
  ctx.waitUntil(ownerSessionPromise);

  const bodyHash = await sha256Hex(`${ownerDid}:${boxRkey}:${body}`);
  if ((await store.hitLimit(`dedupe:send:${senderDid}:${bodyHash}`, RATE_BOX_TTL)) !== 1) {
    return refuse(429, "同じ声を送信したばかりです。しばらく待ってから再送してください。");
  }
  if ((await store.hitLimit(`rate:box:${senderDid}:${boxRkey}`, RATE_BOX_TTL)) > 1) {
    return refuse(429, "送信が多すぎます。しばらく待ってから再試行してください");
  }

  const senderProfile = await profilePromise;
  if (senderProfile && spamScore(senderProfile) >= SPAM_SCORE_THRESHOLD) {
    return refuse(403, "アカウントの状態により送信できません");
  }

  if ((await store.hitLimit(`rate:global:${senderDid}`, RATE_GLOBAL_TTL)) > 5) {
    return refuse(429, "送信が多すぎます。しばらく待ってから再試行してください");
  }

  const ownerFetch = await ownerSessionPromise;
  if (!ownerFetch) return refuse(503, "この窓は現在利用できません");

  const delivered = await deliverKoe(store, ownerFetch, { ownerDid, boxUri: box.uri, boxRkey, senderDid, body });
  if (!delivered) return refuse(500, "声の送信に失敗しました");

  ctx.waitUntil(store.pruneLimits());
  ctx.waitUntil(notifyNewKoe(env, store, { ownerDid, boxTitle: box.title, body }));
  return { ok: true, value: delivered };
}

async function deliverKoe(
  store: CloudflareStore,
  ownerFetch: SessionFetch,
  koe: { ownerDid: string; boxUri: string; boxRkey: string; senderDid: string; body: string },
): Promise<{ uri: string } | null> {
  const result = await writeQuestion({ sessionFetch: ownerFetch, ownerDid: koe.ownerDid, boxUri: koe.boxUri, body: koe.body });
  if (!result) return null;

  const koeRkey = rkeyOfUri(result.uri);
  try {
    await store.recordDelivery({
      ownerDid: koe.ownerDid,
      koeRkey,
      boxRkey: koe.boxRkey,
      senderDid: koe.senderDid,
      body: koe.body,
    });
  } catch (err) {
    console.error("[sendKoe] delivery record failed, rolling back the koe", err);
    await deleteRecord({ sessionFetch: ownerFetch, did: koe.ownerDid, collection: NSID.KOE, rkey: koeRkey });
    invalidateRecords(koe.ownerDid, NSID.KOE);
    return null;
  }
  return { uri: result.uri };
}

export async function answerKoe(
  env: Env,
  store: CloudflareStore,
  owner: AppSession,
  ownerFetch: SessionFetch,
  input: { koeUri: string; body: string; crosspost: boolean },
): Promise<Outcome<{ uri: string; crossposted: boolean; crosspostUri: string | null }>> {
  const rkey = rkeyOfUri(input.koeUri);
  if (input.koeUri !== koeUriOf(owner.did, rkey)) return refuse(403, "この声に返信する権限がありません");

  const result = await writeAnswer({ sessionFetch: ownerFetch, ownerDid: owner.did, koeUri: input.koeUri, body: input.body });
  if (!result) return refuse(500, "返信の投稿に失敗しました");
  await store.markHandled(owner.did, rkey);

  if (!input.crosspost) return { ok: true, value: { uri: result.uri, crossposted: false, crosspostUri: null } };

  const koe = await getKoeRecord(owner.did, rkey);
  const box = koe ? await getBoxRecord(owner.did, rkeyOfUri(koe.boxUri)) : null;
  const post = await createBskyPost({
    sessionFetch: ownerFetch,
    ownerDid: owner.did,
    text: input.body,
    pageUrl: box ? appOrigin(env) + koePath(owner.handle, box.slug, rkey) : undefined,
    ownerName: owner.displayName || owner.handle,
  });
  return { ok: true, value: { uri: result.uri, crossposted: post !== null, crosspostUri: post?.uri ?? null } };
}
