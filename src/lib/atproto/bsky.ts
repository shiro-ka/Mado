import type { SessionFetch } from "../oauth.server.js";
import { xrpc } from "./client.js";

/* Bluesky（app.bsky.*）への働きかけ。Mado のデータではなく、
   「公式アカウントをフォローする」「投稿する」という外向きの副作用をまとめた場所。 */

/**
 * Whether the authenticated viewer follows `actorDid`. Reads viewer state from
 * an authenticated getProfile (the PDS proxies the appview), so it must be
 * called with the *viewer's* session, not the box owner's. Non-throwing —
 * returns false on any failure.
 */
export async function getViewerFollowsActor(
  sessionFetch: SessionFetch,
  actorDid: string
): Promise<boolean> {
  try {
    const data = await xrpc<{ viewer?: { following?: string } }>({
      sessionFetch,
      method: "GET",
      lexicon: `app.bsky.actor.getProfile?actor=${encodeURIComponent(actorDid)}`,
    });
    return typeof data.viewer?.following === "string";
  } catch {
    return false;
  }
}

/**
 * Write an app.bsky.graph.follow record to the viewer's repo, following
 * `subjectDid`. Used by the notification opt-in flow so the owner follows the
 * official account (required for the official DM to be delivered).
 */
export async function writeFollow(params: {
  sessionFetch: SessionFetch;
  did: string;
  subjectDid: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, did, subjectDid } = params;
  try {
    const record = {
      $type: "app.bsky.graph.follow",
      subject: subjectDid,
      createdAt: new Date().toISOString(),
    };
    return await xrpc<{ uri: string; cid: string }>({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.createRecord",
      body: { repo: did, collection: "app.bsky.graph.follow", record },
    });
  } catch {
    return null;
  }
}

async function uploadThumb(
  sessionFetch: SessionFetch,
  imageUrl: string
): Promise<unknown | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const data = await imgRes.arrayBuffer();
    const uploadRes = await sessionFetch("/xrpc/com.atproto.repo.uploadBlob", {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: data,
    });
    if (!uploadRes.ok) return null;
    const json = (await uploadRes.json()) as { blob: unknown };
    return json.blob;
  } catch {
    return null;
  }
}

export async function createBskyPost(params: {
  sessionFetch: SessionFetch;
  ownerDid: string;
  text: string;
  pageUrl?: string;
  ownerName?: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, ownerDid, text, pageUrl, ownerName } = params;
  const LIMIT = 280;
  const truncated = text.length > LIMIT ? text.slice(0, LIMIT - 1) + "…" : text;

  const record: Record<string, unknown> = {
    $type: "app.bsky.feed.post",
    text: truncated,
    createdAt: new Date().toISOString(),
    langs: ["ja"],
  };

  if (pageUrl) {
    const ogImageUrl = pageUrl.replace("/@", "/og/@");
    const thumb = await uploadThumb(sessionFetch, ogImageUrl);
    record.embed = {
      $type: "app.bsky.embed.external",
      external: {
        uri: pageUrl,
        // Match the koe page's og:title. The OG image (thumb) already renders
        // the question body, so the description is left empty to avoid a
        // duplicate caption under the card.
        title: ownerName ? `${ownerName} への声 - Mado 半匿名メッセージ` : "Mado 半匿名メッセージ",
        description: "",
        ...(thumb ? { thumb } : {}),
      },
    };
  }

  try {
    return await xrpc<{ uri: string; cid: string }>({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.createRecord",
      body: {
        repo: ownerDid,
        collection: "app.bsky.feed.post",
        record,
      },
    });
  } catch {
    return null;
  }
}
